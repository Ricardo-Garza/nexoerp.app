"use client"

import { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { History, User, Clock, ArrowRight } from "lucide-react"
import { usePlatform } from "@/contexts/platform-context"
import { listAudit } from "@/lib/platform/tenant-store"
import type { AuditRecord } from "@/lib/platform/types"

/**
 * Historial / Actividad / Auditoría por registro (estilo SAP §10). Se abre desde
 * un botón en el detalle de cualquier registro importante y muestra quién creó,
 * quién modificó, qué cambió (antes/después), cuándo y desde dónde.
 */
export function RecordAuditSheet({
  entityId,
  entityType,
  trigger,
}: {
  entityId: string
  entityType?: string
  trigger?: React.ReactNode
}) {
  const { activeTenantId } = usePlatform()
  const [events, setEvents] = useState<AuditRecord[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    listAudit(activeTenantId, 200).then((all) =>
      setEvents(all.filter((e) => e.entityId === entityId || (entityType && e.entityType === entityType))),
    )
  }, [open, activeTenantId, entityId, entityType])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" data-testid="open-audit">
            <History className="w-4 h-4 mr-1" /> Historial
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" /> Historial y auditoría
          </SheetTitle>
          <SheetDescription>
            Trazabilidad de {entityType ?? "este registro"}. Cada cambio queda registrado de forma inmutable.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 px-4 pb-4 space-y-3">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Sin eventos registrados para este registro todavía.
            </p>
          ) : (
            events.map((e) => (
              <div key={e.id} className="relative pl-6 pb-3 border-l-2 border-border last:border-transparent">
                <span className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-primary" />
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">
                    {e.action}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(e.at).toLocaleString("es-MX")}
                  </span>
                </div>
                <p className="text-sm mt-1">{e.summary}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <User className="w-3 h-3" /> {e.actorEmail} · {e.source}
                </p>
                {e.before && e.after && (
                  <div className="mt-1.5 text-xs rounded-md bg-muted/50 p-2 space-y-1">
                    {Object.keys(e.after).map((k) => (
                      <div key={k} className="flex items-center gap-1.5">
                        <span className="font-medium">{k}:</span>
                        <span className="text-muted-foreground line-through">{String(e.before?.[k] ?? "—")}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span>{String(e.after?.[k] ?? "—")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
