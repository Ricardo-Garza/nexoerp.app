import "server-only"
import { cookies } from "next/headers"
import { getAuthMode } from "@/lib/config/auth-mode"
import { DEMO_SESSION_COOKIE, findDemoUser } from "@/lib/config/demo-users"
import { bearerToken, TokenError, verifyFirebaseIdToken, type VerifiedPrincipal } from "./firebase-token"

/**
 * Identidad del llamador de una ruta de API:
 *  - modo "firebase": SOLO un ID token firmado y vigente en `Authorization: Bearer`. Cookies, cabeceras
 *    X-* o campos del cuerpo nunca conceden identidad.
 *  - modo "demo" (aislado, nunca producción): la cookie del usuario demo. No hay datos reales detrás.
 *  - "misconfigured": nadie se autentica.
 */
export type AuthResult =
  | { ok: true; principal: VerifiedPrincipal }
  | { ok: false; status: 401 | 503; code: "unauthenticated" | "invalid_token" | "misconfigured" }

export async function authenticateRequest(request: Request): Promise<AuthResult> {
  const mode = getAuthMode()
  if (mode === "misconfigured") return { ok: false, status: 503, code: "misconfigured" }

  if (mode === "demo") {
    const jar = await cookies()
    const demo = findDemoUser(jar.get(DEMO_SESSION_COOKIE)?.value ?? "")
    if (!demo) return { ok: false, status: 401, code: "unauthenticated" }
    return {
      ok: true,
      principal: {
        uid: `demo-${demo.role}`,
        email: demo.email,
        emailVerified: false,
        platformAdmin: demo.role === "super_admin",
        platformSupport: false,
        tenantId: null,
        tenantRole: null,
        source: "demo",
      },
    }
  }

  const token = bearerToken(request.headers.get("authorization"))
  if (!token) return { ok: false, status: 401, code: "unauthenticated" }
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  if (!projectId) return { ok: false, status: 503, code: "misconfigured" }
  try {
    return { ok: true, principal: await verifyFirebaseIdToken(token, { projectId }) }
  } catch (e) {
    if (e instanceof TokenError) return { ok: false, status: 401, code: "invalid_token" }
    throw e
  }
}

/** ¿Puede este principal operar sobre datos de `tenantId`? Plataforma: todas; el resto: solo la suya. */
export function canAccessTenant(principal: VerifiedPrincipal, tenantId: string): boolean {
  if (principal.platformAdmin) return true
  return principal.tenantId !== null && principal.tenantId === tenantId
}
