import type { ModuleDefinition, ModuleId } from "./types"

/**
 * Catálogo maestro de módulos del ERP. El Control Plane activa/desactiva
 * estos módulos por tenant; el menú lateral del tenant respeta la selección.
 * `maturity` evita vender humo: un módulo "planned" se muestra deshabilitado.
 */
export const MODULE_CATALOG: ModuleDefinition[] = [
  { id: "dashboard", name: "Dashboard", description: "Panel de indicadores del tenant", href: "/dashboard", group: "principal", maturity: "stable" },
  { id: "clients", name: "Clientes / CRM", description: "Cartera de clientes, contactos y saldos", href: "/dashboard/clients", group: "principal", maturity: "stable" },
  { id: "sales", name: "Ventas", description: "Órdenes de venta, cotizaciones y remisiones", href: "/dashboard/ventas/ordenes", group: "principal", maturity: "beta" },
  { id: "invoicing", name: "Facturación", description: "Facturas, complementos y notas de crédito", href: "/dashboard/facturacion", group: "principal", maturity: "beta" },
  { id: "suppliers", name: "Proveedores", description: "Padrón de proveedores y compras", href: "/dashboard/suppliers", group: "principal", maturity: "stable" },
  { id: "inventory", name: "Inventario", description: "Existencias y movimientos", href: "/dashboard/inventory", group: "principal", maturity: "beta" },
  { id: "catalog", name: "Catálogo", description: "Presentaciones normalizadas por marca/familia", href: "/dashboard/catalogo", group: "principal", maturity: "stable" },
  { id: "priceLists", name: "Listas de Precios", description: "Menudeo, mayoreo y reglas comerciales", href: "/dashboard/listas-precios", group: "principal", maturity: "stable" },
  { id: "lots", name: "Inventario por Lote", description: "Trazabilidad FEFO, calidad y caducidades", href: "/dashboard/inventario-lotes", group: "principal", maturity: "stable" },
  { id: "warehouse", name: "Almacén", description: "Ubicaciones, transferencias y conteos", href: "/dashboard/warehouse", group: "principal", maturity: "beta" },
  { id: "pos", name: "Punto de Venta", description: "Ventas de mostrador", href: "/dashboard/punto-venta", group: "principal", maturity: "planned" },
  { id: "banking", name: "Bancos / Tesorería", description: "Cuentas, conciliación y flujo", href: "/dashboard/banking", group: "principal", maturity: "beta" },
  { id: "production", name: "Producción", description: "Órdenes de producción y fórmulas", href: "/dashboard/production", group: "operaciones", maturity: "beta" },
  { id: "maintenance", name: "Mantenimiento", description: "Equipos, preventivo y correctivo", href: "/dashboard/maintenance", group: "operaciones", maturity: "beta" },
  { id: "service", name: "Servicio / Soporte", description: "Tickets a Nexo y seguimiento", href: "/dashboard/service", group: "operaciones", maturity: "stable" },
  { id: "accounting", name: "Contabilidad", description: "Catálogo de cuentas y pólizas", href: "/dashboard/accounting", group: "administracion", maturity: "beta" },
  { id: "payroll", name: "Nómina / RRHH", description: "Empleados, vacaciones e incidencias", href: "/dashboard/payroll", group: "administracion", maturity: "beta" },
  { id: "bi", name: "Business Intelligence", description: "Reportes y analítica", href: "/dashboard/business-intelligence", group: "analitica", maturity: "beta" },
  { id: "crm", name: "CRM Momentum", description: "Integración con CRM Momentum por tenant", href: "/dashboard/crm", group: "expansion", maturity: "beta" },
  { id: "imports", name: "Centro de Importación", description: "Cargas masivas Excel/CSV con validación", href: "/dashboard/import", group: "administracion", maturity: "stable" },
]

const BY_ID = new Map<ModuleId, ModuleDefinition>(MODULE_CATALOG.map((m) => [m.id, m]))

export function getModule(id: ModuleId): ModuleDefinition | undefined {
  return BY_ID.get(id)
}

/** Módulos activos por defecto para un tenant nuevo (los estables + beta core). */
export const DEFAULT_TENANT_MODULES: ModuleId[] = [
  "dashboard",
  "clients",
  "sales",
  "invoicing",
  "suppliers",
  "inventory",
  "catalog",
  "priceLists",
  "lots",
  "warehouse",
  "banking",
  "service",
  "crm",
  "imports",
]

/** Conjunto completo (para el tenant DELAR fundacional / demos ricas). */
export const ALL_MODULE_IDS: ModuleId[] = MODULE_CATALOG.map((m) => m.id)
