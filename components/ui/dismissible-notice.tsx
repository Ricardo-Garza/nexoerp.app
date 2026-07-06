"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Aviso discreto y descartable para advertencias NO críticas (§9 del rescate):
 * los avisos de configuración/históricos no deben bloquear la operación diaria.
 * Se recuerda el cierre por usuario (localStorage) para no repetir el mismo aviso.
 */
export function DismissibleNotice({
  id,
  children,
  tone = "muted",
  testId,
}: {
  id: string
  children: ReactNode
  tone?: "muted" | "amber"
  testId?: string
}) {
  const [dismissed, setDismissed] = useState(false)
  const key = `nexo_notice_${id}`

  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage.getItem(key) === "1") setDismissed(true)
  }, [key])

  if (dismissed) return null

  return (
    <div
      data-testid={testId}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3 py-2 text-sm",
        tone === "amber"
          ? "border-amber-300/60 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800/60"
          : "border-border bg-muted/40",
      )}
    >
      <Info className={cn("w-4 h-4 shrink-0 mt-0.5", tone === "amber" ? "text-amber-600" : "text-muted-foreground")} />
      <div className="flex-1 min-w-0 text-muted-foreground">{children}</div>
      <button
        onClick={() => {
          setDismissed(true)
          if (typeof window !== "undefined") window.localStorage.setItem(key, "1")
        }}
        aria-label="Cerrar aviso"
        className="text-muted-foreground/60 hover:text-foreground shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
