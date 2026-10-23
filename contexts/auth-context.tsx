"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth"
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { authService } from "@/lib/auth"
import { getAuthMode } from "@/lib/config/auth-mode"
import { platformRoleFromClaims, tenantFromClaims, tenantRoleFromClaims } from "@/lib/auth"
import type { PlatformRole } from "@/lib/platform/types"

// Partial<FirebaseUser>: en modo demo el usuario no es un FirebaseUser real;
// los consumidores solo leen campos planos (uid, email, role, companyId)
interface AuthUser extends Partial<FirebaseUser> {
  uid: string
  email: string | null
  displayName?: string | null
  name?: string | null
  companyId?: string
  role?: "admin" | "user"
  /** Verificado: claims del ID token (Firebase) o usuario demo aislado. */
  platformRole?: PlatformRole
}

interface AuthContextType {
  user: AuthUser | null
  companyId: string | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  companyId: null,
  loading: true,
  logout: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const logout = async () => {
    await authService.logout()
  }

  useEffect(() => {
    if (getAuthMode() === "demo") {
      // Modo demo (sin credenciales): authService entrega usuarios sintéticos
      const unsubscribe = authService.onAuthStateChanged((demoUser) => {
        if (demoUser) {
          setUser({
            uid: demoUser.uid,
            email: demoUser.email,
            displayName: demoUser.name,
            name: demoUser.name,
            companyId: demoUser.companyId ?? "org-delar",
            role: demoUser.role,
            platformRole: demoUser.platformRole ?? "none",
          })
          setCompanyId(demoUser.companyId ?? "org-delar")
        } else {
          setUser(null)
          setCompanyId(null)
        }
        setLoading(false)
      })
      return () => unsubscribe()
    }

    if (getAuthMode() === "misconfigured") {
      // Error de configuración controlado: sin autenticación ficticia
      setUser(null)
      setCompanyId(null)
      setLoading(false)
      return
    }

    const auth = getFirebaseAuth()
    const db = getFirebaseDb()
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        setCompanyId(null)
        setLoading(false)
        return
      }

      let userRole: "admin" | "user" = "user"
      let profileCompanyId: string | undefined
      let claims: Record<string, unknown> | undefined
      try {
        claims = (await firebaseUser.getIdTokenResult()).claims as Record<string, unknown>
      } catch (error) {
        console.error("[Auth] Error getting token claims:", (error as { code?: string })?.code ?? "unknown")
      }
      try {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          profileCompanyId = data.companyId || data.empresaId
          userRole = data.role === "admin" ? "admin" : "user"
        }
      } catch (error) {
        console.error("[Auth] Error fetching user profile:", (error as { code?: string })?.code ?? "unknown")
      }

      userRole = tenantRoleFromClaims(claims) ?? userRole

      // Tenant: el claim firmado manda; el perfil solo cuando no hay claim; uid como último recurso (cuenta unipersonal)
      const userCompanyId = tenantFromClaims(claims) ?? profileCompanyId ?? firebaseUser.uid
      setUser({
        ...firebaseUser,
        name: firebaseUser.displayName,
        companyId: userCompanyId,
        role: userRole,
        platformRole: platformRoleFromClaims(claims),
      })
      setCompanyId(userCompanyId)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ user, companyId, loading, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
