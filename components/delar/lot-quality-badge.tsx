import { Badge } from "@/components/ui/badge"
import type { LotQualityStatus } from "@/lib/domain/inventory/types"

/** Color + texto siempre (el color nunca es el único indicador). */
const CONFIG: Record<LotQualityStatus, { label: string; className: string }> = {
  released: { label: "Liberado", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300" },
  pending: { label: "Pendiente de inspección", className: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300 border-slate-300" },
  quarantine: { label: "Cuarentena", className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300" },
  rejected: { label: "Rechazado", className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300" },
  blocked: { label: "Bloqueado", className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300" },
}

export function LotQualityBadge({ status }: { status: LotQualityStatus }) {
  const cfg = CONFIG[status]
  return (
    <Badge variant="outline" className={cfg.className} data-testid={`lot-status-${status}`}>
      {cfg.label}
    </Badge>
  )
}
