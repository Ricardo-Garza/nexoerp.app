"use client"

import { Bell, Calendar, LogOut, Settings, UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useFirestore } from "@/hooks/use-firestore"
import { COLLECTIONS } from "@/lib/firestore"
import { TenantIndicator } from "@/components/layout/tenant-indicator"

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
    "/dashboard/inventory": "Inventario",
    "/dashboard/warehouse": "Almacén",
    "/dashboard/accounting": "Contabilidad",
    "/dashboard/production": "Producción",
    "/dashboard/maintenance": "Mantenimiento",
    "/dashboard/service": "Servicio",
    "/dashboard/payroll": "Nómina / RRHH",
    "/dashboard/field-services": "Field Services",
    "/dashboard/reports": "Reportes",
    "/dashboard/ecommerce": "E-Commerce",
    "/dashboard/eprocurement": "E-Procurement",
    "/dashboard/attributes": "Atributos",
    "/dashboard/bi": "Business Intelligence",
    "/dashboard/business-intelligence": "Business Intelligence",
    "/dashboard/web-mobile": "ERP Web / Móvil",
    "/dashboard/orders": "Órdenes",
    "/dashboard/suppliers": "Proveedores",
    "/dashboard/punto-venta": "Punto de Venta",
    "/dashboard/calendar": "Calendario",
    "/dashboard/settings": "Configuracion",
    "/dashboard/facturacion": "Facturacion",
    "/dashboard/admin": "Usuarios y permisos",
  }

  const resolvedTitle =
    Object.keys(moduleTitles)
      .sort((a, b) => b.length - a.length)
      .find((key) => pathname === key || pathname.startsWith(key + "/")) || ""
  const headerTitle = moduleTitles[resolvedTitle] || "Nexo ERP"

  const getUserInitials = () => {
    if (!user) return "U"

    const name = user.name || user.email || "Usuario"
    const nameParts = name.split(" ").filter(Boolean)

    if (nameParts.length === 0) return "U"

    return nameParts
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleLogout = async () => {
    await logout()
  }

  const unreadCount = notifications.filter((item) => !item?.read).length
  const sortedNotifications = [...notifications].sort((a, b) => {
    const getTime = (value?: any) => {
      if (!value) return 0
      if (typeof value === "string") return new Date(value).getTime()
      if (typeof value?.toDate === "function") return value.toDate().getTime()
      if (typeof value?.seconds === "number") return value.seconds * 1000
      return 0
    }

    return getTime(b?.createdAt) - getTime(a?.createdAt)
  })

  const formatNotificationTime = (value?: any) => {
    if (!value) return ""
    if (typeof value === "string") {
      return new Date(value).toLocaleString("es-MX")
    }
    if (typeof value?.toDate === "function") {
      return value.toDate().toLocaleString("es-MX")
    }
    if (typeof value?.seconds === "number") {
      return new Date(value.seconds * 1000).toLocaleString("es-MX")
    }
    return ""
  }

  const handleMarkRead = async (notification: NotificationItem) => {
    if (notification.read) return
    await updateNotification(notification.id, { read: true, readAt: new Date().toISOString() } as any)
  }

  const handleMarkAllRead = async () => {
    const unreadItems = notifications.filter((item) => !item?.read)
    for (const item of unreadItems) {
      await updateNotification(item.id, { read: true, readAt: new Date().toISOString() } as any)
    }
  }

  return (
    <header className="app-header h-16 border-b bg-card px-6 flex items-center justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold">{headerTitle}</h2>
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <TenantIndicator />
        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link href="/dashboard/calendar">
            <Calendar className="w-5 h-5" />
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-primary text-[10px] text-white flex items-center justify-center px-1">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notificaciones</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={handleMarkAllRead}
                >
                  Marcar todo como leido
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
                    key={item.id}
                    className="flex flex-col items-start gap-1 whitespace-normal"
                    onClick={() => handleMarkRead(item)}
                  >
                    <div className="flex w-full items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {item.title || "Notificacion"}
                      </p>
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
            <Button variant="ghost" size="icon" className="relative">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs">{getUserInitials()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || "Usuario"}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                {user?.role && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary mt-1 w-fit">
                    {user.role === "admin" ? "Administrador" : "Usuario"}
                  </span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <UserCircle className="w-4 h-4 mr-2" />
                Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings className="w-4 h-4 mr-2" />
                Configuracion
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

