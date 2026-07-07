import type { DashboardIndicatorId } from "./types"

/**
 * Catálogo de indicadores del dashboard. Cada empresa elige cuáles ver y en
 * qué orden (`tenant.ui.dashboardIndicators`). Un indicador sin datos reales
 * se muestra honesto ("por conectar" / "sin capturas"), nunca con cifras
 * inventadas.
 */
export interface DashboardIndicatorDefinition {
  id: DashboardIndicatorId
  name: string
  description: string
  /** Módulo fuente en lenguaje del usuario. */
  source: string
}

export const DASHBOARD_INDICATOR_CATALOG: DashboardIndicatorDefinition[] = [
  { id: "ventasMes", name: "Ventas del mes", description: "Importe vendido en el mes en curso", source: "Ventas" },
  { id: "ventasPorCobrar", name: "Ventas por cobrar", description: "Saldo pendiente de cobro", source: "Facturación" },
  { id: "cotizacionesAbiertas", name: "Cotizaciones abiertas", description: "Cotizaciones sin cerrar", source: "Ventas" },
  { id: "oportunidadesCrm", name: "Oportunidades CRM", description: "Oportunidades activas en el embudo", source: "Clientes / CRM" },
  { id: "margenBruto", name: "Margen bruto", description: "Margen estimado con base en costos capturados", source: "Ventas" },
  { id: "productosSinPrecio", name: "Productos sin precio", description: "SKUs activos sin precio capturado", source: "Productos y Precios" },
  { id: "stockBajo", name: "Stock bajo", description: "SKUs por debajo de su mínimo", source: "Inventario y Almacén" },
  { id: "inventarioDisponible", name: "Inventario disponible", description: "Existencias disponibles totales", source: "Inventario y Almacén" },
  { id: "pedidosPendientes", name: "Pedidos pendientes", description: "Pedidos por entregar", source: "Ventas" },
  { id: "facturasPendientes", name: "Facturas pendientes", description: "Facturas por emitir o timbrar", source: "Facturación" },
  { id: "cobranzaVencida", name: "Cobranza vencida", description: "Saldo vencido por cliente", source: "Facturación" },
  { id: "movimientosBancarios", name: "Movimientos bancarios", description: "Movimientos del periodo", source: "Bancos / Tesorería" },
  { id: "topProductos", name: "Top productos", description: "Productos con más venta", source: "Reportes / BI" },
  { id: "topClientes", name: "Top clientes", description: "Clientes con más compra", source: "Reportes / BI" },
  { id: "actividadComercial", name: "Actividad comercial", description: "Clientes, prospectos y seguimiento", source: "Clientes / CRM" },
  { id: "alertas", name: "Alertas", description: "Avisos que requieren atención", source: "Sistema" },
]

const BY_ID = new Map(DASHBOARD_INDICATOR_CATALOG.map((d) => [d.id, d]))

export function getIndicatorDefinition(id: DashboardIndicatorId): DashboardIndicatorDefinition | undefined {
  return BY_ID.get(id)
}

/** Indicadores por defecto para empresas sin configuración propia. */
export const DEFAULT_DASHBOARD_INDICATORS: DashboardIndicatorId[] = [
  "ventasMes",
  "cotizacionesAbiertas",
  "inventarioDisponible",
  "facturasPendientes",
]
