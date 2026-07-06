import type React from "react"
import { Suspense } from "react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import { AuthGuard } from "@/components/auth/auth-guard"
import { FloatingAssistant } from "@/components/assistant/floating-assistant"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <AppHeader />
          <main className="flex-1 p-6 lg:p-8">
            <Suspense fallback={null}>{children}</Suspense>
          </main>
        </div>
        <FloatingAssistant />
      </div>
    </AuthGuard>
  )
}
