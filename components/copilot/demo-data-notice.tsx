import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

export function DemoDataNotice({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <p
      role="note"
      className={cn(
        "flex items-start gap-1.5 text-muted-foreground",
        compact ? "text-[11px]" : "text-xs",
        className,
      )}
      data-testid="demo-data-notice"
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>
        Entorno de demostración: resultados calculados con datos simulados; no representan información real de Soleil Wire.
      </span>
    </p>
  )
}
