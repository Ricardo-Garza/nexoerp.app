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
import { useErpPreferences } from "@/hooks/use-erp-preferences"
import { getUiText } from "@/lib/i18n/erp-ui"
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
  const { language } = useErpPreferences()
  const text = getUiText(language)
  const { items: notifications, update: updateNotification } = useFirestore<NotificationItem>(
    COLLECTIONS.notifications,
    [],
    true,
  )

  const moduleTitles: Record<string, string> = {
    "/dashboard": text.nav.modules.dashboard,
    "/dashboard/clients": language === "en" ? "Customers" : "Clientes",
    "/dashboard/sales": text.nav.modules.sales,
    "/dashboard/ventas": text.nav.modules.sales,
    "/dashboard/inventory": text.nav.modules.inventory,
    "/dashboard/inventario-existencias": text.nav.modules.inventory,
    "/dashboard/inventario-lotes": language === "en" ? "Lot Inventory" : "Inventario por Lote",
    "/dashboard/warehouse": text.nav.modules.inventory,
    "/dashboard/accounting": text.nav.modules.accounting,
    "/dashboard/production": text.nav.modules.production,
    "/dashboard/maintenance": text.nav.modules.maintenance,
    "/dashboard/service": text.nav.modules.service,
    "/dashboard/payroll": text.nav.modules.payroll,
    "/dashboard/field-services": language === "en" ? "Field service" : "Servicio en Campo",
    "/dashboard/reports": text.nav.modules.bi,
    "/dashboard/ecommerce": text.nav.modules.ecommerce,
    "/dashboard/eprocurement": language === "en" ? "Digital purchasing" : "Compras digitales",
    "/dashboard/attributes": language === "en" ? "Attributes" : "Atributos",
    "/dashboard/bi": text.nav.modules.bi,
    "/dashboard/business-intelligence": text.nav.modules.bi,
    "/dashboard/web-mobile": text.nav.modules.webMobile,
    "/dashboard/orders": language === "en" ? "Orders" : "Ordenes",
    "/dashboard/suppliers": text.nav.modules.suppliers,
    "/dashboard/punto-venta": text.nav.modules.pos,
    "/dashboard/calendar": language === "en" ? "Calendar" : "Calendario",
    "/dashboard/settings": text.header.settings,
    "/dashboard/configuracion": text.header.settings,
    "/dashboard/facturacion": text.nav.modules.invoicing,
    "/dashboard/admin": text.nav.usersPermissions,
    "/dashboard/listas-precios": language === "en" ? "Price Lists" : "Listas de Precios",
    "/dashboard/productos-precios": text.nav.modules.productsPricing,
    "/dashboard/import": text.nav.modules.imports,
    "/dashboard/crm": text.nav.modules.crm,
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

          <Button aria-label={text.header.calendar} asChild className="h-10 w-10" size="icon" variant="ghost">
            <Link href="/dashboard/calendar">
              <Calendar className="h-5 w-5" />
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label={text.header.notifications} className="relative h-10 w-10" size="icon" variant="ghost">
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
                <span>{text.header.notifications}</span>
                {unreadCount > 0 && (
                  <Button className="h-7 px-2 text-xs" onClick={handleMarkAllRead} size="sm" variant="ghost">
                    {text.header.markAllRead}
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sortedNotifications.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  {text.header.noNotifications}
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
                        <p className="text-sm font-medium text-foreground">{item.title || text.header.notification}</p>
                        {!item.read && <span className="mt-1 h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      {item.body && <p className="text-xs text-muted-foreground">{item.body}</p>}
                      {item.createdAt && (
                        <p className="text-[11px] text-muted-foreground">{formatNotificationTime(item.createdAt, language)}</p>
                      )}
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label={text.header.openProfile} className="relative h-10 w-10" size="icon" variant="ghost">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{getUserInitials(user?.name || user?.email)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name || text.header.user}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  {user?.role && (
                    <span className="mt-1 inline-flex w-fit items-center rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {user.role === "admin" ? text.header.administrator : text.header.user}
                    </span>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <UserCircle className="mr-2 h-4 w-4" />
                  {text.header.profile}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  {text.header.settings}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                {text.header.logout}
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

function formatNotificationTime(value: any, language: "es" | "en") {
  const time = getNotificationTime(value)
  return time ? new Date(time).toLocaleString(language === "en" ? "en-US" : "es-MX") : ""
}
