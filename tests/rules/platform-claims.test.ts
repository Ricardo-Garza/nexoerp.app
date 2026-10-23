import { execFileSync } from "node:child_process"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"
import { applyClaims, ClaimsError, planPlatformAdmin, planTenantClaims } from "../../scripts/lib/platform-claims.mjs"

/**
 * Procedimiento de asignación de claims contra los emuladores de Auth y Firestore
 * (npm run test:rules). Verifica las salvaguardas: lista autorizada, UID esperado, ensayo por omisión,
 * conservación de claims, bitácora y revocación de refresh tokens.
 */
const PROJECT = "demo-nexo-rules"
let auth: ReturnType<typeof getAuth>
let db: ReturnType<typeof getFirestore>
let opsUid = ""
let ventasUid = ""

beforeAll(() => {
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9199"
  process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8085"
  if (getApps().length === 0) initializeApp({ projectId: PROJECT })
  auth = getAuth()
  db = getFirestore()
  void applicationDefault
})

beforeEach(async () => {
  for (const u of (await auth.listUsers()).users) await auth.deleteUser(u.uid)
  opsUid = (await auth.createUser({ email: "operaciones@nexo.com", password: "Contrasena-De-Prueba-1", emailVerified: true })).uid
  ventasUid = (await auth.createUser({ email: "ventas@nexo.com", password: "Contrasena-De-Prueba-2" })).uid
  await db.doc("tenants/org-soleilwire").set({ name: "Soleil Wire" })
})

const ctx = () => ({ auth, firestore: db })

describe("Asignación segura del claim platformAdmin", () => {
  it("el ensayo (dry-run) calcula el cambio sin escribir nada", async () => {
    const plan = await planPlatformAdmin(auth, { email: "operaciones@nexo.com", expectedUid: opsUid })
    expect(plan.changed).toBe(true)
    expect(plan.next.platformAdmin).toBe(true)
    expect((await auth.getUser(opsUid)).customClaims?.platformAdmin).toBeUndefined()
  })

  it("show refleja el estado actual sin calcular ni sugerir un grant", async () => {
    await auth.setCustomUserClaims(opsUid, { tema: "oscuro" })
    const plan = await planPlatformAdmin(auth, { email: "operaciones@nexo.com", expectedUid: opsUid, action: "show" })
    expect(plan.changed).toBe(false)
    expect(plan.next).toEqual({ tema: "oscuro" })
    expect(plan.next.platformAdmin).toBeUndefined()
  })

  it("exige el UID esperado y rechaza una cuenta con otro UID", async () => {
    await expect(planPlatformAdmin(auth, { email: "operaciones@nexo.com", expectedUid: "" })).rejects.toBeInstanceOf(ClaimsError)
    await expect(planPlatformAdmin(auth, { email: "operaciones@nexo.com", expectedUid: "uid-equivocado" })).rejects.toThrow(/no coincide/)
  })

  it("solo la lista autorizada puede recibirlo; ventas@nexo.com jamás", async () => {
    await expect(planPlatformAdmin(auth, { email: "ventas@nexo.com", expectedUid: ventasUid })).rejects.toThrow(/no puede recibir/)
    await auth.createUser({ email: "otra@nexo.com" }).then(async (u) => {
      await expect(planPlatformAdmin(auth, { email: "otra@nexo.com", expectedUid: u.uid })).rejects.toThrow(/lista autorizada/)
    })
  })

  it("no crea cuentas y no opera sobre cuentas deshabilitadas", async () => {
    await expect(planPlatformAdmin(auth, { email: "operaciones2@nexo.com", expectedUid: "x" })).rejects.toThrow()
    await auth.updateUser(opsUid, { disabled: true })
    await expect(planPlatformAdmin(auth, { email: "operaciones@nexo.com", expectedUid: opsUid })).rejects.toThrow(/deshabilitada/)
  })

  it("al aplicar: conserva otros claims, revoca refresh tokens y registra la bitácora", async () => {
    await auth.setCustomUserClaims(opsUid, { tema: "oscuro" })
    const plan = await planPlatformAdmin(auth, { email: "operaciones@nexo.com", expectedUid: opsUid })
    await applyClaims(ctx(), plan, { action: "claims.grant", operator: "prueba" })
    const claims = (await auth.getUser(opsUid)).customClaims
    expect(claims).toMatchObject({ platformAdmin: true, tema: "oscuro" })
    const audit = (await db.collection("platform_audit").get()).docs.map((d) => d.data())
    expect(audit).toHaveLength(1)
    expect(audit[0]).toMatchObject({ action: "claims.grant", targetUid: opsUid, targetEmail: "operaciones@nexo.com" })
    expect(JSON.stringify(audit[0])).not.toMatch(/Contrasena|password/i)
    expect((await auth.getUser(opsUid)).tokensValidAfterTime).toBeTruthy()
  })

  it("revocar quita el claim y sigue siendo idempotente", async () => {
    await auth.setCustomUserClaims(opsUid, { platformAdmin: true })
    const plan = await planPlatformAdmin(auth, { email: "operaciones@nexo.com", expectedUid: opsUid, action: "revoke" })
    await applyClaims(ctx(), plan, { action: "claims.revoke", operator: "prueba" })
    expect((await auth.getUser(opsUid)).customClaims?.platformAdmin).toBeUndefined()
    const again = await planPlatformAdmin(auth, { email: "operaciones@nexo.com", expectedUid: opsUid, action: "revoke" })
    expect(again.changed).toBe(false)
  })

  it("el CLI sin --apply no cambia nada y con el proyecto equivocado se niega", () => {
    const env = { ...process.env, FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9199", FIRESTORE_EMULATOR_HOST: "127.0.0.1:8085" }
    const out = execFileSync(process.execPath, ["scripts/platform-admin-claim.mjs", "grant", "--email", "operaciones@nexo.com", "--expected-uid", opsUid, "--project", PROJECT], { env, encoding: "utf8" })
    expect(out).toMatch(/ENSAYO/)
    const shown = execFileSync(process.execPath, ["scripts/platform-admin-claim.mjs", "show", "--email", "operaciones@nexo.com", "--expected-uid", opsUid, "--project", PROJECT], { env, encoding: "utf8" })
    expect(shown).toMatch(/Acceso global: ausente/)
    expect(shown).not.toMatch(/Claims resultantes/)
    expect(() => execFileSync(process.execPath, ["scripts/platform-admin-claim.mjs", "grant", "--email", "operaciones@nexo.com", "--expected-uid", opsUid, "--project", "otro-proyecto-real"], { env, encoding: "utf8", stdio: "pipe" })).toThrow()
  })
})

describe("Claims de empresa (Tenant Admin / Tenant User)", () => {
  it("asigna companyId y tenantRole solo si la empresa existe y el UID coincide", async () => {
    const uid = (await auth.createUser({ email: "gerente@soleil.test" })).uid
    const plan = await planTenantClaims(auth, db, { email: "gerente@soleil.test", expectedUid: uid, tenantId: "org-soleilwire", role: "admin" })
    await applyClaims(ctx(), plan, { action: "claims.tenant", operator: "prueba" })
    expect((await auth.getUser(uid)).customClaims).toMatchObject({ companyId: "org-soleilwire", tenantRole: "admin" })
    expect((await auth.getUser(uid)).customClaims?.platformAdmin).toBeUndefined()
    await expect(planTenantClaims(auth, db, { email: "gerente@soleil.test", expectedUid: uid, tenantId: "org-inexistente", role: "user" })).rejects.toThrow(/no existe/)
    await expect(planTenantClaims(auth, db, { email: "gerente@soleil.test", expectedUid: "otro", tenantId: "org-soleilwire", role: "user" })).rejects.toThrow(/no coincide/)
    await expect(planTenantClaims(auth, db, { email: "gerente@soleil.test", expectedUid: uid, tenantId: "org-soleilwire", role: "platform_admin" })).rejects.toThrow(/admin o user/)
  })

  it("la cuenta de plataforma no se asigna a una empresa", async () => {
    await expect(planTenantClaims(auth, db, { email: "operaciones@nexo.com", expectedUid: opsUid, tenantId: "org-soleilwire", role: "admin" })).rejects.toThrow(/plataforma/)
  })
})
