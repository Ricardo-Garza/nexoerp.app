"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  BookOpen,
  Boxes,
  Building2,
  Calculator,
  Cog,
  FileText,
  Headphones,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  Shield,
  ShoppingBasket,
  ShoppingCart,
  Smartphone,
  Store,
  Tags,
  Upload,
  UserCog,
  Users,
  Warehouse,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useErpPreferences } from "@/hooks/use-erp-preferences"
import { usePlatform } from "@/contexts/platform-context"
import { NexoLogo } from "@/components/brand/nexo-logo"
import { buildTenantMenu, type TenantMenuSection } from "@/lib/platform/menu"
import { getTenant } from "@/lib/platform/tenant-store"
import { getUiText } from "@/lib/i18n/erp-ui"
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
  const { language } = useErpPreferences()
  const text = getUiText(language)
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
    if (href === "/dashboard") return pathname === "/dashboard"
    if (href === "/dashboard/ventas/ordenes") return pathname.startsWith("/dashboard/ventas")
    return pathname === href || pathname.startsWith(href + "/")
  }

  const sectionLabel = (title: string) => {
    if (title === "MODULOS PRINCIPALES") return text.nav.sections.main
    if (title === "OPERACIONES") return text.nav.sections.operations
    if (title === "ADMINISTRACION") return text.nav.sections.administration
    if (title === "ANALITICA") return text.nav.sections.analytics
    if (title === "DIGITAL") return text.nav.sections.digital
    return title
  }

  const moduleLabel = (item: TenantMenuSection["items"][number]) => {
    const labels: Partial<Record<ModuleId, string>> = {
      dashboard: text.nav.modules.dashboard,
      crm: text.nav.modules.crm,
      sales: text.nav.modules.sales,
      invoicing: text.nav.modules.invoicing,
      suppliers: text.nav.modules.suppliers,
      inventory: text.nav.modules.inventory,
      productsPricing: text.nav.modules.productsPricing,
      pos: text.nav.modules.pos,
      banking: text.nav.modules.banking,
      production: text.nav.modules.production,
      maintenance: text.nav.modules.maintenance,
      service: text.nav.modules.service,
      accounting: text.nav.modules.accounting,
      payroll: text.nav.modules.payroll,
      bi: text.nav.modules.bi,
      imports: text.nav.modules.imports,
      webMobile: text.nav.modules.webMobile,
      ecommerce: text.nav.modules.ecommerce,
    }
    return labels[item.moduleId] ?? item.name
  }

  return (
    <aside className="app-sidebar w-72 shrink-0 overflow-y-auto border-r border-border bg-card">
      <div className="app-sidebar-surface sticky top-0 z-10 border-b border-border bg-card p-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <NexoLogo label={tenant?.branding.logoText ?? "Nexo ERP"} />
        </Link>
      </div>

      <nav className="flex-1 space-y-6 p-4">
        {isPlatformAdmin && (
          <div className="space-y-1">
            <p className="mb-2 px-3 text-xs font-semibold text-muted-foreground">{text.nav.platform}</p>
            <Link
              href="/admin"
              data-testid="sidebar-control-plane"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                pathname.startsWith("/admin")
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-primary/10 text-primary hover:bg-primary/20",
              )}
            >
              <Shield className="h-4 w-4 shrink-0" />
              <span className="truncate">{text.nav.administration}</span>
            </Link>
          </div>
        )}

        {sections.map((section) => {
          const extraItems =
            section.title === "ADMINISTRACION"
              ? [
                  { name: text.nav.settings, href: "/dashboard/configuracion", icon: Settings },
                  ...(user?.role === "admin"
                    ? [{ name: text.nav.usersPermissions, href: "/dashboard/admin/users", icon: Users }]
                    : []),
                ]
              : []

          return (
            <div key={section.title} className="space-y-1">
              <p className="mb-2 px-3 text-xs font-semibold text-muted-foreground">{sectionLabel(section.title)}</p>
              {section.items.map((item) => {
                const Icon = MODULE_ICONS[item.moduleId] ?? Package
                const isActive = isRouteActive(item.href)
                return (
                  <Link
                    key={item.moduleId}
                    href={item.href}
                    data-testid={`sidebar-module-${item.moduleId}`}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{moduleLabel(item)}</span>
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
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      <div className="app-sidebar-surface sticky bottom-0 border-t border-border bg-card p-4">
        <div className="rounded-lg bg-muted/50 px-3 py-3">
          <p className="text-xs font-medium text-muted-foreground">{text.nav.version}</p>
          <p className="mt-1 text-sm font-semibold">{tenant?.version ?? "-"}</p>
        </div>
      </div>
    </aside>
  )
}
