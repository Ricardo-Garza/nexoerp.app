import "server-only"
import { cookies } from "next/headers"
import { getAuthMode } from "@/lib/config/auth-mode"
import { DEMO_SESSION_COOKIE, findDemoUser } from "@/lib/config/demo-users"
import type { Permission, Role } from "@/lib/domain/rbac/roles"
import { hasPermission } from "@/lib/domain/rbac/roles"
import { err, ok, type Result } from "@/lib/domain/shared/result"

export interface SessionUser {
  id: string
  email: string
  name: string
  role: Role
}

/**
 * Sesión server-side.
 * - Modo demo: cookie con el email del usuario demo (sin secretos; solo dev/CI/E2E).
 * - Modo firebase: la verificación server-side requiere Firebase Admin (deuda D4);
 *   mientras tanto las mutaciones del dominio nuevo se niegan fuera de modo demo.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (getAuthMode() !== "demo") return null
  const jar = await cookies()
  const email = jar.get(DEMO_SESSION_COOKIE)?.value
  if (!email) return null
  const demo = findDemoUser(email)
  if (!demo) return null
  return { id: `demo-${demo.role}`, email: demo.email, name: demo.name, role: demo.role }
}

/** Autoriza una mutación del dominio: sesión válida + permiso RBAC. */
export async function requirePermission(permission: Permission): Promise<Result<SessionUser>> {
  const user = await getSessionUser()
  if (!user) {
    return err(
      "forbidden",
      "Sesión de servidor no disponible. Las mutaciones del dominio DELAR requieren modo demo mientras se implementa la verificación de sesión Firebase Admin (deuda D4).",
    )
  }
  if (!hasPermission(user.role, permission)) {
    return err("forbidden", `Tu rol (${user.role}) no tiene el permiso ${permission}`)
  }
  return ok(user)
}
