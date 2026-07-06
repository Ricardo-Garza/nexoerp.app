"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import {
  LayoutGrid,
  Building2,
  Boxes,
  Plug,
  ScrollText,
  Upload,
  LifeBuoy,
  Rocket,
  Sparkles,
  ArrowLeft,
} from "lucide-react"
import { NexoLogo } from "@/components/brand/nexo-logo"
import { UserPreferenceSelects } from "@/components/layout/user-preference-selects"

const NAV = [
  { name: "Panel", href: "/admin", icon: LayoutGrid },
  { name: "Empresas", href: "/admin/tenants", icon: Building2 },
  { name: "Módulos", href: "/admin/modules", icon: Boxes },
  { name: "Integraciones", href: "/admin/integrations", icon: Plug },
  { name: "Auditoría global", href: "/admin/audit", icon: ScrollText },
  { name: "Importaciones", href: "/admin/imports", icon: Upload },
  { name: "Soporte", href: "/admin/support", icon: LifeBuoy },
  { name: "Releases", href: "/admin/releases", icon: Rocket },
  { name: "IA por cliente", href: "/admin/ai", icon: Sparkles },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/")

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 shrink-0 border-r border-border bg-card flex flex-col">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <NexoLogo label="Administración Nexo" />
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-testid={`admin-nav-${item.href.split("/").pop() || "home"}`}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowLeft className="w-4 h-4" /> Ir al ERP
          </Link>
          <div className="px-3 py-2 rounded-lg bg-muted/50">
            <p className="text-xs font-medium text-muted-foreground">Sesión</p>
            <p className="text-sm font-semibold mt-0.5 truncate">{user?.email}</p>
          </div>
          <UserPreferenceSelects compact />
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-6 lg:p-8 overflow-x-hidden">{children}</main>
    </div>
  )
}
