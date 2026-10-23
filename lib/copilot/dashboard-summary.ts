import { addDays, addMonths, startOfMonth } from "./dates"
import { openOpportunities, pipelineByStage } from "./analytics/crm"
import { openInvoices, summarizeReceivables } from "./analytics/finance"
import { computeStock } from "./analytics/inventory"
import { aggregateSales, pctChange, rank, salesSeries, selectRows, totalForFilter } from "./analytics/sales"
import type { DataView } from "./analytics/view"

export interface DashboardRankItem {
  label: string
  value: number
  secondary?: number | null
}

export interface SoleilDashboardSummary {
  asOf: string
  salesMonth: number
  salesYtd: number
  salesChangePct: number | null
  activeCustomers: number
  soldProducts: number
  grossMarginMxn: number
  grossMarginPct: number | null
  inventoryUnits: number
  inventoryValueMxn: number
  criticalStock: number
  receivablesMxn: number
  overdueMxn: number
  overdueInvoices: number
  openOpportunities: number
  weightedPipelineMxn: number
  monthlySales: DashboardRankItem[]
  topCustomers: DashboardRankItem[]
  topProducts: DashboardRankItem[]
}

/**
 * Resumen para el tablero de Soleil Wire. No contiene cifras pregrabadas: usa
 * las mismas vistas, filtros y agregaciones que atienden las consultas del copiloto.
 */
export function buildSoleilDashboardSummary(view: DataView): SoleilDashboardSummary {
  const asOf = view.asOf
  const currentMonthStart = startOfMonth(asOf)
  const previousMonthStart = startOfMonth(addMonths(asOf, -1))
  const previousComparableEnd = `${previousMonthStart.slice(0, 8)}${asOf.slice(8)}`
  const current = totalForFilter(view, { from: currentMonthStart, to: asOf })
  const previous = totalForFilter(view, { from: previousMonthStart, to: previousComparableEnd })
  const ytdFilter = { from: `${asOf.slice(0, 4)}-01-01`, to: asOf }
  const ytd = totalForFilter(view, ytdFilter)
  const activeCustomers = new Set(
    selectRows(view, { from: addDays(asOf, -90), to: asOf })
      .filter((row) => row.kind === "venta")
      .map((row) => row.customerId),
  ).size
  const soldProducts = new Set(
    selectRows(view, ytdFilter)
      .filter((row) => row.kind === "venta")
      .map((row) => row.sku),
  ).size
  const stock = computeStock(view)
  const receivables = summarizeReceivables(openInvoices(view))
  const opportunities = openOpportunities(view)
  const pipeline = pipelineByStage(opportunities)

  return {
    asOf,
    salesMonth: current.netMxn,
    salesYtd: ytd.netMxn,
    salesChangePct: pctChange(current.netMxn, previous.netMxn),
    activeCustomers,
    soldProducts,
    grossMarginMxn: ytd.marginMxn,
    grossMarginPct: ytd.marginPct,
    inventoryUnits: Math.round(stock.reduce((sum, row) => sum + row.totalQty, 0)),
    inventoryValueMxn: Math.round(stock.reduce((sum, row) => sum + row.valueMxn, 0) * 100) / 100,
    criticalStock: stock.filter((row) => row.belowMin).length,
    receivablesMxn: receivables.totalMxn,
    overdueMxn: receivables.overdueMxn,
    overdueInvoices: receivables.overdueCount,
    openOpportunities: opportunities.length,
    weightedPipelineMxn: pipeline.reduce((sum, row) => sum + row.weightedMxn, 0),
    monthlySales: salesSeries(view, { from: startOfMonth(addMonths(asOf, -5)), to: asOf }, "month").map((row) => ({
      label: row.label,
      value: row.netMxn,
    })),
    topCustomers: rank(aggregateSales(view, selectRows(view, ytdFilter), "customer"), "netMxn", "desc", 10).map((row) => ({
      label: row.label,
      value: row.netMxn,
      secondary: row.marginPct,
    })),
    topProducts: rank(aggregateSales(view, selectRows(view, ytdFilter), "product"), "netMxn", "desc", 10).map((row) => ({
      label: row.label,
      value: row.netMxn,
      secondary: row.marginMxn,
    })),
  }
}
