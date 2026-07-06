import type { PlatformRole } from "./types"

/**
 * Administradores de plataforma (Nexo Control Plane / Admin Ultra).
 *
 * `operaciones@nexo.com` es el super administrador operativo de Nexo, por encima
 * de cualquier tenant. La pertenencia se ancla al correo (fuente de verdad estable
 * y auditable) y, en producción Firebase, además al campo `platformRole` del
 * documento `users/{uid}`. NUNCA se guardan contraseñas en el repositorio: el
 * usuario Auth se crea con `npm run seed:firebase` o manualmente (ver
 * docs/NEXO_CONTROL_PLANE.md §usuario-maestro).
 */
export const PLATFORM_ADMIN_EMAILS: readonly string[] = ["operaciones@nexo.com"]

export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase()
}

export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  return PLATFORM_ADMIN_EMAILS.includes(normalizeEmail(email))
}

/**
 * Resuelve el rol de plataforma combinando el allowlist de correos y el campo
 * persistido (`platformRole`) del perfil. El allowlist gana para garantizar que
 * operaciones@nexo.com siempre entre al Control Plane aunque falte el campo.
 */
export function resolvePlatformRole(
  email: string | null | undefined,
  persistedRole?: PlatformRole | string | null,
): PlatformRole {
  if (isPlatformAdminEmail(email)) return "platform_admin"
  if (persistedRole === "platform_admin" || persistedRole === "platform_support") return persistedRole
  return "none"
}

export function canAccessControlPlane(role: PlatformRole): boolean {
  return role === "platform_admin" || role === "platform_support"
}
