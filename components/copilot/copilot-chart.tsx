"use client"

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { fmtInt, fmtMxn, fmtMxnCompact, fmtPct } from "@/lib/copilot/format"
import type { ChartSpec, ValueFormat } from "@/lib/copilot/result"

/** Paleta categórica fija y legible en claro/oscuro (≥ 3:1 contra ambos fondos). */
const PALETTE = ["#6366f1", "#0ea5e9", "#f59e0b", "#ec4899", "#22c55e", "#8b5cf6", "#ef4444", "#14b8a6", "#eab308", "#3b82f6", "#a855f7", "#f97316", "#94a3b8"]

function formatValue(v: unknown, format: ValueFormat, compact = false): string {
  if (typeof v !== "number") return v === null || v === undefined ? "–" : String(v)
  if (format === "currency") return compact ? fmtMxnCompact(v) : fmtMxn(v)
  if (format === "percent") return fmtPct(v)
  return fmtInt(v)
}

const truncate = (s: unknown, n: number) => {
  const t = String(s ?? "")
  return t.length > n ? `${t.slice(0, n - 1)}…` : t
}

/** Resumen textual de la gráfica para lectores de pantalla (mismos números que se dibujan). */
function describe(spec: ChartSpec): string {
  const first = spec.data.slice(0, 8).map((d) => `${d[spec.xKey]}: ${spec.series.map((s) => formatValue(d[s.key], spec.format)).join(" / ")}`)
  return `${spec.title}. ${spec.data.length} puntos. ${first.join("; ")}${spec.data.length > 8 ? "…" : ""}`
}

export function CopilotChart({ spec }: { spec: ChartSpec }) {
  const horizontal = (spec.kind === "bar" || spec.kind === "comparison") && spec.data.length > 6
  const height = spec.kind === "donut" ? 240 : horizontal ? Math.min(420, 60 + spec.data.length * 30) : 230
  const tick = { fontSize: 11 }
  const tooltipFmt = (v: unknown) => formatValue(v, spec.format)

  return (
    <figure className="mt-3 rounded-xl border bg-background/60 p-2" data-testid="copilot-chart" data-chart-kind={spec.kind} aria-label={spec.title}>
      <figcaption className="px-1 pb-1 text-xs font-medium text-muted-foreground">{spec.title}</figcaption>
      <div role="img" aria-label={describe(spec)} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {spec.kind === "donut" ? (
            <PieChart>
              <Pie data={spec.data} dataKey={spec.series[0].key} nameKey={spec.xKey} innerRadius={52} outerRadius={88} paddingAngle={1.5} isAnimationActive={false}>
                {spec.data.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip formatter={tooltipFmt} />
              <Legend verticalAlign="bottom" height={48} formatter={(v) => truncate(v, 22)} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          ) : spec.kind === "line" ? (
            <LineChart data={spec.data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
              <XAxis dataKey={spec.xKey} tick={tick} interval="preserveStartEnd" minTickGap={18} />
              <YAxis tick={tick} width={56} tickFormatter={(v) => formatValue(v, spec.format, true)} />
              <Tooltip formatter={tooltipFmt} />
              {spec.series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
              {spec.series.map((s, i) => {
                const isBand = s.key === "minimo" || s.key === "maximo"
                return <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={PALETTE[isBand ? 2 : i % PALETTE.length]} strokeWidth={isBand ? 1 : 2.2} strokeDasharray={s.key === "pronostico" || isBand ? "5 4" : undefined} dot={spec.data.length <= 18 && !isBand} connectNulls={false} isAnimationActive={false} />
              })}
            </LineChart>
          ) : spec.kind === "area" ? (
            <AreaChart data={spec.data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
              <XAxis dataKey={spec.xKey} tick={tick} interval="preserveStartEnd" minTickGap={24} />
              <YAxis tick={tick} width={56} tickFormatter={(v) => formatValue(v, spec.format, true)} />
              <Tooltip formatter={tooltipFmt} />
              {spec.series.map((s, i) => (
                <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={PALETTE[i]} fill={PALETTE[i]} fillOpacity={0.18} isAnimationActive={false} />
              ))}
            </AreaChart>
          ) : horizontal ? (
            <BarChart data={spec.data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.4} />
              <XAxis type="number" tick={tick} tickFormatter={(v) => formatValue(v, spec.format, true)} />
              <YAxis type="category" dataKey={spec.xKey} tick={tick} width={132} tickFormatter={(v) => truncate(v, 20)} interval={0} />
              <Tooltip formatter={tooltipFmt} />
              {spec.series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
              {spec.series.map((s, i) => (
                <Bar key={s.key} dataKey={s.key} name={s.label} fill={PALETTE[i]} radius={[0, 4, 4, 0]} isAnimationActive={false} />
              ))}
            </BarChart>
          ) : (
            <BarChart data={spec.data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
              <XAxis dataKey={spec.xKey} tick={tick} interval={0} tickFormatter={(v) => truncate(v, 14)} />
              <YAxis tick={tick} width={56} tickFormatter={(v) => formatValue(v, spec.format, true)} />
              <Tooltip formatter={tooltipFmt} />
              {spec.series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
              {spec.series.map((s, i) => (
                <Bar key={s.key} dataKey={s.key} name={s.label} fill={PALETTE[i]} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </figure>
  )
}
