"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Building2,
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
  ShoppingBag,
  Settings,
  MapPin,
  Smartphone,
  ShoppingBasket,
  Store,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "blue" },
  { name: "Bancos", href: "/dashboard/banking", icon: Building2, color: "blue" },
  { name: "Clientes / CRM", href: "/dashboard/clients", icon: Users, color: "blue" },
  { name: "Ventas", href: "/dashboard/ventas/ordenes", icon: ShoppingBasket, color: "blue" },
  { name: "Inventario", href: "/dashboard/inventory", icon: Package, color: "blue" },
  { name: "Punto de Venta", href: "/dashboard/punto-venta", icon: Store, color: "blue" },
  { name: "Proveedores", href: "/dashboard/suppliers", icon: Package, color: "blue" },
  { name: "Almacén", href: "/dashboard/warehouse", icon: Warehouse, color: "blue" },
  { name: "Contabilidad", href: "/dashboard/accounting", icon: Calculator, color: "blue" },
  { name: "Producción", href: "/dashboard/production", icon: Cog, color: "green" },
  { name: "Mantenimiento", href: "/dashboard/maintenance", icon: Wrench, color: "green" },
  { name: "Servicio", href: "/dashboard/service", icon: Headphones, color: "green" },
  { name: "Nómina / RRHH", href: "/dashboard/payroll", icon: UserCog, color: "blue" },
  { name: "Business Intelligence", href: "/dashboard/business-intelligence", icon: BarChart3, color: "blue" },
  { name: "ERP Web / Móvil", href: "/dashboard/web-mobile", icon: Smartphone, color: "advanced" },
  { name: "E-Commerce", href: "/dashboard/ecommerce", icon: ShoppingCart, color: "advanced" },
  { name: "E-Procurement", href: "/dashboard/eprocurement", icon: ShoppingBag, color: "advanced" },
  { name: "Atributos", href: "/dashboard/attributes", icon: Settings, color: "green" },
  { name: "Field Services", href: "/dashboard/field-services", icon: MapPin, color: "green" },
]

export function AppSidebar() {
  const pathname = usePathname()

  const isRouteActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    // For Ventas, check if current path starts with /dashboard/ventas
    if (href === "/dashboard/ventas/ordenes") {
      return pathname.startsWith("/dashboard/ventas")
    }
    // For other routes, check if they match exactly or are child routes
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <aside className="w-72 border-r border-border bg-card flex flex-col overflow-y-auto">
      <div className="p-6 border-b border-border sticky top-0 bg-card z-10">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <LayoutDashboard className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-xl leading-none">Nexo ERP</h1>
            <p className="text-xs text-muted-foreground mt-1.5">Sistema de Gestión</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground px-3 mb-2">MÓDULOS PRINCIPALES</p>
          {navigation
            .filter((item) => item.color === "blue")
            .slice(0, 6)
            .map((item) => {
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

        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground px-3 mb-2">OPERACIONES</p>
          {navigation
            .filter((item) => item.color === "green")
            .map((item) => {
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

        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground px-3 mb-2">GESTIÓN AVANZADA</p>
          {navigation
            .filter((item) => item.color === "blue")
            .slice(6)
            .map((item) => {
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
          {navigation
            .filter((item) => item.color === "advanced")
            .map((item) => {
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
      </nav>

      <div className="p-4 border-t border-border sticky bottom-0 bg-card">
        <div className="px-3 py-3 rounded-lg bg-muted/50">
          <p className="text-xs font-medium text-muted-foreground">Versión</p>
          <p className="text-sm font-semibold mt-1">1.0.0</p>
        </div>
      </div>
    </aside>
  )
}
