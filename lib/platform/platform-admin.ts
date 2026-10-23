import type { PlatformRole } from "./types"

/**
 * Administradores de plataforma (Nexo Control Plane / Admin Ultra).
 *
 * El acceso global NO se concede por coincidir un correo en el frontend. En Firebase proviene
 * exclusivamente de un custom claim firmado en el ID token (`platformAdmin: true`) que solo se asigna
 * con Firebase Admin SDK mediante `npm run platform:claims` (ver docs/AUTH_AND_TENANCY.md). El claim lo
 * verifican las reglas de Firestore y el servidor (`lib/server/firebase-token.ts`).
 *
 * `EXPECTED_PLATFORM_ADMIN_EMAILS` solo documenta qué cuentas pueden recibir el claim: el script de
 * asignación rechaza cualquier otro correo. No concede ningún privilegio por sí mismo.
 */
export const EXPECTED_PLATFORM_ADMIN_EMAILS: readonly string[] = ["operaciones@nexo.com"]

export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase()
}

/** Valida un rol de plataforma ya verificado (claims del token o usuario demo aislado). */
export function resolvePlatformRole(verifiedRole?: PlatformRole | string | null): PlatformRole {
  return verifiedRole === "platform_admin" || verifiedRole === "platform_support" ? verifiedRole : "none"
}

export function hasPlatformAdminClaim(role: PlatformRole): boolean {
  return role === "platform_admin"
}

export function canAccessControlPlane(role: PlatformRole): boolean {
  return role === "platform_admin" || role === "platform_support"
}
