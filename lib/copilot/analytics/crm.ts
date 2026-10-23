import type { DemoOpportunity, DemoQuote, OpportunityStage } from "../types"
import type { DataView } from "./view"

export const OPEN_STAGES: OpportunityStage[] = ["Prospecto", "Calificada", "Cotizada", "Negociación"]

const r2 = (n: number) => Math.round(n * 100) / 100

export function openOpportunities(view: DataView): DemoOpportunity[] {
  return view.data.opportunities.filter((o) => OPEN_STAGES.includes(o.stage))
}

export interface PipelineStage {
  stage: OpportunityStage
  count: number
  amountMxn: number
  weightedMxn: number
}

export function pipelineByStage(opps: DemoOpportunity[]): PipelineStage[] {
  return OPEN_STAGES.map((stage) => {
    const sel = opps.filter((o) => o.stage === stage)
    return {
      stage,
      count: sel.length,
      amountMxn: r2(sel.reduce((s, o) => s + o.amountMxn, 0)),
      weightedMxn: r2(sel.reduce((s, o) => s + (o.amountMxn * o.probability) / 100, 0)),
    }
  })
}

export interface QuoteConversion {
  won: number
  lost: number
  expired: number
  open: number
  closed: number
  ratePct: number | null
  wonAmountMxn: number
}

export function quoteConversion(view: DataView, quotes: DemoQuote[] = view.data.quotes): QuoteConversion {
  const count = (s: DemoQuote["status"]) => quotes.filter((q) => q.status === s)
  const won = count("Ganada")
  const closed = won.length + count("Perdida").length + count("Vencida").length
  return {
    won: won.length,
    lost: count("Perdida").length,
    expired: count("Vencida").length,
    open: count("Vigente").length,
    closed,
    ratePct: closed ? Math.round((won.length / closed) * 10000) / 100 : null,
    wonAmountMxn: r2(won.reduce((s, q) => s + q.total * q.fx, 0)),
  }
}

export function opportunityWinRate(view: DataView): { won: number; lost: number; ratePct: number | null } {
  const won = view.data.opportunities.filter((o) => o.stage === "Ganada").length
  const lost = view.data.opportunities.filter((o) => o.stage === "Perdida").length
  return { won, lost, ratePct: won + lost ? Math.round((won / (won + lost)) * 10000) / 100 : null }
}
