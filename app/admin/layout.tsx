import type { ReactNode } from "react"
import { PlatformGuard } from "@/components/admin/platform-guard"
import { AdminShell } from "@/components/admin/admin-shell"

export const dynamic = "force-dynamic"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <PlatformGuard>
      <AdminShell>{children}</AdminShell>
    </PlatformGuard>
  )
}
