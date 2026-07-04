"use client"

import Link from "next/link"
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
  CalendarDays,
  FileText,
} from "lucide-react"

const sections = [
  {
    title: "MODULOS PRINCIPALES",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Clientes / CRM", href: "/dashboard/clients", icon: Users },
      { name: "Ventas", href: "/dashboard/ventas/ordenes", icon: ShoppingBasket },
      { name: "Facturacion", href: "/dashboard/facturacion", icon: FileText },
      { name: "Proveedores", href: "/dashboard/suppliers", icon: Package },
      { name: "Inventario", href: "/dashboard/inventory", icon: Package },
      { name: "Catalogo", href: "/dashboard/catalogo", icon: BookOpen },
      { name: "Listas de Precios", href: "/dashboard/listas-precios", icon: Tags },
      { name: "Inventario por Lote", href: "/dashboard/inventario-lotes", icon: Boxes },
      { name: "Almacen", href: "/dashboard/warehouse", icon: Warehouse },
      { name: "Punto de Venta", href: "/dashboard/punto-venta", icon: Store },
      { name: "Bancos / Tesoreria", href: "/dashboard/banking", icon: Building2 },
    ],
  },
  {
    title: "OPERACIONES",
    items: [
      { name: "Produccion", href: "/dashboard/production", icon: Cog },
      { name: "Mantenimiento", href: "/dashboard/maintenance", icon: Wrench },
      { name: "Servicio / Soporte", href: "/dashboard/service", icon: Headphones },
    ],
  },
  {
    title: "ADMINISTRACION",
    items: [
      { name: "Contabilidad", href: "/dashboard/accounting", icon: Calculator },
      { name: "Nomina / RRHH", href: "/dashboard/payroll", icon: UserCog },
      { name: "Configuracion", href: "/dashboard/configuracion", icon: Settings },
    ],
  },
  {
    title: "ANALITICA",
    items: [{ name: "Business Intelligence", href: "/dashboard/business-intelligence", icon: BarChart3 }],
  },
  {
    title: "EXPANSION",
    items: [
      { name: "ERP Web / Movil", href: "/dashboard/web-mobile", icon: Smartphone },
      { name: "E-Commerce", href: "/dashboard/ecommerce", icon: ShoppingCart },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

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
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <LayoutDashboard className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-xl leading-none">Nexo ERP</h1>
            <p className="text-xs text-muted-foreground mt-1.5">Sistema de Gestion</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-6">
        {sections.map((section) => {
          const items = section.title === "ADMINISTRACION"
            ? section.items.concat(
                user?.role === "admin"
                  ? [{ name: "Usuarios y permisos", href: "/dashboard/admin/users", icon: Users }]
                  : [],
              )
            : section.items
          return (
          <div key={section.title} className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground px-3 mb-2">{section.title}</p>
            {items.map((item) => {
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
          <p className="text-sm font-semibold mt-1">1.0.0</p>
        </div>
      </div>
    </aside>
  )
}
