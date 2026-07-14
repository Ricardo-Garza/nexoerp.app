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

type ScreenKey =
  | "dashboard"
  | "sales"
  | "invoicing"
  | "inventory"
  | "inventoryLots"
  | "clients"
  | "crm"
  | "suppliers"
  | "priceLists"
  | "catalog"
  | "productsPricing"
  | "inventoryStock"
  | "warehouse"
  | "banking"
  | "accounting"
  | "payroll"
  | "production"
  | "maintenance"
  | "service"
  | "bi"
  | "settings"
  | "admin"
  | "default"

const SCREEN_HELP: Record<ScreenKey, string> = {
  dashboard:
    "Estás en el Panel de Control. Aquí puedes revisar ventas, margen, productos más vendidos, alertas de inventario y accesos rápidos a reportes.",
  sales:
    "Estás en Ventas. Puedes crear ventas, buscar pedidos, revisar disponibilidad, calcular margen y generar remisiones o facturas.",
  invoicing:
    "Estás en Facturación. Puedes revisar facturas pendientes, registrar pagos, abrir documentos, imprimir y exportar facturas.",
  inventory:
    "Estás en Inventario. Puedes buscar productos, ver lotes, caducidades, movimientos, ajustar existencias y transferir entre almacenes.",
  inventoryLots:
    "Estás en Inventario por Lote. Puedes buscar lote, revisar vencimientos, validar disponibilidad, exportar inventario y ver últimos movimientos.",
  clients:
    "Estás en Clientes. Puedes buscar clientes, revisar saldo, últimas ventas, facturas pendientes, contactos y abrir su actividad comercial.",
  crm:
    "Estás en CRM Momentum. Aquí vive tu cartera comercial: clientes, contactos, prospectos, oportunidades y actividades. Puedes sincronizar, revisar el historial y abrir el CRM completo.",
  suppliers:
    "Estás en Proveedores. Puedes buscar proveedores, revisar compras, saldos por pagar, productos que surten y sus datos de contacto.",
  priceLists:
    "Estás en Listas de Precios. Puedes buscar productos, ordenar por precio, filtrar por marca o familia, comparar menudeo contra mayoreo, exportar la lista o abrir el detalle de un producto.",
  catalog:
    "Estás en Catálogo. Puedes buscar por SKU, producto, marca o familia, revisar presentaciones, precios y abrir el detalle de cada producto.",
  productsPricing:
    "Estás en Productos y Precios. Puedes buscar por SKU, producto, familia o aplicación, ver productos sin precio, capturar o importar precios, cambiar entre vista tabla, tarjetas o lista, y exportar el catálogo o la lista de precios.",
  inventoryStock:
    "Estás en Inventario y Almacén. Puedes revisar existencias, almacenes, movimientos, transferencias, conteos físicos, reportes, stock bajo y trazabilidad.",
  warehouse:
    "Estás en Inventario y Almacén. Puedes revisar existencias por almacén, registrar entradas, salidas, transferencias, conteos físicos y reportes.",
  banking:
    "Estás en Bancos. Puedes revisar cuentas, movimientos, ingresos y egresos, conciliar y exportar el estado de cuenta.",
  accounting:
    "Estás en Contabilidad. Puedes revisar el catálogo de cuentas, registrar pólizas, ver debe y haber, y cargar tu catálogo desde Excel.",
  payroll:
    "Estás en Nómina y Recursos Humanos. Puedes revisar empleados, incidencias, periodos de nómina, vacaciones, importar empleados y exportar reportes.",
  production:
    "Estás en Producción. Puedes crear órdenes de producción, reservar materiales, registrar producción terminada y revisar el avance.",
  maintenance:
    "Estás en Mantenimiento. Puedes programar mantenimientos, revisar equipos, registrar lecturas y consultar el historial por equipo.",
  service:
    "Estás en Servicio y Soporte. Puedes crear tickets, dar seguimiento a los tuyos, buscar guías y contactar a soporte.",
  bi: "Estás en Reportes e Indicadores. Puedes revisar ventas, márgenes, rotación de inventario y exportar reportes por periodo.",
  settings:
    "Estás en Configuración. Puedes ajustar idioma, tema, datos de tu empresa y preferencias de tus tablas y vistas.",
  admin:
    "Estás en Empresas. Aquí puedes revisar las empresas configuradas, entrar a una empresa, cambiar módulos o ajustar su configuración.",
  default: "Estás en Nexo ERP. Puedo ayudarte a navegar, buscar registros, importar datos o explicar la pantalla actual.",
}

const SCREEN_HELP_EN: Record<ScreenKey, string> = {
  dashboard:
    "You are on the Dashboard. You can review sales, margin, top products, inventory alerts and quick links to reports.",
  sales:
    "You are in Sales. You can create sales, search orders, check availability, calculate margin and generate delivery notes or invoices.",
  invoicing:
    "You are in Invoicing. You can review pending invoices, register payments, open documents, print and export invoices.",
  inventory:
    "You are in Inventory. You can search products, view lots, expiry dates, movements, adjust stock and transfer between warehouses.",
  inventoryLots:
    "You are in Lot Inventory. You can search lots, review expirations, validate availability, export inventory and see recent movements.",
  clients:
    "You are in Customers. You can search customers, review balances, recent sales, pending invoices and contact details.",
  crm:
    "You are in CRM Momentum. This is where your commercial data lives: customers, contacts, prospects, deals and activities. You can sync, review history and open the full CRM.",
  suppliers:
    "You are in Suppliers. You can search suppliers, review purchases, payables and their contact details.",
  priceLists:
    "You are in Price Lists. You can search products, sort by price, filter by brand or family, compare retail and wholesale, and export the list.",
  catalog:
    "You are in Catalog. You can search by SKU, product, brand or family, and open each product's detail.",
  productsPricing:
    "You are in Products and Pricing. You can search by SKU, product, family or application, see products without price, capture or import prices, switch between table, cards or list view, and export the catalog or price list.",
  inventoryStock:
    "You are in Inventory and Warehouse. You can review stock, warehouses, movements, transfers, physical counts, reports, low stock and traceability.",
  warehouse:
    "You are in Inventory and Warehouse. You can review stock by warehouse, register receipts, issues, transfers, physical counts and reports.",
  banking:
    "You are in Banking. You can review accounts, movements, income and expenses, reconcile and export the statement.",
  accounting:
    "You are in Accounting. You can review the chart of accounts, register journal entries, view debits and credits, and import your chart from Excel.",
  payroll:
    "You are in Payroll and HR. You can review employees, incidents, payroll periods, vacations, import employees and export reports.",
  production:
    "You are in Production. You can create production orders, reserve materials, register finished production and track progress.",
  maintenance:
    "You are in Maintenance. You can schedule maintenance, review equipment, register readings and check each unit's history.",
  service: "You are in Service and Support. You can create tickets, follow up on yours and contact support.",
  bi: "You are in Reports. You can review sales, margins, inventory rotation and export reports by period.",
  settings:
    "You are in Settings. You can adjust language, theme, company data and your table and view preferences.",
  admin:
    "You are in Companies. You can review configured companies, enter one, change modules or adjust its settings.",
  default: "You are in Nexo ERP. I can help you navigate, search records, import data or explain the current screen.",
}

const SCREEN_ACTIONS: Record<ScreenKey, AssistantSuggestion[]> = {
  dashboard: [
    { label: "Ver ventas del mes", href: "/dashboard/ventas/ordenes" },
    { label: "Ver productos más vendidos", href: "/dashboard" },
    { label: "Ver inventario bajo", href: "/dashboard/inventory" },
    { label: "Ver facturas pendientes", href: "/dashboard/facturacion" },
    { label: "Ver cobranza", href: "/dashboard/banking" },
    { label: "Configurar dashboard", href: "/dashboard?configurar=1" },
    { label: "Importar datos", href: "/dashboard/import", permission: "import" },
    { label: "Exportar indicadores", href: "/dashboard/reports", permission: "export" },
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
    { label: "Buscar factura", href: "/dashboard/facturacion" },
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
    { label: "Ajustar inventario", href: "/dashboard/inventory" },
    { label: "Transferir almacén", href: "/dashboard/inventory" },
    { label: "Importar inventario", href: "/dashboard/import", permission: "import" },
    { label: "Exportar inventario", href: "/dashboard/inventory", permission: "export" },
  ],
  inventoryLots: [
    { label: "Buscar lote", href: "/dashboard/inventario-lotes" },
    { label: "Ver vencimientos", href: "/dashboard/inventario-lotes" },
    { label: "Ver productos disponibles", href: "/dashboard/inventario-lotes" },
    { label: "Ver últimos movimientos", href: "/dashboard/inventario-lotes" },
    { label: "Exportar inventario", href: "/dashboard/inventario-lotes", permission: "export" },
  ],
  clients: [
    { label: "Buscar cliente", href: "/dashboard/clients" },
    { label: "Nuevo cliente", href: "/dashboard/clients" },
    { label: "Ver saldo", href: "/dashboard/clients" },
    { label: "Ver últimas ventas", href: "/dashboard/clients" },
    { label: "Ver facturas pendientes", href: "/dashboard/facturacion" },
    { label: "Importar clientes", href: "/dashboard/import", permission: "import" },
    { label: "Exportar clientes", href: "/dashboard/clients", permission: "export" },
  ],
  crm: [
    { label: "Buscar cliente en CRM", href: "/dashboard/crm" },
    { label: "Ver prospectos", href: "/dashboard/crm" },
    { label: "Ver oportunidades", href: "/dashboard/crm" },
    { label: "Ver actividad comercial", href: "/dashboard/crm" },
    { label: "Sincronizar cliente", href: "/dashboard/crm" },
    { label: "Abrir CRM Momentum", href: "/dashboard/crm/embed" },
  ],
  suppliers: [
    { label: "Buscar proveedor", href: "/dashboard/suppliers" },
    { label: "Nuevo proveedor", href: "/dashboard/suppliers" },
    { label: "Ver cuentas por pagar", href: "/dashboard/suppliers" },
    { label: "Importar proveedores", href: "/dashboard/import", permission: "import" },
    { label: "Exportar proveedores", href: "/dashboard/suppliers", permission: "export" },
  ],
  priceLists: [
    { label: "Buscar producto", href: "/dashboard/listas-precios" },
    { label: "Comparar menudeo y mayoreo", href: "/dashboard/listas-precios" },
    { label: "Filtrar por marca", href: "/dashboard/listas-precios" },
    { label: "Ver vigencias", href: "/dashboard/listas-precios" },
    { label: "Exportar lista", href: "/dashboard/listas-precios", permission: "export" },
  ],
  catalog: [
    { label: "Buscar por SKU o producto", href: "/dashboard/catalogo" },
    { label: "Ver listas de precios", href: "/dashboard/listas-precios" },
    { label: "Importar productos", href: "/dashboard/import", permission: "import" },
    { label: "Exportar catálogo", href: "/dashboard/catalogo", permission: "export" },
  ],
  productsPricing: [
    { label: "Ver productos sin precio", href: "/dashboard/productos-precios" },
    { label: "Ver productos activos", href: "/dashboard/productos-precios" },
    { label: "Ver lista de precios", href: "/dashboard/productos-precios" },
    { label: "Importar precios", href: "/dashboard/import?entity=precios", permission: "import" },
    { label: "Importar productos", href: "/dashboard/import?entity=productos", permission: "import" },
    { label: "Exportar catálogo", href: "/dashboard/productos-precios", permission: "export" },
  ],
  inventoryStock: [
    { label: "Ver stock bajo", href: "/dashboard/inventory" },
    { label: "Ver existencias disponibles", href: "/dashboard/inventory" },
    { label: "Registrar entrada o salida", href: "/dashboard/inventory" },
    { label: "Ver movimientos y trazabilidad", href: "/dashboard/inventory" },
    { label: "Importar inventario inicial", href: "/dashboard/import?entity=inventario-inicial", permission: "import" },
    { label: "Exportar inventario", href: "/dashboard/inventory", permission: "export" },
  ],
  warehouse: [
    { label: "Ver existencias", href: "/dashboard/inventory" },
    { label: "Registrar entrada o salida", href: "/dashboard/inventory" },
    { label: "Transferir entre almacenes", href: "/dashboard/inventory" },
    { label: "Conteo físico", href: "/dashboard/inventory" },
    { label: "Importar existencias", href: "/dashboard/import", permission: "import" },
  ],
  banking: [
    { label: "Ver movimientos", href: "/dashboard/banking" },
    { label: "Ver cuentas", href: "/dashboard/banking" },
    { label: "Conciliar movimientos", href: "/dashboard/banking" },
    { label: "Importar movimientos", href: "/dashboard/import", permission: "import" },
    { label: "Exportar estado de cuenta", href: "/dashboard/banking", permission: "export" },
  ],
  accounting: [
    { label: "Ver catálogo de cuentas", href: "/dashboard/accounting" },
    { label: "Nueva póliza", href: "/dashboard/accounting" },
    { label: "Ver pólizas del mes", href: "/dashboard/accounting" },
    { label: "Importar catálogo de cuentas", href: "/dashboard/import", permission: "import" },
    { label: "Exportar pólizas", href: "/dashboard/accounting", permission: "export" },
  ],
  payroll: [
    { label: "Buscar empleado", href: "/dashboard/payroll" },
    { label: "Nuevo empleado", href: "/dashboard/payroll" },
    { label: "Ver incidencias", href: "/dashboard/payroll" },
    { label: "Importar empleados", href: "/dashboard/import", permission: "import" },
    { label: "Exportar nómina", href: "/dashboard/payroll", permission: "export" },
  ],
  production: [
    { label: "Nueva orden de producción", href: "/dashboard/production" },
    { label: "Ver órdenes en proceso", href: "/dashboard/production" },
    { label: "Registrar producción", href: "/dashboard/production" },
    { label: "Ver disponibilidad de materiales", href: "/dashboard/inventory" },
    { label: "Exportar programa", href: "/dashboard/production", permission: "export" },
  ],
  maintenance: [
    { label: "Programar mantenimiento", href: "/dashboard/maintenance" },
    { label: "Ver equipos", href: "/dashboard/maintenance" },
    { label: "Ver historial por equipo", href: "/dashboard/maintenance" },
    { label: "Exportar mantenimientos", href: "/dashboard/maintenance", permission: "export" },
  ],
  service: [
    { label: "Crear ticket", href: "/dashboard/service" },
    { label: "Ver mis tickets", href: "/dashboard/service" },
    { label: "Buscar guía", href: "/dashboard/service" },
    { label: "Contactar soporte", href: "/dashboard/service" },
  ],
  bi: [
    { label: "Ver reporte de ventas", href: "/dashboard/business-intelligence" },
    { label: "Ver inventario próximo a caducar", href: "/dashboard/inventario-lotes" },
    { label: "Ver cuentas por cobrar", href: "/dashboard/facturacion" },
    { label: "Exportar reportes", href: "/dashboard/reports", permission: "export" },
  ],
  settings: [
    { label: "Cambiar idioma o tema", href: "/dashboard/configuracion" },
    { label: "Datos de la empresa", href: "/dashboard/configuracion" },
    { label: "Preferencias de tablas", href: "/dashboard/configuracion" },
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
    { label: "Ver clientes en CRM", href: "/dashboard/crm" },
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
    .replace(/\bkomo\b/g, "como")
    .replace(/\bexel\b/g, "excel")
    .replace(/\baser\b/g, "hacer")
    .replace(/\bacer\b/g, "hacer")
    .replace(/\s+/g, " ")
    .trim()
}

export function buildAssistantReply(context: AssistantContext): AssistantReply {
  const query = normalizeAssistantText(context.input)
  const screen = resolveScreen(context.pathname)
  const en = context.language === "en"

  if (isHelpIntent(query)) return { text: screenHelp(screen, context), suggestions: allowedActions(screen, context) }
  // Exportar se evalúa antes que importar: "exportar excel/csv" no debe caer en importación.
  if (isExportIntent(query)) return permissionReply(context, "Exportar información", context.pathname, "export")
  if (isImportIntent(query)) return permissionReply(context, "Centro de Importación", "/dashboard/import", "import")

  if (/total|sumar|suma|promedio|cuanto llevo|cuanto suma/.test(query)) {
    return {
      text: en
        ? "Use the Totals button on the table toolbar. It shows sum, average, minimum and maximum for the current view."
        : "Usa el botón Totales en la barra de la tabla. Ahí ves suma, promedio, mínimo y máximo de lo que estás viendo.",
      suggestions: allowedActions(screen, context).slice(0, 3),
    }
  }
  if (/ordenar|orden|ascendente|descendente|mayor a menor|menor a mayor|mas reciente|mas antiguo/.test(query)) {
    return {
      text: en
        ? "Use the column header or the column menu to sort. For numbers you can choose lower to higher or higher to lower, and for dates older to newer or newer to older."
        : "Usa el encabezado o el menú de la columna para ordenar. En números puedes elegir menor a mayor o mayor a menor, y en fechas más antiguo o más reciente.",
      suggestions: allowedActions(screen, context).slice(0, 3),
    }
  }
  if (/filtrar|filtro|por fecha|por estado|este mes|esta semana/.test(query)) {
    return {
      text: en
        ? "Open Filters on the table toolbar. You can combine columns, use date ranges like Today, This week or This month, and clear everything with one click."
        : "Abre Filtros en la barra de la tabla. Puedes combinar columnas, usar Hoy, Esta semana, Este mes o un rango personalizado, y limpiar todo con un clic.",
      suggestions: allowedActions(screen, context).slice(0, 3),
    }
  }
  if (/historial|ultimos cambios|quien cambio|auditoria|trazabilidad/.test(query)) {
    return {
      text: en
        ? "Use the Recent changes button on the table toolbar to see the latest activity in this module."
        : "Usa el botón Últimos cambios para revisar acción, usuario, fecha y registro afectado en este módulo.",
      suggestions: allowedActions(screen, context).slice(0, 3),
    }
  }
  if (/columna|ocultar|mostrar campo/.test(query)) {
    return {
      text: en
        ? "Use the Columns button to show or hide columns. Your selection is saved for you."
        : "Usa el botón Columnas para mostrar u ocultar columnas. Tu selección se guarda automáticamente.",
      suggestions: allowedActions(screen, context).slice(0, 3),
    }
  }
  if (/vista|guardar vista|layout/.test(query)) {
    return {
      text: en
        ? "Use the View button to save your current columns, filters and sorting with a name, and switch between saved views."
        : "Usa el botón Vista para guardar con un nombre tus columnas, filtros y orden actuales, y cambiar entre vistas guardadas.",
      suggestions: allowedActions(screen, context).slice(0, 3),
    }
  }

  if (/sin precio|sin precios|precio pendiente|precios pendientes|falta precio|faltan precios|capturar precio|actualizar precio/.test(query)) {
    return {
      text: en
        ? "In Products and Pricing use the 'Sin precio' quick filter to see pending SKUs, capture prices row by row or import them from Excel."
        : "En Productos y Precios usa el filtro rápido 'Sin precio' para ver los SKUs pendientes, captura el precio por fila o impórtalos desde Excel.",
      suggestions: allowedActions("productsPricing", context),
    }
  }
  if (/stock bajo|bobina|rollo|serie|apartar|apartado|liberar material/.test(query)) {
    return {
      text: en
        ? "In Inventory and Warehouse you can see low stock, available vs reserved quantities, movements, transfers and physical counts."
        : "En Inventario y Almacén puedes ver stock bajo, disponible contra apartado, movimientos, transferencias y conteos físicos.",
      suggestions: allowedActions("inventoryStock", context),
    }
  }
  if (/factura|cobrar|cobranza|pago|pendiente|saldo/.test(query)) {
    return {
      text: en
        ? "These options help you review invoices, balances and pending payments."
        : "Te llevo a la vista donde puedes revisar facturas, saldos, cobranza y pagos pendientes.",
      suggestions: allowedActions("invoicing", context),
    }
  }
  if (/lote|caduc|vencimiento/.test(query)) {
    return {
      text: en
        ? "These options help you review lots, expirations, availability and recent movements."
        : "Estas opciones te ayudan a revisar lotes, vencimientos, disponibilidad y últimos movimientos.",
      suggestions: allowedActions("inventoryLots", context),
    }
  }
  if (/inventario|almacen|existencia|sku/.test(query)) {
    return {
      text: en
        ? "These options help you review inventory, products, expirations and movements."
        : "Estas opciones te ayudan a revisar inventario, productos, existencias, caducidades y movimientos.",
      suggestions: allowedActions("inventory", context),
    }
  }
  if (/cotiza|cotizacion|cotizaciones/.test(query)) {
    return {
      text: en
        ? "These actions help you create and follow up quotes and open opportunities."
        : "Estas acciones te ayudan a crear y dar seguimiento a cotizaciones y oportunidades abiertas.",
      suggestions: allowedActions("sales", context),
    }
  }
  if (/venta|pedido|remision|margen|disponibilidad/.test(query)) {
    return {
      text: en
        ? "These actions help you operate sales, orders, availability and related documents."
        : "Estas acciones te ayudan a operar ventas, pedidos, disponibilidad y documentos relacionados.",
      suggestions: allowedActions("sales", context),
    }
  }
  if (/proveedor|compra|por pagar/.test(query)) {
    return {
      text: en
        ? "These actions help you manage suppliers, purchases and payables."
        : "Estas acciones te ayudan a gestionar proveedores, compras y cuentas por pagar.",
      suggestions: allowedActions("suppliers", context),
    }
  }
  if (/empleado|nomina|vacacion|incidencia|rrhh|recursos humanos/.test(query)) {
    return {
      text: en
        ? "These actions help you manage employees, payroll, vacations and incidents."
        : "Estas acciones te ayudan a gestionar empleados, nómina, vacaciones e incidencias.",
      suggestions: allowedActions("payroll", context),
    }
  }
  if (/banco|movimiento|conciliar|tesoreria|tesorería/.test(query)) {
    return {
      text: en
        ? "These actions help you review bank accounts, movements and reconciliation."
        : "Estas acciones te ayudan a revisar cuentas bancarias, movimientos y conciliación.",
      suggestions: allowedActions("banking", context),
    }
  }
  if (/poliza|contab|cuenta contable|debe|haber/.test(query)) {
    return {
      text: en
        ? "These actions help you work with the chart of accounts and journal entries."
        : "Estas acciones te ayudan a trabajar con el catálogo de cuentas y las pólizas.",
      suggestions: allowedActions("accounting", context),
    }
  }
  if (/produccion|producción|orden de produccion|fabricar/.test(query)) {
    return {
      text: en
        ? "These actions help you plan and register production."
        : "Estas acciones te ayudan a programar y registrar producción.",
      suggestions: allowedActions("production", context),
    }
  }
  if (/mantenimiento|equipo|kilometraje/.test(query)) {
    return {
      text: en
        ? "These actions help you schedule maintenance and review equipment."
        : "Estas acciones te ayudan a programar mantenimientos y revisar equipos.",
      suggestions: allowedActions("maintenance", context),
    }
  }
  if (/ticket|soporte|ayuda tecnica|problema/.test(query)) {
    return {
      text: en
        ? "These actions help you create and follow up support tickets."
        : "Estas acciones te ayudan a crear tickets y dar seguimiento a soporte.",
      suggestions: allowedActions("service", context),
    }
  }
  if (/configurar dashboard|personalizar dashboard|cambiar (el )?dashboard|agregar (un )?indicador|agregar (una )?grafica|quitar indicador|mover (el )?bloque|orden(ar)? (el )?dashboard|tablero/.test(query)) {
    return {
      text: en
        ? "You can choose which indicators to show, reorder them and change their size from \"Configurar dashboard\"."
        : "Puedes elegir qué indicadores mostrar, cambiar su orden y ajustar su tamaño desde \"Configurar dashboard\".",
      suggestions: allowedActions("dashboard", context).filter((a) => a.label === "Configurar dashboard"),
    }
  }
  if (/cliente|contacto|crm|prospecto|oportunidad|actividad comercial|seguimiento comercial/.test(query)) {
    return {
      text: en
        ? "CRM Momentum is where your customers, contacts, prospects and deals live. These actions help you find them and follow up commercially."
        : "CRM Momentum es donde vive tu cartera de clientes, contactos, prospectos y oportunidades. Estas acciones te ayudan a encontrarlos y dar seguimiento comercial.",
      suggestions: allowedActions("crm", context),
    }
  }

  return {
    text: en
      ? "I can help you with sales, invoicing, inventory, banking, production, maintenance or imports. Type what you want to do in your own words."
      : "Puedo ayudarte con ventas, facturación, inventario, bancos, producción, mantenimiento o importaciones. Escribe lo que quieres hacer con tus palabras.",
    suggestions: allowedActions(screen, context).slice(0, 4),
  }
}

function resolveScreen(pathname: string): ScreenKey {
  if (pathname.startsWith("/admin")) return "admin"
  if (pathname.startsWith("/dashboard/productos-precios")) return "productsPricing"
  if (pathname.startsWith("/dashboard/inventario-existencias")) return "inventoryStock"
  if (pathname.startsWith("/dashboard/inventario-lotes")) return "inventoryLots"
  if (pathname.startsWith("/dashboard/ventas") || pathname.startsWith("/dashboard/sales")) return "sales"
  if (pathname.startsWith("/dashboard/facturacion")) return "invoicing"
  if (pathname.startsWith("/dashboard/warehouse")) return "warehouse"
  if (pathname.startsWith("/dashboard/inventory")) return "inventory"
  if (pathname.startsWith("/dashboard/crm")) return "crm"
  if (pathname.startsWith("/dashboard/clients")) return "clients"
  if (pathname.startsWith("/dashboard/suppliers") || pathname.startsWith("/dashboard/eprocurement")) return "suppliers"
  if (pathname.startsWith("/dashboard/listas-precios")) return "priceLists"
  if (pathname.startsWith("/dashboard/catalogo")) return "catalog"
  if (pathname.startsWith("/dashboard/banking")) return "banking"
  if (pathname.startsWith("/dashboard/accounting")) return "accounting"
  if (pathname.startsWith("/dashboard/payroll")) return "payroll"
  if (pathname.startsWith("/dashboard/production")) return "production"
  if (pathname.startsWith("/dashboard/maintenance") || pathname.startsWith("/dashboard/field-services"))
    return "maintenance"
  if (pathname.startsWith("/dashboard/service")) return "service"
  if (
    pathname.startsWith("/dashboard/bi") ||
    pathname.startsWith("/dashboard/business-intelligence") ||
    pathname.startsWith("/dashboard/reports")
  )
    return "bi"
  if (pathname.startsWith("/dashboard/configuracion") || pathname.startsWith("/dashboard/settings")) return "settings"
  if (pathname === "/dashboard") return "dashboard"
  return "default"
}

function screenHelp(screen: ScreenKey, context: AssistantContext): string {
  if (screen === "admin" && !context.isNexoAdmin) {
    return context.language === "en"
      ? "You do not have access to Nexo administration. I can help you with your company's actions inside the ERP."
      : "No tienes permiso para Administración Nexo. Puedo ayudarte con acciones de tu empresa dentro del ERP."
  }
  return context.language === "en" ? SCREEN_HELP_EN[screen] : SCREEN_HELP[screen]
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
  return /que puedo hacer|que puedo hacer aqui|que hay aqui|ayuda|explica|esta pantalla|donde estoy|como funciona|what can i do|help/.test(query)
}

function isImportIntent(query: string): boolean {
  return /import|carga masiva|subir excel|subir archivo|excel|csv|cargo productos|cargar productos|cargar clientes|importar/.test(query)
}

function isExportIntent(query: string): boolean {
  return /export|descargar|reporte/.test(query)
}

function permissionReply(
  context: AssistantContext,
  label: string,
  href: string,
  permission: "import" | "export",
): AssistantReply {
  const en = context.language === "en"
  const allowed = permission === "import" ? context.canImport : context.canExport
  if (!allowed) {
    return {
      text: en
        ? "You do not have permission for this action. Ask a company administrator to review your permissions."
        : "No tienes permiso para esta acción. Pide a un administrador de empresa que revise tus permisos.",
      suggestions: [],
    }
  }
  return {
    text:
      permission === "import"
        ? en
          ? "I'll take you to the Import Center. There you can download a template, upload your file and validate before saving."
          : "Te llevo al Centro de Importación. Ahí puedes descargar plantilla, subir archivo y validar antes de guardar."
        : en
          ? "You can export from the module table respecting active filters and visible columns."
          : "Puedes exportar desde la tabla del módulo respetando filtros y columnas visibles.",
    suggestions: [{ label, href, permission }],
  }
}
