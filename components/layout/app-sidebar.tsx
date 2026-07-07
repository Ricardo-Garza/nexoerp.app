"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import {
  LayoutDashboard,
  BookOpen,
  Tags,
  Boxes,
  Building2,
  Settings,
  Users,
  Package,
  Warehouse,
  Calculator,
  Cog,
  Wrench,
  Headphones,
  UserCog,
  BarChart3,
  ShoppingCart,
  Smartphone,
  ShoppingBasket,
  Store,
  FileText,
  Upload,
  MessageSquare,
  Shield,
  type LucideIcon,
} from "lucide-react"
import { usePlatform } from "@/contexts/platform-context"
import { NexoLogo } from "@/components/brand/nexo-logo"
import { buildTenantMenu, type TenantMenuSection } from "@/lib/platform/menu"
import { getTenant } from "@/lib/platform/tenant-store"
import type { ModuleId, Tenant } from "@/lib/platform/types"

const MODULE_ICONS: Record<ModuleId, LucideIcon> = {
  dashboard: LayoutDashboard,
  clients: Users,
  sales: ShoppingBasket,
  invoicing: FileText,
  suppliers: Package,
  inventory: Package,
  catalog: BookOpen,
  priceLists: Tags,
  productsPricing: Tags,
  inventoryStock: Boxes,
  lots: Boxes,
  warehouse: Warehouse,
  pos: Store,
  banking: Building2,
  production: Cog,
  maintenance: Wrench,
  service: Headphones,
  accounting: Calculator,
  payroll: UserCog,
  bi: BarChart3,
  crm: MessageSquare,
  imports: Upload,
  webMobile: Smartphone,
  ecommerce: ShoppingCart,
}

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { isPlatformAdmin, activeTenantId } = usePlatform()
  const [tenant, setTenant] = useState<Tenant | null>(null)

  useEffect(() => {
    let alive = true
    getTenant(activeTenantId)
      .then((t) => {
        if (alive) setTenant(t)
      })
      .catch(() => {
        if (alive) setTenant(null)
      })
    return () => {
      alive = false
    }
  }, [activeTenantId])

  const sections: TenantMenuSection[] = buildTenantMenu(tenant)

  const isRouteActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    if (href === "/dashboard/ventas/ordenes") {
      return pathname.startsWith("/dashboard/ventas")
    }
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <aside className="app-sidebar w-72 shrink-0 border-r border-border bg-card flex flex-col overflow-y-auto">
      <div className="app-sidebar-surface p-6 border-b border-border sticky top-0 bg-card z-10">
        <Link href="/dashboard" className="flex items-center gap-3">
          <NexoLogo label={tenant?.branding.logoText ?? "Nexo ERP"} />
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-6">
        {isPlatformAdmin && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground px-3 mb-2">NEXO PLATAFORMA</p>
            <Link
              href="/admin"
              data-testid="sidebar-control-plane"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                pathname.startsWith("/admin")
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-primary/10 text-primary hover:bg-primary/20",
              )}
            >
              <Shield className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Administración Nexo</span>
            </Link>
          </div>
        )}
        {sections.map((section) => {
          const extraItems =
            section.title === "ADMINISTRACION"
              ? [
                  { name: "Configuracion", href: "/dashboard/configuracion", icon: Settings },
                  ...(user?.role === "admin"
                    ? [{ name: "Usuarios y permisos", href: "/dashboard/admin/users", icon: Users }]
                    : []),
                ]
              : []
          return (
            <div key={section.title} className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground px-3 mb-2">{section.title}</p>
              {section.items.map((item) => {
                const Icon = MODULE_ICONS[item.moduleId] ?? Package
                const isActive = isRouteActive(item.href)
                return (
                  <Link
                    key={item.moduleId}
                    href={item.href}
                    data-testid={`sidebar-module-${item.moduleId}`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                )
              })}
              {extraItems.map((item) => {
                const isActive = isRouteActive(item.href)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      <div className="app-sidebar-surface p-4 border-t border-border sticky bottom-0 bg-card">
        <div className="px-3 py-3 rounded-lg bg-muted/50">
          <p className="text-xs font-medium text-muted-foreground">Version</p>
          <p className="text-sm font-semibold mt-1">{tenant?.version ?? "—"}</p>
        </div>
      </div>
    </aside>
  )
}
