"use client"

import { DEMO_PASSWORD, DEMO_SESSION_COOKIE, findDemoUser } from "@/lib/config/demo-users"
import type { User } from "./auth"

/**
 * Autenticación de demostración — solo se usa cuando getAuthMode() === "demo"
 * (desarrollo local, CI y E2E sin credenciales). Ver docs/SECURITY_MODEL.md.
 */
const STORAGE_KEY = "delar_demo_user"
const listeners = new Set<(user: User | null) => void>()

function readStoredUser(): User | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

function notify(user: User | null) {
  for (const listener of listeners) listener(user)
}

export const demoAuthService = {
  login(email: string, password: string): { success: boolean; message?: string; user?: User } {
    const demo = findDemoUser(email)
    if (!demo || password !== DEMO_PASSWORD) {
      return {
        success: false,
        message: `Modo demo: usa un usuario demo (p. ej. admin@delarfoods.mx) con contraseña "${DEMO_PASSWORD}"`,
      }
    }
    const user: User = {
      uid: `demo-${demo.role}`,
      email: demo.email,
      name: demo.name,
      role: demo.role === "org_admin" ? "admin" : "user",
      domainRole: demo.role,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    // Cookie legible por server actions para RBAC (no es frontera de seguridad real;
    // el modo demo no maneja datos reales)
    document.cookie = `${DEMO_SESSION_COOKIE}=${encodeURIComponent(demo.email)}; path=/; SameSite=Lax`
    notify(user)
    return { success: true, user }
  },

  logout(): void {
    window.localStorage.removeItem(STORAGE_KEY)
    document.cookie = `${DEMO_SESSION_COOKIE}=; path=/; Max-Age=0`
    notify(null)
  },

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    listeners.add(callback)
    callback(readStoredUser())
    return () => listeners.delete(callback)
  },

  getCurrentUser(): User | null {
    return readStoredUser()
  },
}
