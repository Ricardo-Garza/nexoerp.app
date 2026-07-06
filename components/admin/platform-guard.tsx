"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { usePlatform } from "@/contexts/platform-context"
import { Loader2, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

/**
 * Protege Administración Nexo: solo usuarios internos autorizados pueden entrar.
 */
export function PlatformGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const { isPlatformAdmin } = usePlatform()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null

  if (!isPlatformAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4" data-testid="platform-denied">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Acceso restringido</h1>
          <p className="text-muted-foreground">
            Administración Nexo es exclusiva para usuarios internos autorizados. Tu cuenta{" "}
            <span className="font-medium">{user.email}</span> no tiene permiso para esta sección.
          </p>
          <Button asChild>
            <Link href="/dashboard">Volver al sistema</Link>
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
