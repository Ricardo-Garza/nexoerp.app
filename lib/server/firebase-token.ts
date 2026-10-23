import "server-only"
import { createRemoteJWKSet, decodeJwt, decodeProtectedHeader, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from "jose"

/**
 * Verificación server-side de ID tokens de Firebase Authentication SIN credenciales de servicio:
 * se valida la firma RS256 contra las llaves públicas de Google (securetoken), el emisor, la audiencia
 * (ID del proyecto), la vigencia y los claims básicos, tal como documenta Firebase.
 *
 * Límite conocido: no consulta revocación (eso requiere Firebase Admin `checkRevoked`). Un token
 * robado vale hasta que vence (≤ 1 h). Para revocar de inmediato, ver docs/AUTH_AND_TENANCY.md.
 */
const GOOGLE_JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"

let defaultKeys: JWTVerifyGetKey | null = null
function googleKeys(): JWTVerifyGetKey {
  if (!defaultKeys) defaultKeys = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL), { cooldownDuration: 30_000, cacheMaxAge: 3_600_000 }) as JWTVerifyGetKey
  return defaultKeys
}

export class TokenError extends Error {
  constructor(public readonly reason: "missing" | "invalid" | "expired" | "claims") {
    super(`Token no válido (${reason})`)
    this.name = "TokenError"
  }
}

export interface VerifiedPrincipal {
  uid: string
  email: string | null
  emailVerified: boolean
  /** Custom claim `platformAdmin === true` (asignado solo con Admin SDK). */
  platformAdmin: boolean
  platformSupport: boolean
  /** Custom claim `companyId`/`tenantId` (asignado solo con Admin SDK). */
  tenantId: string | null
  tenantRole: string | null
  source: "firebase" | "demo"
}

export interface VerifyOptions {
  projectId: string
  /** Solo para pruebas: conjunto de llaves local en lugar del de Google. */
  keys?: JWTVerifyGetKey
}

export async function verifyFirebaseIdToken(token: string, opts: VerifyOptions): Promise<VerifiedPrincipal> {
  if (!token || token.length > 8192 || token.split(".").length !== 3) throw new TokenError("missing")
  let payload: JWTPayload
  if (emulatorTokensAccepted(opts.projectId)) {
    payload = verifyEmulatorToken(token, opts.projectId)
  } else {
    try {
      const res = await jwtVerify(token, opts.keys ?? googleKeys(), {
        algorithms: ["RS256"],
        issuer: `https://securetoken.google.com/${opts.projectId}`,
        audience: opts.projectId,
        clockTolerance: 30,
      })
      payload = res.payload
    } catch (e) {
      const code = (e as { code?: string }).code
      throw new TokenError(code === "ERR_JWT_EXPIRED" ? "expired" : "invalid")
    }
  }
  const uid = typeof payload.sub === "string" ? payload.sub : ""
  if (!uid || uid.length > 128) throw new TokenError("claims")
  const authTime = typeof payload.auth_time === "number" ? payload.auth_time : undefined
  if (authTime === undefined || authTime > Math.floor(Date.now() / 1000) + 30) throw new TokenError("claims")
  const tenant = payload.companyId ?? payload.tenantId
  const role = payload.tenantRole
  return {
    uid,
    email: typeof payload.email === "string" ? payload.email : null,
    emailVerified: payload.email_verified === true,
    platformAdmin: payload.platformAdmin === true,
    platformSupport: payload.platformSupport === true,
    tenantId: typeof tenant === "string" && tenant ? tenant : null,
    tenantRole: typeof role === "string" && role ? role : null,
    source: "firebase",
  }
}

/**
 * El emulador de Firebase Auth emite tokens SIN firma (alg none), igual que el Admin SDK acepta en ese caso.
 * Solo se admite si hay un emulador declarado (FIREBASE_AUTH_EMULATOR_HOST), el proyecto es `demo-*`
 * (los de producción nunca lo son) y no se está en Vercel. Cualquier otro caso exige firma RS256 de Google.
 */
function emulatorTokensAccepted(projectId: string): boolean {
  return Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST) && projectId.startsWith("demo-") && !process.env.VERCEL_ENV
}

function verifyEmulatorToken(token: string, projectId: string): JWTPayload {
  try {
    if (decodeProtectedHeader(token).alg !== "none") throw new TokenError("invalid")
    const p = decodeJwt(token)
    const now = Math.floor(Date.now() / 1000)
    if (p.iss !== `https://securetoken.google.com/${projectId}` || p.aud !== projectId) throw new TokenError("invalid")
    if (typeof p.exp !== "number" || p.exp + 30 < now) throw new TokenError("expired")
    return p
  } catch (e) {
    throw e instanceof TokenError ? e : new TokenError("invalid")
  }
}

export function bearerToken(header: string | null): string | null {
  if (!header) return null
  const m = /^Bearer\s+([A-Za-z0-9\-_=.]+)$/.exec(header.trim())
  return m ? m[1] : null
}
