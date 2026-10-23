import { afterEach, describe, expect, it, vi } from "vitest"
import { SignJWT, generateKeyPair, type JWTVerifyGetKey } from "jose"
import { bearerToken, TokenError, verifyFirebaseIdToken } from "@/lib/server/firebase-token"
import { authenticateRequest, canAccessTenant } from "@/lib/server/request-auth"

const PROJECT = "nexoerp-88c6e"
const now = () => Math.floor(Date.now() / 1000)

async function setup() {
  const { publicKey, privateKey } = await generateKeyPair("RS256")
  const other = await generateKeyPair("RS256")
  const keys: JWTVerifyGetKey = async () => publicKey
  const sign = (claims: Record<string, unknown> = {}, opts: { key?: CryptoKey; iss?: string; aud?: string; exp?: number; sub?: string | null } = {}) => {
    const jwt = new SignJWT({ auth_time: now() - 10, email: "persona@example.com", email_verified: true, ...claims })
      .setProtectedHeader({ alg: "RS256", kid: "k1" })
      .setIssuedAt()
      .setIssuer(opts.iss ?? `https://securetoken.google.com/${PROJECT}`)
      .setAudience(opts.aud ?? PROJECT)
      .setExpirationTime(opts.exp ?? now() + 3600)
    if (opts.sub !== null) jwt.setSubject(opts.sub ?? "uid-123")
    return jwt.sign(opts.key ?? privateKey)
  }
  return { keys, sign, otherKey: other.privateKey }
}

describe("Verificación server-side de ID tokens de Firebase", () => {
  it("acepta un token válido y extrae los claims confiables", async () => {
    const { keys, sign } = await setup()
    const p = await verifyFirebaseIdToken(await sign({ platformAdmin: true, companyId: "org-soleilwire", tenantRole: "admin" }), { projectId: PROJECT, keys })
    expect(p).toMatchObject({ uid: "uid-123", platformAdmin: true, tenantId: "org-soleilwire", tenantRole: "admin", source: "firebase" })
  })

  it("el correo NO concede privilegios: sin el claim, operaciones@nexo.com no es administrador", async () => {
    const { keys, sign } = await setup()
    const p = await verifyFirebaseIdToken(await sign({ email: "operaciones@nexo.com" }), { projectId: PROJECT, keys })
    expect(p.email).toBe("operaciones@nexo.com")
    expect(p.platformAdmin).toBe(false)
    expect(canAccessTenant(p, "org-soleilwire")).toBe(false)
  })

  it("solo `platformAdmin === true` (booleano) cuenta; cadenas y otros valores no", async () => {
    const { keys, sign } = await setup()
    for (const v of ["true", 1, "yes", null]) {
      const p = await verifyFirebaseIdToken(await sign({ platformAdmin: v }), { projectId: PROJECT, keys })
      expect(p.platformAdmin).toBe(false)
    }
  })

  it.each([
    ["firmado con otra llave", { other: true }],
    ["emisor equivocado", { iss: "https://securetoken.google.com/otro-proyecto" }],
    ["audiencia equivocada", { aud: "otro-proyecto" }],
    ["vencido", { exp: now() - 3600 }],
    ["sin subject", { sub: null }],
  ])("rechaza un token %s", async (_label, opts) => {
    const { keys, sign, otherKey } = await setup()
    const { other, ...rest } = opts as { other?: boolean; iss?: string; aud?: string; exp?: number; sub?: null }
    const token = await sign({}, { ...rest, key: other ? otherKey : undefined })
    await expect(verifyFirebaseIdToken(token, { projectId: PROJECT, keys })).rejects.toBeInstanceOf(TokenError)
  })

  it("rechaza tokens sin auth_time o con auth_time futuro", async () => {
    const { keys, sign } = await setup()
    await expect(verifyFirebaseIdToken(await sign({ auth_time: undefined }), { projectId: PROJECT, keys })).rejects.toBeInstanceOf(TokenError)
    await expect(verifyFirebaseIdToken(await sign({ auth_time: now() + 3600 }), { projectId: PROJECT, keys })).rejects.toBeInstanceOf(TokenError)
  })

  it("rechaza algoritmos no permitidos (HS256 con secreto adivinado, alg none)", async () => {
    const { keys } = await setup()
    const hs = await new SignJWT({ auth_time: now() - 5, platformAdmin: true })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer(`https://securetoken.google.com/${PROJECT}`)
      .setAudience(PROJECT)
      .setSubject("atacante")
      .setExpirationTime(now() + 3600)
      .sign(new TextEncoder().encode("secreto-adivinado"))
    await expect(verifyFirebaseIdToken(hs, { projectId: PROJECT, keys })).rejects.toBeInstanceOf(TokenError)
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url")
    const body = Buffer.from(JSON.stringify({ sub: "x", iss: `https://securetoken.google.com/${PROJECT}`, aud: PROJECT, exp: now() + 3600, auth_time: now() - 1, platformAdmin: true })).toString("base64url")
    await expect(verifyFirebaseIdToken(`${header}.${body}.`, { projectId: PROJECT, keys })).rejects.toBeInstanceOf(TokenError)
  })

  it("rechaza entradas vacías, malformadas o gigantes", async () => {
    const { keys } = await setup()
    for (const t of ["", "abc", "a.b", "x".repeat(9000)]) await expect(verifyFirebaseIdToken(t, { projectId: PROJECT, keys })).rejects.toBeInstanceOf(TokenError)
  })
})

describe("Tokens del emulador (sin firma): solo con emulador declarado y proyecto demo-*", () => {
  afterEach(() => vi.unstubAllEnvs())
  const unsigned = (project: string, claims: Record<string, unknown> = {}) => {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url")
    const body = Buffer.from(JSON.stringify({ sub: "uid-emu", iss: `https://securetoken.google.com/${project}`, aud: project, exp: now() + 3600, auth_time: now() - 1, platformAdmin: true, ...claims })).toString("base64url")
    return `${header}.${body}.`
  }

  it("se acepta con FIREBASE_AUTH_EMULATOR_HOST y un proyecto demo-*", async () => {
    vi.stubEnv("FIREBASE_AUTH_EMULATOR_HOST", "127.0.0.1:9199")
    vi.stubEnv("VERCEL_ENV", "")
    const p = await verifyFirebaseIdToken(unsigned("demo-nexo-e2e"), { projectId: "demo-nexo-e2e" })
    expect(p).toMatchObject({ uid: "uid-emu", platformAdmin: true })
  })

  it("el proyecto real de producción NUNCA acepta tokens sin firma, aunque la variable del emulador esté puesta", async () => {
    vi.stubEnv("FIREBASE_AUTH_EMULATOR_HOST", "127.0.0.1:9199")
    vi.stubEnv("VERCEL_ENV", "")
    await expect(verifyFirebaseIdToken(unsigned(PROJECT), { projectId: PROJECT })).rejects.toBeInstanceOf(TokenError)
  })

  it("sin emulador declarado o en Vercel tampoco se acepta, ni siquiera en un proyecto demo-*", async () => {
    await expect(verifyFirebaseIdToken(unsigned("demo-nexo-e2e"), { projectId: "demo-nexo-e2e" })).rejects.toBeInstanceOf(TokenError)
    vi.stubEnv("FIREBASE_AUTH_EMULATOR_HOST", "127.0.0.1:9199")
    vi.stubEnv("VERCEL_ENV", "preview")
    await expect(verifyFirebaseIdToken(unsigned("demo-nexo-e2e"), { projectId: "demo-nexo-e2e" })).rejects.toBeInstanceOf(TokenError)
  })

  it("el modo emulador sigue validando emisor, audiencia y vigencia", async () => {
    vi.stubEnv("FIREBASE_AUTH_EMULATOR_HOST", "127.0.0.1:9199")
    vi.stubEnv("VERCEL_ENV", "")
    await expect(verifyFirebaseIdToken(unsigned("demo-nexo-e2e", { aud: "otro" }), { projectId: "demo-nexo-e2e" })).rejects.toBeInstanceOf(TokenError)
    await expect(verifyFirebaseIdToken(unsigned("demo-nexo-e2e", { exp: now() - 3600 }), { projectId: "demo-nexo-e2e" })).rejects.toBeInstanceOf(TokenError)
  })
})

describe("Cabecera Authorization", () => {
  it("solo acepta Bearer con caracteres de token", () => {
    expect(bearerToken("Bearer abc.def.ghi")).toBe("abc.def.ghi")
    expect(bearerToken("bearer abc.def.ghi")).toBeNull()
    expect(bearerToken("Basic abc")).toBeNull()
    expect(bearerToken("Bearer abc def")).toBeNull()
    expect(bearerToken(null)).toBeNull()
  })
})

describe("Autorización por tenant en el servidor", () => {
  const base = { uid: "u", email: null, emailVerified: false, platformSupport: false, tenantRole: null, source: "firebase" as const }
  it("administrador de plataforma: todas las empresas", () => {
    expect(canAccessTenant({ ...base, platformAdmin: true, tenantId: null }, "org-cualquiera")).toBe(true)
  })
  it("usuario normal: solo su empresa, nunca otra aunque el cliente la pida", () => {
    const p = { ...base, platformAdmin: false, tenantId: "org-soleilwire" }
    expect(canAccessTenant(p, "org-soleilwire")).toBe(true)
    expect(canAccessTenant(p, "org-delar")).toBe(false)
    expect(canAccessTenant({ ...p, tenantId: null }, "org-soleilwire")).toBe(false)
  })
})

describe("authenticateRequest (modo firebase)", () => {
  afterEach(() => vi.unstubAllEnvs())
  const stubFirebase = () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("NEXT_PUBLIC_AUTH_MODE", "")
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "k")
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "nexoerp-88c6e.firebaseapp.com")
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", PROJECT)
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_APP_ID", "1:1:web:1")
  }

  it("sin token → 401; una cookie demo o cabeceras de identidad no sirven", async () => {
    stubFirebase()
    const r = await authenticateRequest(new Request("https://x/api", { headers: { cookie: "delar_demo_session=operaciones%40nexo.com", "x-user-email": "operaciones@nexo.com", "x-platform-admin": "true" } }))
    expect(r).toMatchObject({ ok: false, status: 401, code: "unauthenticated" })
  })

  it("token malformado → 401 invalid_token", async () => {
    stubFirebase()
    const r = await authenticateRequest(new Request("https://x/api", { headers: { authorization: "Bearer aaa.bbb.ccc" } }))
    expect(r).toMatchObject({ ok: false, status: 401, code: "invalid_token" })
  })

  it("producción sin configuración → 503, no autenticación ficticia", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("NEXT_PUBLIC_AUTH_MODE", "demo")
    vi.stubEnv("NEXT_PUBLIC_DEMO_ISOLATED", "")
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "")
    const r = await authenticateRequest(new Request("https://x/api", { headers: { cookie: "delar_demo_session=operaciones%40nexo.com" } }))
    expect(r).toMatchObject({ ok: false, status: 503, code: "misconfigured" })
  })
})
