import { randomBytes } from "node:crypto"
import { getApps, initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"
import { SEED_TENANTS } from "../../lib/platform/seed-tenants"

/**
 * Siembra el emulador: usuarios con distintos privilegios REALES (custom claims) y contraseñas aleatorias.
 * Las contraseñas viven solo en memoria de la corrida (process.env), nunca en archivos ni capturas.
 */
export const USERS = {
  ops: { email: "operaciones@nexo.com", claims: { platformAdmin: true }, env: "E2E_PW_OPS" },
  // Correo de otra persona de Nexo: NO es administrador de plataforma
  ventas: { email: "ventas@nexo.com", claims: {}, env: "E2E_PW_VENTAS" },
  soleilAdmin: { email: "gerente@soleil.test", claims: { companyId: "org-soleilwire", tenantRole: "admin" }, env: "E2E_PW_SOLEIL" },
  delar: { email: "usuario@delar.test", claims: { companyId: "org-delar", tenantRole: "user" }, env: "E2E_PW_DELAR" },
} as const

export default async function globalSetup() {
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST || !process.env.FIRESTORE_EMULATOR_HOST) throw new Error("Ejecuta estas pruebas con los emuladores (npm run test:e2e:firebase).")
  if (getApps().length === 0) initializeApp({ projectId: "demo-nexo-e2e" })
  const auth = getAuth()
  const db = getFirestore()
  for (const u of (await auth.listUsers()).users) await auth.deleteUser(u.uid)
  // En Firebase las empresas deben existir en la fuente autorizada; la UI nunca las siembra ni inventa.
  for (const tenant of SEED_TENANTS) await db.doc(`tenants/${tenant.id}`).set(tenant)
  for (const def of Object.values(USERS)) {
    const password = `Pw-${randomBytes(12).toString("base64url")}`
    process.env[def.env] = password
    const user = await auth.createUser({ email: def.email, password, emailVerified: true })
    if (Object.keys(def.claims).length) await auth.setCustomUserClaims(user.uid, def.claims)
    // Perfil sin privilegios; la empresa y los roles viven en los claims firmados
    await db.doc(`users/${user.uid}`).set({ email: def.email, name: def.email.split("@")[0], role: "user" })
  }
}
