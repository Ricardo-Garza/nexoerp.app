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
import { getAuthMode } from "./config/auth-mode"
import type { Role } from "./domain/rbac/roles"

export type UserRole = "admin" | "user"

export interface User {
  uid: string
  email: string
  name: string
  role: UserRole
  /** Rol granular del RBAC de dominio (modo demo / migración futura) */
  domainRole?: Role
  createdAt?: Date
  companyId?: string
}

export interface AuthResponse {
  success: boolean
  message?: string
  user?: User
}

// Get or create user profile in Firestore with role lookup
async function getUserProfile(firebaseUser: FirebaseUser): Promise<User> {
  try {
    const db = getFirebaseDb()
    const userRef = doc(db, "users", firebaseUser.uid)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      const data = userSnap.data()
      const email = firebaseUser.email || ""
      const emailName = email ? email.split("@")[0] : "Usuario"

      return {
        uid: firebaseUser.uid,
        email: email,
        name: data?.name || emailName,
        role: data?.role || "user",
        createdAt: data?.createdAt?.toDate(),
        companyId: data?.companyId,
      }
    }

    const email = firebaseUser.email || ""
    const emailName = email ? email.split("@")[0] : "Usuario"

    // Create new user profile if doesn't exist
    const newUser: User = {
      uid: firebaseUser.uid,
      email: email,
      name: emailName,
      role: "user", // Default role
      createdAt: new Date(),
    }

    await setDoc(userRef, {
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return newUser
  } catch (error) {
    console.error("[Auth] Error getting user profile:", error)
    throw error
  }
}

export const authService = {
  // Login with Firebase Auth
  login: async (email: string, password: string): Promise<AuthResponse> => {
    if (getAuthMode() === "demo") {
      const { demoAuthService } = await import("./auth-demo")
      return demoAuthService.login(email, password)
    }
    try {
      const auth = getFirebaseAuth()
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = await getUserProfile(userCredential.user)

      return {
        success: true,
        user,
      }
    } catch (error: any) {
      console.error("[Auth] Login error:", error)

      let message = "Error al iniciar sesión. Intenta de nuevo."

      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
        message = "Credenciales incorrectas. Verifica tu correo y contraseña."
      } else if (error.code === "auth/user-not-found") {
        message = "No existe una cuenta con este correo electrónico."
      } else if (error.code === "auth/too-many-requests") {
        message = "Demasiados intentos fallidos. Intenta más tarde."
      } else if (error.code === "auth/network-request-failed") {
        message = "Error de conexión. Verifica tu internet."
      }

      return {
        success: false,
        message,
      }
    }
  },

  // Register new user
  register: async (email: string, password: string, name?: string): Promise<AuthResponse> => {
    try {
      const auth = getFirebaseAuth()
      const db = getFirebaseDb()
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      const safeEmail = userCredential.user.email || email || ""
      const emailName = safeEmail ? safeEmail.split("@")[0] : "Usuario"

      // Create user profile in Firestore
      const newUser: User = {
        uid: userCredential.user.uid,
        email: safeEmail,
        name: name || emailName,
        role: "user",
        createdAt: new Date(),
      }

      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      return {
        success: true,
        user: newUser,
      }
    } catch (error: any) {
      console.error("[Auth] Registration error:", error)

      let message = "Error al crear la cuenta. Intenta de nuevo."

      if (error.code === "auth/email-already-in-use") {
        message = "Este correo ya está registrado. Intenta iniciar sesión."
      } else if (error.code === "auth/weak-password") {
        message = "La contraseña debe tener al menos 6 caracteres."
      } else if (error.code === "auth/invalid-email") {
        message = "Correo electrónico inválido."
      }

      return {
        success: false,
        message,
      }
    }
  },

  // Logout
  logout: async (): Promise<void> => {
    if (getAuthMode() === "demo") {
      const { demoAuthService } = await import("./auth-demo")
      demoAuthService.logout()
      return
    }
    try {
      const auth = getFirebaseAuth()
      await firebaseSignOut(auth)
    } catch (error) {
      console.error("[Auth] Logout error:", error)
      throw error
    }
  },

  // Send password reset email
  resetPassword: async (email: string): Promise<AuthResponse> => {
    try {
      const auth = getFirebaseAuth()
      await sendPasswordResetEmail(auth, email)
      return {
        success: true,
        message: `Se han enviado las instrucciones de recuperación a ${email}`,
      }
    } catch (error: any) {
      console.error("[Auth] Password reset error:", error)

      let message = "Error al enviar el correo. Intenta de nuevo."

      if (error.code === "auth/user-not-found") {
        message = "No existe una cuenta con este correo electrónico."
      } else if (error.code === "auth/invalid-email") {
        message = "Correo electrónico inválido."
      }

      return {
        success: false,
        message,
      }
    }
  },

  // Subscribe to auth state changes
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    if (getAuthMode() === "demo") {
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
    const auth = getFirebaseAuth()
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const user = await getUserProfile(firebaseUser)
          callback(user)
        } catch (error) {
          console.error("[Auth] Error getting user profile:", error)
          callback(null)
        }
      } else {
        callback(null)
      }
    })
  },

  // Get current user
  getCurrentUser: async (): Promise<User | null> => {
    if (getAuthMode() === "demo") {
      const { demoAuthService } = await import("./auth-demo")
      return demoAuthService.getCurrentUser()
    }
    const auth = getFirebaseAuth()
    const firebaseUser = auth.currentUser
    if (!firebaseUser) return null

    try {
      return await getUserProfile(firebaseUser)
    } catch (error) {
      console.error("[Auth] Error getting current user:", error)
      return null
    }
  },
}
