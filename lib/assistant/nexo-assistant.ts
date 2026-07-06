export interface AssistantContext {
  input: string
  pathname: string
  isNexoAdmin: boolean
  canImport: boolean
  canExport: boolean
  language?: "es" | "en"
}

export interface AssistantSuggestion {
  label: string
  detail?: string
  href: string
  permission?: "import" | "export" | "nexoAdmin"
}

export interface AssistantReply {
  text: string
  suggestions: AssistantSuggestion[]
}

type ScreenKey = "dashboard" | "sales" | "invoicing" | "inventory" | "clients" | "priceLists" | "admin" | "default"

const SCREEN_HELP: Record<ScreenKey, string> = {
  dashboard:
    "Estás en el Panel de Control. Aquí puedes revisar ventas, margen, productos más vendidos, alertas de inventario y accesos rápidos a reportes.",
  sales:
    "Estás en Ventas. Puedes crear ventas, buscar pedidos, revisar disponibilidad, calcular margen y generar remisiones o facturas.",
  invoicing:
    "Estás en Facturación. Puedes revisar facturas pendientes, registrar pagos, abrir documentos, imprimir y exportar facturas.",
  inventory:
    "Estás en Inventario. Puedes buscar productos, ver lotes, caducidades, movimientos, ajustar existencias y transferir entre almacenes.",
  clients:
    "Estás en Clientes. Puedes buscar clientes, revisar saldo, últimas ventas, facturas pendientes, contactos y abrir su actividad comercial.",
  priceLists:
    "Estás en Listas de Precios. Puedes buscar productos, ordenar por precio, filtrar por marca/familia, comparar menudeo contra mayoreo, exportar la lista o abrir el detalle de un producto.",
  admin:
    "Estás en Empresas. Aquí puedes revisar las empresas configuradas, entrar a una empresa, cambiar módulos o ajustar su configuración.",
  default: "Estás en Nexo ERP. Puedo ayudarte a navegar, buscar registros, importar datos o explicar la pantalla actual.",
}

const SCREEN_ACTIONS: Record<ScreenKey, AssistantSuggestion[]> = {
  dashboard: [
    { label: "Ver ventas del mes", href: "/dashboard/ventas/ordenes" },
    { label: "Ver productos más vendidos", href: "/dashboard" },
    { label: "Ver inventario bajo", href: "/dashboard/inventory" },
    { label: "Ver facturas pendientes", href: "/dashboard/facturacion" },
    { label: "Ver cobranza", href: "/dashboard/banking" },
    { label: "Importar datos", href: "/dashboard/import", permission: "import" },
    { label: "Exportar reporte", href: "/dashboard/reports", permission: "export" },
  ],
  sales: [
    { label: "Nueva venta", href: "/dashboard/ventas/ordenes/new" },
    { label: "Buscar pedido", href: "/dashboard/ventas/ordenes" },
    { label: "Ver pedidos pendientes", href: "/dashboard/ventas/ordenes" },
    { label: "Ver margen", href: "/dashboard/ventas/ordenes" },
    { label: "Ver disponibilidad", href: "/dashboard/inventory" },
    { label: "Generar remisión", href: "/dashboard/ventas/ordenes" },
    { label: "Generar factura", href: "/dashboard/facturacion" },
    { label: "Exportar ventas", href: "/dashboard/ventas/ordenes", permission: "export" },
  ],
  invoicing: [
    { label: "Nueva factura", href: "/dashboard/facturacion" },
    { label: "Facturas pendientes", href: "/dashboard/facturacion" },
    { label: "Registrar pago", href: "/dashboard/banking" },
    { label: "Ver notas de crédito", href: "/dashboard/facturacion" },
    { label: "Ver complementos de pago", href: "/dashboard/facturacion" },
    { label: "Exportar facturas", href: "/dashboard/facturacion", permission: "export" },
  ],
  inventory: [
    { label: "Buscar producto", href: "/dashboard/inventory" },
    { label: "Ver lotes", href: "/dashboard/inventario-lotes" },
    { label: "Ver caducidades", href: "/dashboard/inventario-lotes" },
    { label: "Ajustar inventario", href: "/dashboard/warehouse" },
    { label: "Transferir almacén", href: "/dashboard/warehouse" },
    { label: "Importar inventario", href: "/dashboard/import", permission: "import" },
    { label: "Exportar inventario", href: "/dashboard/inventory", permission: "export" },
  ],
  clients: [
    { label: "Buscar cliente", href: "/dashboard/clients" },
    { label: "Nuevo cliente", href: "/dashboard/clients" },
    { label: "Ver saldo", href: "/dashboard/clients" },
    { label: "Ver últimas ventas", href: "/dashboard/clients" },
    { label: "Ver facturas pendientes", href: "/dashboard/facturacion" },
    { label: "Ver contactos", href: "/dashboard/clients" },
    { label: "Exportar clientes", href: "/dashboard/clients", permission: "export" },
  ],
  priceLists: [
    { label: "Buscar producto", href: "/dashboard/listas-precios" },
    { label: "Comparar menudeo y mayoreo", href: "/dashboard/listas-precios" },
    { label: "Filtrar por marca", href: "/dashboard/listas-precios" },
    { label: "Exportar lista", href: "/dashboard/listas-precios", permission: "export" },
  ],
  admin: [
    { label: "Crear empresa", href: "/admin/tenants", permission: "nexoAdmin" },
    { label: "Configurar módulos", href: "/admin/modules", permission: "nexoAdmin" },
    { label: "Configurar usuarios", href: "/admin/users", permission: "nexoAdmin" },
    { label: "Configurar permisos", href: "/admin/roles", permission: "nexoAdmin" },
    { label: "Configurar diseño", href: "/admin/branding", permission: "nexoAdmin" },
    { label: "Ver auditoría global", href: "/admin/audit", permission: "nexoAdmin" },
    { label: "Revisar integraciones", href: "/admin/integrations", permission: "nexoAdmin" },
  ],
  default: [
    { label: "Ver clientes", href: "/dashboard/clients" },
    { label: "Ver inventario", href: "/dashboard/inventory" },
    { label: "Ver ventas", href: "/dashboard/ventas/ordenes" },
    { label: "Importar datos", href: "/dashboard/import", permission: "import" },
  ],
}

export function normalizeAssistantText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:]/g, " ")
    .replace(/\bq\b/g, "que")
    .replace(/\bk\b/g, "que")
    .replace(/\baki\b/g, "aqui")
    .replace(/\baqi\b/g, "aqui")
    .replace(/\s+/g, " ")
    .trim()
}

export function buildAssistantReply(context: AssistantContext): AssistantReply {
  const query = normalizeAssistantText(context.input)
  const screen = resolveScreen(context.pathname)

  if (isHelpIntent(query)) return { text: screenHelp(screen, context), suggestions: allowedActions(screen, context) }
  if (isImportIntent(query)) return permissionReply(context.canImport, "Centro de Importación", "/dashboard/import", "import")
  if (isExportIntent(query)) return permissionReply(context.canExport, "Exportar información", context.pathname, "export")
  if (/factura|cobrar|pago|pendiente|saldo/.test(query)) {
    return { text: "Te llevo a la vista donde puedes revisar facturas, saldos y pagos pendientes.", suggestions: allowedActions("invoicing", context) }
  }
  if (/inventario|lote|caduc|movimiento|almacen|producto/.test(query)) {
    return { text: "Estas opciones te ayudan a revisar inventario, lotes, caducidades y movimientos.", suggestions: allowedActions("inventory", context) }
  }
  if (/venta|pedido|remision|margen|disponibilidad/.test(query)) {
    return { text: "Estas acciones te ayudan a operar ventas, pedidos, disponibilidad y documentos relacionados.", suggestions: allowedActions("sales", context) }
  }
  if (/cliente|contacto|crm/.test(query)) {
    return { text: "Estas acciones te ayudan a buscar clientes, revisar saldos y dar seguimiento comercial.", suggestions: allowedActions("clients", context) }
  }

  return {
    text: "Puedo ayudarte a navegar por ventas, clientes, inventario, facturación o importación de datos. Escribe lo que quieres hacer con tus palabras.",
    suggestions: allowedActions(screen, context).slice(0, 4),
  }
}

function resolveScreen(pathname: string): ScreenKey {
  if (pathname.startsWith("/admin")) return "admin"
  if (pathname.startsWith("/dashboard/ventas") || pathname.startsWith("/dashboard/sales")) return "sales"
  if (pathname.startsWith("/dashboard/facturacion")) return "invoicing"
  if (
    pathname.startsWith("/dashboard/inventory") ||
    pathname.startsWith("/dashboard/inventario-lotes") ||
    pathname.startsWith("/dashboard/warehouse")
  ) {
    return "inventory"
  }
  if (pathname.startsWith("/dashboard/clients") || pathname.startsWith("/dashboard/crm")) return "clients"
  if (pathname.startsWith("/dashboard/listas-precios")) return "priceLists"
  if (pathname === "/dashboard") return "dashboard"
  return "default"
}

function screenHelp(screen: ScreenKey, context: AssistantContext): string {
  if (screen === "admin" && !context.isNexoAdmin) {
    return "No tienes permiso para Administración Nexo. Puedo ayudarte con acciones de tu empresa dentro del ERP."
  }
  return SCREEN_HELP[screen]
}

function allowedActions(screen: ScreenKey, context: AssistantContext): AssistantSuggestion[] {
  if (screen === "admin" && !context.isNexoAdmin) return []
  return SCREEN_ACTIONS[screen].filter((action) => {
    if (action.permission === "nexoAdmin") return context.isNexoAdmin
    if (action.permission === "import") return context.canImport
    if (action.permission === "export") return context.canExport
    return true
  })
}

function isHelpIntent(query: string): boolean {
  return /que puedo hacer|que hay aqui|ayuda|explica|esta pantalla|donde estoy|como funciona/.test(query)
}

function isImportIntent(query: string): boolean {
  return /import|carga|subir|excel|csv|cargo productos|cargar productos|importar clientes/.test(query)
}

function isExportIntent(query: string): boolean {
  return /export|descargar|reporte/.test(query)
}

function permissionReply(allowed: boolean, label: string, href: string, permission: "import" | "export"): AssistantReply {
  if (!allowed) {
    return {
      text: "No tienes permiso para esta acción. Pide a un administrador de empresa que revise tus permisos.",
      suggestions: [],
    }
  }
  return {
    text:
      permission === "import"
        ? "Te llevo al Centro de Importación. Ahí puedes descargar plantilla, subir archivo y validar antes de guardar."
        : "Puedes exportar desde la tabla del módulo respetando filtros y columnas visibles.",
    suggestions: [{ label, href, permission }],
  }
}
