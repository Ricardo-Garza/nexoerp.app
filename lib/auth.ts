"use client"

import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  type User as FirebaseUser,
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { getFirebaseAuth, getFirebaseDb } from "./firebase"
import { describeMisconfiguration, getAuthMode } from "./config/auth-mode"
import { authErrorMessage } from "./auth-errors"
import type { Role } from "./domain/rbac/roles"
import type { PlatformRole } from "./platform/types"

export type UserRole = "admin" | "user"

export interface User {
  uid: string
  email: string
  name: string
  role: UserRole
  /** Rol granular del RBAC de dominio (solo modo demo aislado) */
  domainRole?: Role
  createdAt?: Date
  /** Tenant del usuario: custom claim verificado primero; el perfil solo si no hay claim. */
  companyId?: string
  /** Rol de plataforma. En Firebase proviene EXCLUSIVAMENTE de custom claims del ID token. */
  platformRole?: PlatformRole
}

export interface AuthResponse {
  success: boolean
  message?: string
  user?: User
}

const CONFIG_ERROR = () => `La autenticación no está configurada correctamente. ${describeMisconfiguration()} Contacta a soporte.`

/** Rol de plataforma a partir de los claims firmados del ID token (nunca de localStorage ni del correo). */
export function platformRoleFromClaims(claims: Record<string, unknown> | undefined): PlatformRole {
  if (claims?.platformAdmin === true) return "platform_admin"
  if (claims?.platformSupport === true) return "platform_support"
  return "none"
}

export function tenantFromClaims(claims: Record<string, unknown> | undefined): string | undefined {
  const raw = claims?.companyId ?? claims?.tenantId
  return typeof raw === "string" && raw.length > 0 ? raw : undefined
}

/** Rol de empresa firmado. El perfil legado solo se usa cuando el token no lo declara. */
export function tenantRoleFromClaims(claims: Record<string, unknown> | undefined): UserRole | undefined {
  return claims?.tenantRole === "admin" || claims?.tenantRole === "user" ? claims.tenantRole : undefined
}

// Perfil en Firestore (nombre, rol de UI) + claims verificados del token (tenant y plataforma).
async function getUserProfile(firebaseUser: FirebaseUser): Promise<User> {
  const email = firebaseUser.email || ""
  const emailName = email ? email.split("@")[0] : "Usuario"
  const tokenResult = await firebaseUser.getIdTokenResult()
  const platformRole = platformRoleFromClaims(tokenResult.claims)
  const claimTenant = tenantFromClaims(tokenResult.claims)

  const db = getFirebaseDb()
  const userRef = doc(db, "users", firebaseUser.uid)
  const userSnap = await getDoc(userRef)

  if (userSnap.exists()) {
    const data = userSnap.data()
    return {
      uid: firebaseUser.uid,
      email,
      name: data?.name || emailName,
      role: tenantRoleFromClaims(tokenResult.claims) ?? (data?.role === "admin" ? "admin" : "user"),
      createdAt: data?.createdAt?.toDate?.(),
      companyId: claimTenant ?? data?.companyId ?? data?.empresaId,
      platformRole,
    }
  }

  // Primer ingreso: el perfil se crea SIN rol privilegiado ni empresa (las reglas lo exigen).
  await setDoc(userRef, {
    email,
    name: emailName,
    role: "user",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return { uid: firebaseUser.uid, email, name: emailName, role: "user", createdAt: new Date(), companyId: claimTenant, platformRole }
}

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const mode = getAuthMode()
    if (mode === "demo") {
      const { demoAuthService } = await import("./auth-demo")
      return demoAuthService.login(email, password)
    }
    if (mode === "misconfigured") return { success: false, message: CONFIG_ERROR() }
    try {
      const auth = getFirebaseAuth()
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
      const user = await getUserProfile(credential.user)
      return { success: true, user }
    } catch (error) {
      // Solo el código de error: nunca se registran correo, contraseña ni tokens.
      console.error("[Auth] Login error:", (error as { code?: string })?.code ?? "unknown")
      return { success: false, message: authErrorMessage(error, "login") }
    }
  },

  register: async (email: string, password: string, name?: string): Promise<AuthResponse> => {
    if (getAuthMode() !== "firebase") return { success: false, message: "El registro no está disponible en este entorno." }
    try {
      const auth = getFirebaseAuth()
      const db = getFirebaseDb()
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
      const safeEmail = credential.user.email || email
      const emailName = safeEmail ? safeEmail.split("@")[0] : "Usuario"
      const profile: User = { uid: credential.user.uid, email: safeEmail, name: name || emailName, role: "user", createdAt: new Date(), platformRole: "none" }
      await setDoc(doc(db, "users", credential.user.uid), {
        email: profile.email,
        name: profile.name,
        role: "user",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return { success: true, user: profile }
    } catch (error) {
      console.error("[Auth] Registration error:", (error as { code?: string })?.code ?? "unknown")
      return { success: false, message: authErrorMessage(error, "register") }
    }
  },

  logout: async (): Promise<void> => {
    if (typeof window !== "undefined") {
      try {
        // La empresa seleccionada no sobrevive a la sesión
        window.localStorage.removeItem("nexo_active_tenant")
      } catch {
        /* almacenamiento bloqueado */
      }
    }
    if (getAuthMode() === "demo") {
      const { demoAuthService } = await import("./auth-demo")
      demoAuthService.logout()
      return
    }
    if (getAuthMode() === "misconfigured") return
    await firebaseSignOut(getFirebaseAuth())
  },

  resetPassword: async (email: string): Promise<AuthResponse> => {
    if (getAuthMode() !== "firebase") return { success: false, message: getAuthMode() === "misconfigured" ? CONFIG_ERROR() : "La recuperación de contraseña no está disponible en este entorno." }
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim())
    } catch (error) {
      const code = (error as { code?: string })?.code
      console.error("[Auth] Password reset error:", code ?? "unknown")
      // No se revela si la cuenta existe: solo se informan errores de formato, red o configuración.
      if (code && code !== "auth/user-not-found") return { success: false, message: authErrorMessage(error, "reset") }
    }
    return { success: true, message: "Si el correo está registrado, recibirás las instrucciones para restablecer tu contraseña." }
  },

  onAuthStateChanged: (callback: (user: User | null) => void) => {
    const mode = getAuthMode()
    if (mode === "demo") {
      let unsubscribe: (() => void) | undefined
      let cancelled = false
      import("./auth-demo").then(({ demoAuthService }) => {
        if (!cancelled) unsubscribe = demoAuthService.onAuthStateChanged(callback)
      })
      return () => {
        cancelled = true
        unsubscribe?.()
      }
    }
    if (mode === "misconfigured") {
      callback(null)
      return () => {}
    }
    return onAuthStateChanged(getFirebaseAuth(), async (firebaseUser) => {
      if (!firebaseUser) return callback(null)
      try {
        callback(await getUserProfile(firebaseUser))
      } catch (error) {
        console.error("[Auth] Error getting user profile:", (error as { code?: string })?.code ?? "unknown")
        callback(null)
      }
    })
  },

  getCurrentUser: async (): Promise<User | null> => {
    const mode = getAuthMode()
    if (mode === "demo") {
      const { demoAuthService } = await import("./auth-demo")
      return demoAuthService.getCurrentUser()
    }
    if (mode === "misconfigured") return null
    const firebaseUser = getFirebaseAuth().currentUser
    if (!firebaseUser) return null
    try {
      return await getUserProfile(firebaseUser)
    } catch {
      return null
    }
  },

  /** ID token vigente (se renueva solo cuando va a vencer) para llamar a APIs del servidor. */
  getIdToken: async (forceRefresh = false): Promise<string | null> => {
    if (getAuthMode() !== "firebase") return null
    const current = getFirebaseAuth().currentUser
    return current ? current.getIdToken(forceRefresh) : null
  },
}
