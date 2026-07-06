import type { Role } from "@/lib/domain/rbac/roles"

/**
 * Usuarios de demostración — SOLO activos en modo demo (ver auth-mode.ts).
 * No son credenciales reales; la contraseña demo es pública y el modo demo
 * nunca opera sobre datos reales (docs/SECURITY_MODEL.md).
 */
export interface DemoUser {
  email: string
  name: string
  role: Role
}

export const DEMO_PASSWORD = "demo"

export const DEMO_USERS: DemoUser[] = [
  // Super administrador operativo de Nexo (Control Plane / Admin Ultra).
  // En producción es una cuenta Firebase real; aquí es su equivalente demo para E2E.
  { email: "operaciones@nexo.com", name: "Operaciones Nexo", role: "super_admin" },
  { email: "admin@delarfoods.mx", name: "Administración DELAR", role: "org_admin" },
  { email: "direccion@delarfoods.mx", name: "Dirección", role: "director" },
  { email: "ventas@delarfoods.mx", name: "Ventas", role: "sales_rep" },
  { email: "almacen@delarfoods.mx", name: "Almacén", role: "warehouse_manager" },
  { email: "calidad@delarfoods.mx", name: "Calidad", role: "quality_manager" },
  { email: "finanzas@delarfoods.mx", name: "Finanzas", role: "finance_manager" },
  { email: "auditor@delarfoods.mx", name: "Auditoría", role: "auditor" },
]

export function findDemoUser(email: string): DemoUser | undefined {
  return DEMO_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
}

export const DEMO_SESSION_COOKIE = "delar_demo_session"
