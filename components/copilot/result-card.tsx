"use client"

import { useEffect, useRef, useState } from "react"
import { AlertTriangle, Download, Info, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDateEs } from "@/lib/copilot/dates"
import { resultToCsv } from "@/lib/copilot/csv"
import { fmtInt, fmtMxn, fmtNum, fmtPct } from "@/lib/copilot/format"
import type { CopilotResult, Kpi, TableColumn, TableSpec } from "@/lib/copilot/result"
import { CopilotChart } from "./copilot-chart"

export function formatCell(value: string | number | null, format: TableColumn["format"]): string {
  if (value === null || value === undefined || value === "") return "–"
  if (typeof value === "number") {
    if (format === "currency") return fmtMxn(value)
    if (format === "percent") return fmtPct(value)
    return Number.isInteger(value) ? fmtInt(value) : fmtNum(value)
  }
  if (format === "date" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return formatDateEs(value)
  return value
}

const TONE: Record<NonNullable<Kpi["tone"]>, string> = {
  neutral: "",
  good: "text-emerald-600 dark:text-emerald-400",
  bad: "text-red-600 dark:text-red-400",
  warn: "text-amber-600 dark:text-amber-400",
}

export function KpiGrid({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2" data-testid="copilot-kpis">
      {kpis.map((k) => (
        <div key={k.label} className="min-w-0 rounded-xl border bg-background/60 p-2.5">
          <p className="truncate text-[11px] text-muted-foreground">{k.label}</p>
          <p className={cn("mt-0.5 break-words text-sm font-semibold leading-snug tabular-nums", TONE[k.tone ?? "neutral"])} data-testid="copilot-kpi-value">
            {k.value}
          </p>
          {k.detail && <p className="mt-0.5 break-words text-[11px] text-muted-foreground">{k.detail}</p>}
        </div>
      ))}
    </div>
  )
}

export function ResultTable({ table, testId = "copilot-table" }: { table: TableSpec; testId?: string }) {
  const [all, setAll] = useState(false)
  const rows = all ? table.rows : table.rows.slice(0, 8)
  return (
    <div className="mt-3" data-testid={testId}>
      <div className="max-h-80 overflow-auto rounded-xl border">
        <table className="w-full min-w-max border-collapse text-xs">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur">
            <tr>
              {table.columns.map((c) => (
                <th key={c.key} scope="col" className={cn("whitespace-nowrap px-2.5 py-1.5 font-medium text-muted-foreground", c.align === "right" ? "text-right" : "text-left")}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                {table.columns.map((c) => (
                  <td key={c.key} className={cn("px-2.5 py-1.5 tabular-nums", c.align === "right" ? "text-right" : "max-w-[260px] text-left")}>
                    {formatCell(r[c.key] ?? null, c.format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {table.totalRows > table.rows.length ? `Mostrando ${table.rows.length} de ${fmtInt(table.totalRows)} registros` : `${fmtInt(table.totalRows)} registros`}
        </span>
        {table.rows.length > 8 && (
          <button type="button" className="font-medium text-primary underline-offset-2 hover:underline focus-visible:underline" onClick={() => setAll((v) => !v)}>
            {all ? "Ver menos" : `Ver las ${table.rows.length}`}
          </button>
        )}
      </div>
    </div>
  )
}

function downloadCsv(result: CopilotResult) {
  const today = new Date().toISOString().slice(0, 10)
  const csv = resultToCsv(result, today)
  if (!csv) return
  const blob = new Blob(["﻿" + csv.content], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = csv.filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function ResultCard({ result, onAsk, disabled, autoExport }: { result: CopilotResult; onAsk: (q: string) => void; disabled?: boolean; autoExport?: boolean }) {
  const hasData = !!(result.table?.rows.length || result.chart?.data.length)
  const refused = result.status === "refused"
  const Icon = refused ? ShieldAlert : result.status === "no_data" || result.status === "clarify" || result.status === "error" ? Info : null
  // La exportación solicitada por el usuario se dispara una sola vez, al montar el mensaje
  useAutoExport(result, !!autoExport && !!result.exportRequested && hasData)

  return (
    <div className="min-w-0" data-testid="copilot-result" data-status={result.status} data-intent={result.intent}>
      <div className="flex items-start gap-1.5">
        {Icon && <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", refused ? "text-red-500" : "text-muted-foreground")} aria-hidden="true" />}
        <p className="text-sm font-semibold leading-snug">{result.title}</p>
      </div>
      {result.interpretation && (
        <p className="mt-0.5 text-[10.5px] leading-snug text-muted-foreground" data-testid="copilot-interpretation">
          {result.interpretation}
        </p>
      )}
      {result.summary && (
        <p className="mt-1.5 whitespace-pre-line break-words text-sm leading-relaxed" data-testid="copilot-summary">
          {result.summary}
        </p>
      )}
      {result.kpis.length > 0 && <KpiGrid kpis={result.kpis} />}
      {result.chart && <CopilotChart spec={result.chart} />}
      {result.table && result.table.rows.length > 0 && <ResultTable table={result.table} />}

      {result.assumptions.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-[11px] text-muted-foreground" data-testid="copilot-assumptions">
          {result.assumptions.map((a) => (
            <li key={a}>• {a}</li>
          ))}
        </ul>
      )}
      {result.caveats.length > 0 && (
        <ul className="mt-2 space-y-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-800 dark:text-amber-300" data-testid="copilot-caveats">
          {result.caveats.map((c) => (
            <li key={c} className="flex gap-1.5">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      )}

      {result.evidence && (
        <details className="group mt-2 rounded-lg border bg-background/50 text-xs" data-testid="copilot-evidence">
          <summary className="cursor-pointer select-none px-2.5 py-1.5 font-medium text-muted-foreground marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            ¿De dónde sale esta cifra? <span className="text-[10px] font-normal">({fmtInt(result.evidence.totalRecords)} registros de respaldo)</span>
          </summary>
          <div className="space-y-2 border-t px-2.5 py-2">
            <p className="leading-relaxed">{result.evidence.calc}</p>
            <p className="text-muted-foreground">Fuente: {result.evidence.source}</p>
            {result.evidence.records.length > 0 && (
              <div className="max-h-48 overflow-auto rounded-md border">
                <table className="w-full min-w-max text-[11px]">
                  <thead className="sticky top-0 bg-muted/80">
                    <tr>
                      <th className="px-2 py-1 text-left font-medium">Documento</th>
                      <th className="px-2 py-1 text-left font-medium">Fecha</th>
                      <th className="px-2 py-1 text-left font-medium">Cliente / elemento</th>
                      <th className="px-2 py-1 text-right font-medium">Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.evidence.records.map((r) => (
                      <tr key={`${r.kind}-${r.id}`} className="border-t">
                        <td className="whitespace-nowrap px-2 py-1">{r.id}</td>
                        <td className="whitespace-nowrap px-2 py-1">{r.date ? formatDateEs(r.date) : "–"}</td>
                        <td className="max-w-[200px] truncate px-2 py-1" title={r.who}>
                          {r.who}
                        </td>
                        <td className="whitespace-nowrap px-2 py-1 text-right tabular-nums">{r.amountMxn === null ? "–" : fmtMxn(r.amountMxn)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </details>
      )}

      {result.options && result.options.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5" data-testid="copilot-options">
          {result.options.map((o) => (
            <button key={o.query} type="button" disabled={disabled} onClick={() => onAsk(o.query)} className="rounded-lg border bg-background px-3 py-2 text-left text-xs transition-colors hover:border-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
              {o.label}
            </button>
          ))}
        </div>
      )}

      {(hasData || result.followUps.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5" data-testid="copilot-followups">
          {hasData && (
            <button type="button" onClick={() => downloadCsv(result)} className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-[11px] font-medium transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-testid="copilot-export">
              <Download className="h-3 w-3" aria-hidden="true" /> Exportar CSV
            </button>
          )}
          {result.followUps.map((f) => (
            <button key={f} type="button" disabled={disabled} onClick={() => onAsk(f)} className="rounded-full border bg-background px-2.5 py-1 text-[11px] transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function useAutoExport(result: CopilotResult, enabled: boolean) {
  const done = useRef(false)
  useEffect(() => {
    if (enabled && !done.current) {
      done.current = true
      downloadCsv(result)
    }
  }, [enabled, result])
}
