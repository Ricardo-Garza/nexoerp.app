"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, PackagePlus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LotQualityBadge } from "@/components/delar/lot-quality-badge"
import { changeLotQualityAction, receiveLotAction } from "@/lib/server/actions"
import type { LotQualityStatus } from "@/lib/domain/inventory/types"
import { dec } from "@/lib/domain/shared/decimal"

export interface LotRowView {
  lotId: string
  lotCode: string
  skuCode: string
  skuName: string
  warehouseName: string
  locationName: string
  expiryDate: string | null
  expiresInDays: number | null
  qualityStatus: LotQualityStatus
  available: string
  usable: boolean
}

export interface SkuOption {
  sku: string
  name: string
  expiryRequired: boolean
}

export interface LocationOption {
  id: string
  label: string
}

export function InventoryLots({
  rows,
  skuOptions,
  locationOptions,
  canReceive,
  canQuality,
  mutationsEnabled,
}: {
  rows: LotRowView[]
  skuOptions: SkuOption[]
  locationOptions: LocationOption[]
  canReceive: boolean
  canQuality: boolean
  mutationsEnabled: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null)

  const [skuCode, setSkuCode] = useState("")
  const [lotCode, setLotCode] = useState("")
  const [quantity, setQuantity] = useState("")
  const [expiry, setExpiry] = useState("")
  const [locationId, setLocationId] = useState(locationOptions[0]?.id ?? "")

  const submitReceive = () => {
    setMessage(null)
    startTransition(async () => {
      const result = await receiveLotAction({
        skuCode,
        lotCode,
        quantity,
        expiryDate: expiry || null,
        locationId,
        idempotencyKey: `recv-${lotCode.toLowerCase()}-${skuCode.toLowerCase()}`,
      })
      if (result.ok) {
        setMessage({
          kind: "ok",
          text: result.value?.duplicated
            ? `Operación ya registrada antes (idempotencia): lote ${result.value.lotCode} sin duplicar.`
            : `Lote ${result.value?.lotCode} recibido en cuarentena.`,
        })
        setLotCode("")
        setQuantity("")
        setExpiry("")
        router.refresh()
      } else {
        setMessage({ kind: "error", text: result.error?.message ?? "Error desconocido" })
      }
    })
  }

  const changeQuality = (lotId: string, to: "released" | "rejected", lotCode: string) => {
    setMessage(null)
    const reason = window.prompt(
      to === "released"
        ? `Motivo de liberación del lote ${lotCode} (queda auditado):`
        : `Motivo de rechazo del lote ${lotCode} (queda auditado):`,
    )
    if (!reason) return
    startTransition(async () => {
      const result = await changeLotQualityAction({ lotId, to, reason })
      if (result.ok) {
        setMessage({ kind: "ok", text: `Lote ${lotCode} → ${to === "released" ? "liberado" : "rechazado"}.` })
        router.refresh()
      } else {
        setMessage({ kind: "error", text: result.error?.message ?? "Error desconocido" })
      }
    })
  }

  return (
    <div className="space-y-6">
      {!mutationsEnabled && (
        <p className="text-sm rounded-lg border p-3 text-muted-foreground" data-testid="mutations-disabled-note">
          Las mutaciones (recepción/calidad) están disponibles en modo demo local mientras se completa la persistencia
          durable y la verificación de sesión del servidor (deuda D3/D4 en docs/IMPLEMENTATION_STATUS.md).
        </p>
      )}

      {message && (
        <p
          role="status"
          data-testid={`action-${message.kind}`}
          className={`text-sm rounded-lg border p-3 ${
            message.kind === "ok"
              ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"
              : "border-red-300 bg-red-50 text-red-900 dark:bg-red-950/30 dark:text-red-200"
          }`}
        >
          {message.text}
        </p>
      )}

      {mutationsEnabled && canReceive && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PackagePlus className="w-4 h-4" aria-hidden /> Recibir lote (entra en cuarentena)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
              onSubmit={(e) => {
                e.preventDefault()
                submitReceive()
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="recv-sku">SKU</Label>
                <Select value={skuCode} onValueChange={setSkuCode}>
                  <SelectTrigger id="recv-sku" aria-label="SKU a recibir">
                    <SelectValue placeholder="Selecciona SKU" />
                  </SelectTrigger>
                  <SelectContent>
                    {skuOptions.map((s) => (
                      <SelectItem key={s.sku} value={s.sku}>
                        {s.sku} — {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="recv-lot">Código de lote</Label>
                <Input
                  id="recv-lot"
                  value={lotCode}
                  onChange={(e) => setLotCode(e.target.value)}
                  placeholder="LOT-2026-001"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="recv-qty">Cantidad (pzas)</Label>
                <Input
                  id="recv-qty"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  inputMode="decimal"
                  placeholder="10"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="recv-exp">Caducidad</Label>
                <Input id="recv-exp" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="recv-loc">Ubicación</Label>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger id="recv-loc" aria-label="Ubicación de recepción">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locationOptions.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2 lg:col-span-5">
                <Button type="submit" disabled={isPending || !skuCode || !lotCode || !quantity}>
                  {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />}
                  Registrar recepción
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lote</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Almacén / Ubicación</TableHead>
                <TableHead>Caducidad</TableHead>
                <TableHead>Calidad</TableHead>
                <TableHead className="text-right">Disponible</TableHead>
                <TableHead>Asignable</TableHead>
                {mutationsEnabled && canQuality && <TableHead>Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    Sin existencias por lote registradas.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={`${r.lotId}-${r.locationName}`} data-testid={`lot-row-${r.lotCode}`}>
                  <TableCell className="font-mono text-sm">{r.lotCode}</TableCell>
                  <TableCell>
                    <span className="block font-mono text-sm">{r.skuCode}</span>
                    <span className="block text-xs text-muted-foreground max-w-52 truncate" title={r.skuName}>
                      {r.skuName}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.warehouseName}
                    <span className="block text-xs text-muted-foreground">{r.locationName}</span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.expiryDate ?? "N/A"}
                    {r.expiresInDays !== null && (
                      <span
                        className={`block text-xs ${
                          r.expiresInDays < 0
                            ? "text-red-600 dark:text-red-400 font-medium"
                            : r.expiresInDays <= 60
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground"
                        }`}
                      >
                        {r.expiresInDays < 0 ? `Vencido hace ${-r.expiresInDays} días` : `Vence en ${r.expiresInDays} días`}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <LotQualityBadge status={r.qualityStatus} />
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{dec.toNumber(r.available)}</TableCell>
                  <TableCell>
                    {r.usable ? (
                      <Badge variant="outline" className="text-emerald-700 border-emerald-300 dark:text-emerald-300">
                        Sí (FEFO)
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-700 border-red-300 dark:text-red-300">
                        No asignable
                      </Badge>
                    )}
                  </TableCell>
                  {mutationsEnabled && canQuality && (
                    <TableCell>
                      {(r.qualityStatus === "quarantine" || r.qualityStatus === "pending") && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => changeQuality(r.lotId, "released", r.lotCode)}
                          >
                            Liberar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            disabled={isPending}
                            onClick={() => changeQuality(r.lotId, "rejected", r.lotCode)}
                          >
                            Rechazar
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
