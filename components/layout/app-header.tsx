"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Calendar, LogOut, Settings, UserCircle } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TenantIndicator } from "@/components/layout/tenant-indicator"
import { UserPreferenceSelects } from "@/components/layout/user-preference-selects"
import { useAuth } from "@/contexts/auth-context"
import { useFirestore } from "@/hooks/use-firestore"
import { COLLECTIONS } from "@/lib/firestore"

type NotificationItem = {
  id: string
  title?: string
  body?: string
  read?: boolean
  createdAt?: any
}

export function AppHeader() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const { items: notifications, update: updateNotification } = useFirestore<NotificationItem>(
    COLLECTIONS.notifications,
    [],
    true,
  )

  const moduleTitles: Record<string, string> = {
    "/dashboard": "Panel de Control",
    "/dashboard/clients": "Clientes / CRM",
    "/dashboard/sales": "Ventas",
    "/dashboard/ventas": "Ventas",
    "/dashboard/inventory": "Inventario y Almacén",
    "/dashboard/inventario-existencias": "Inventario y Almacén",
    "/dashboard/inventario-lotes": "Inventario por Lote",
    "/dashboard/warehouse": "Inventario y Almacén",
    "/dashboard/accounting": "Contabilidad",
    "/dashboard/production": "Producción",
    "/dashboard/maintenance": "Mantenimiento",
    "/dashboard/service": "Servicio",
    "/dashboard/payroll": "Nómina / RRHH",
    "/dashboard/field-services": "Servicio en Campo",
    "/dashboard/reports": "Reportes",
    "/dashboard/ecommerce": "Comercio digital",
    "/dashboard/eprocurement": "Compras digitales",
    "/dashboard/attributes": "Atributos",
    "/dashboard/bi": "Indicadores",
    "/dashboard/business-intelligence": "Indicadores",
    "/dashboard/web-mobile": "ERP Web / Móvil",
    "/dashboard/orders": "Órdenes",
    "/dashboard/suppliers": "Proveedores",
    "/dashboard/punto-venta": "Punto de Venta",
    "/dashboard/calendar": "Calendario",
    "/dashboard/settings": "Configuración",
    "/dashboard/facturacion": "Facturación",
    "/dashboard/admin": "Usuarios y permisos",
    "/dashboard/listas-precios": "Listas de Precios",
  }

  const resolvedTitle =
    Object.keys(moduleTitles)
      .sort((a, b) => b.length - a.length)
      .find((key) => pathname === key || pathname.startsWith(`${key}/`)) || ""
  const headerTitle = moduleTitles[resolvedTitle] || "Nexo ERP"

  const unreadCount = notifications.filter((item) => !item?.read).length
  const sortedNotifications = [...notifications].sort((a, b) => getNotificationTime(b?.createdAt) - getNotificationTime(a?.createdAt))

  async function handleMarkRead(notification: NotificationItem) {
    if (notification.read) return
    await updateNotification(notification.id, { read: true, readAt: new Date().toISOString() } as any)
  }

  async function handleMarkAllRead() {
    const unreadItems = notifications.filter((item) => !item?.read)
    for (const item of unreadItems) {
      await updateNotification(item.id, { read: true, readAt: new Date().toISOString() } as any)
    }
  }

  return (
    <header className="app-header min-h-[76px] border-b bg-card/95 px-5 py-3 sm:px-7">
      <div className="flex min-h-[52px] items-center justify-between gap-5">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">{headerTitle}</h2>
        </div>

        <div className="ml-auto flex min-w-0 items-center gap-3">
          <TenantIndicator />
          <UserPreferenceSelects className="hidden xl:flex" />

          <Button aria-label="Abrir calendario" asChild className="h-10 w-10" size="icon" variant="ghost">
            <Link href="/dashboard/calendar">
              <Calendar className="h-5 w-5" />
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label="Ver notificaciones" className="relative h-10 w-10" size="icon" variant="ghost">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between gap-3">
                <span>Notificaciones</span>
                {unreadCount > 0 && (
                  <Button className="h-7 px-2 text-xs" onClick={handleMarkAllRead} size="sm" variant="ghost">
                    Marcar todo como leído
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sortedNotifications.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Sin notificaciones por ahora.
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {sortedNotifications.map((item) => (
                    <DropdownMenuItem
                      className="flex flex-col items-start gap-1 whitespace-normal"
                      key={item.id}
                      onClick={() => handleMarkRead(item)}
                    >
                      <div className="flex w-full items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{item.title || "Notificación"}</p>
                        {!item.read && <span className="mt-1 h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      {item.body && <p className="text-xs text-muted-foreground">{item.body}</p>}
                      {item.createdAt && (
                        <p className="text-[11px] text-muted-foreground">{formatNotificationTime(item.createdAt)}</p>
                      )}
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label="Abrir perfil" className="relative h-10 w-10" size="icon" variant="ghost">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{getUserInitials(user?.name || user?.email)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name || "Usuario"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  {user?.role && (
                    <span className="mt-1 inline-flex w-fit items-center rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {user.role === "admin" ? "Administrador" : "Usuario"}
                    </span>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <UserCircle className="mr-2 h-4 w-4" />
                  Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

function getUserInitials(value?: string | null) {
  const name = value || "Usuario"
  const parts = name.split(" ").filter(Boolean)
  if (parts.length === 0) return "U"
  return parts
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function getNotificationTime(value?: any) {
  if (!value) return 0
  if (typeof value === "string") return new Date(value).getTime()
  if (typeof value?.toDate === "function") return value.toDate().getTime()
  if (typeof value?.seconds === "number") return value.seconds * 1000
  return 0
}

function formatNotificationTime(value?: any) {
  const time = getNotificationTime(value)
  return time ? new Date(time).toLocaleString("es-MX") : ""
}
