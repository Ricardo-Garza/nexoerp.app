"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth"
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { authService } from "@/lib/auth"
import { getAuthMode } from "@/lib/config/auth-mode"

// Partial<FirebaseUser>: en modo demo el usuario no es un FirebaseUser real;
// los consumidores solo leen campos planos (uid, email, role, companyId)
interface AuthUser extends Partial<FirebaseUser> {
  uid: string
  email: string | null
  displayName?: string | null
  name?: string | null
  companyId?: string
  role?: "admin" | "user"
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

    const auth = getFirebaseAuth()
    const db = getFirebaseDb()
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log("[v0] [Auth] User authenticated:", firebaseUser.uid)

        let userCompanyId: string | undefined
        let userRole: "admin" | "user" = "user"

        try {
          const userDocRef = doc(db, "users", firebaseUser.uid)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            const userData = userDoc.data()
            userCompanyId = userData.companyId || userData.empresaId
            userRole = userData.role === "admin" ? "admin" : "user"
            console.log("[v0] [Auth] CompanyId from profile:", userCompanyId)
          }
        } catch (error) {
          console.error("[v0] [Auth] Error fetching user profile:", error)
        }

        // Fallback 1: Try custom claims
        if (!userCompanyId) {
          try {
            const tokenResult = await firebaseUser.getIdTokenResult()
            userCompanyId = tokenResult.claims.companyId as string | undefined
            console.log("[v0] [Auth] CompanyId from claims:", userCompanyId)
          } catch (error) {
            console.error("[v0] [Auth] Error getting token claims:", error)
          }
        }

        // Fallback 2: Use uid as companyId for development
        if (!userCompanyId) {
          userCompanyId = firebaseUser.uid
          console.log("[v0] [Auth] Using uid as companyId (fallback):", userCompanyId)
        }

        setUser({
          ...firebaseUser,
          name: firebaseUser.displayName,
          companyId: userCompanyId,
          role: userRole,
        })
        setCompanyId(userCompanyId)
      } else {
        console.log("[v0] [Auth] User logged out")
        setUser(null)
        setCompanyId(null)
      }
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
