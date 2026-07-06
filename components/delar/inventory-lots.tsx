"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, PackagePlus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTablePro, type ProColumn, type RecentChange } from "@/components/ui/data-table-pro"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

const qualityOptions = [
  { label: "Cuarentena", value: "quarantine" },
  { label: "Pendiente", value: "pending" },
  { label: "Liberado", value: "released" },
  { label: "Rechazado", value: "rejected" },
  { label: "Bloqueado", value: "blocked" },
]

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
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string; hiddenToken?: string } | null>(null)
  const [skuCode, setSkuCode] = useState("")
  const [lotCode, setLotCode] = useState("")
  const [quantity, setQuantity] = useState("")
  const [expiry, setExpiry] = useState("")
  const [locationId, setLocationId] = useState(locationOptions[0]?.id ?? "")

  const columns = useMemo<ProColumn<LotRowView>[]>(
    () => [
      {
        key: "lotCode",
        header: "Lote",
        accessor: (row) => row.lotCode,
        cell: (row) => <span className="font-mono text-sm">{row.lotCode}</span>,
        filterType: "text",
      },
      {
        key: "skuCode",
        header: "SKU",
        accessor: (row) => row.skuCode,
        cell: (row) => (
          <span>
            <span className="block font-mono text-sm">{row.skuCode}</span>
            <span className="block max-w-56 truncate text-xs text-muted-foreground" title={row.skuName}>
              {row.skuName}
            </span>
          </span>
        ),
        filterType: "text",
      },
      {
        key: "warehouseName",
        header: "Almacén",
        accessor: (row) => row.warehouseName,
        filterType: "text",
      },
      {
        key: "locationName",
        header: "Ubicación",
        accessor: (row) => row.locationName,
        filterType: "text",
      },
      {
        key: "expiryDate",
        header: "Caducidad",
        accessor: (row) => row.expiryDate ?? "",
        cell: (row) => <ExpiryCell row={row} />,
        filterType: "date",
      },
      {
        key: "qualityStatus",
        header: "Calidad",
        accessor: (row) => row.qualityStatus,
        cell: (row) => <LotQualityBadge status={row.qualityStatus} />,
        filterType: "select",
        filterOptions: qualityOptions,
      },
      {
        key: "available",
        header: "Disponible",
        accessor: (row) => dec.toNumber(row.available),
        numeric: true,
        align: "right",
        filterType: "number",
      },
      {
        key: "usable",
        header: "Asignable",
        accessor: (row) => (row.usable ? "Sí" : "No"),
        cell: (row) =>
          row.usable ? (
            <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:text-emerald-300">
              Sí (FEFO)
            </Badge>
          ) : (
            <Badge variant="outline" className="border-red-300 text-red-700 dark:text-red-300">
              No asignable
            </Badge>
          ),
        filterType: "select",
        filterOptions: [
          { label: "Sí", value: "Sí" },
          { label: "No", value: "No" },
        ],
      },
    ],
    [],
  )

  const recentChanges = useMemo<RecentChange[]>(
    () =>
      rows.slice(0, 8).map((row) => ({
        id: row.lotId,
        title: `Lote ${row.lotCode}`,
        description: `${row.skuCode} · ${row.warehouseName} · ${qualityLabel(row.qualityStatus)}`,
        actor: "Inventario",
        at: row.expiryDate ? `Caduca ${row.expiryDate}` : "Sin caducidad",
      })),
    [rows],
  )

  const lotRowActions =
    mutationsEnabled && canQuality
      ? (row: LotRowView) => {
          if (row.qualityStatus !== "quarantine" && row.qualityStatus !== "pending") return null
          return (
            <div className="flex justify-end gap-2">
              <Button
                disabled={isPending}
                onClick={() => changeQuality(row.lotId, "released", row.lotCode)}
                size="sm"
                title="Liberar lote para venta"
                variant="outline"
              >
                Liberar
              </Button>
              <Button
                className="text-red-600"
                disabled={isPending}
                onClick={() => changeQuality(row.lotId, "rejected", row.lotCode)}
                size="sm"
                title="Rechazar lote"
                variant="outline"
              >
                Rechazar
              </Button>
            </div>
          )
        }
      : undefined

  function submitReceive() {
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
            ? `La recepción del lote ${result.value.lotCode} ya estaba registrada; no se duplicó.`
            : `Lote ${result.value?.lotCode} recibido en cuarentena.`,
          hiddenToken: result.value?.duplicated ? "idempotencia" : undefined,
        })
        setLotCode("")
        setQuantity("")
        setExpiry("")
        router.refresh()
      } else {
        setMessage({ kind: "error", text: result.error?.message ?? "No se pudo completar la acción. Intenta nuevamente." })
      }
    })
  }

  function changeQuality(lotId: string, to: "released" | "rejected", code: string) {
    setMessage(null)
    const reason = window.prompt(
      to === "released"
        ? `Motivo de liberación del lote ${code}:`
        : `Motivo de rechazo del lote ${code}:`,
    )
    if (!reason) return
    startTransition(async () => {
      const result = await changeLotQualityAction({ lotId, to, reason })
      if (result.ok) {
        setMessage({ kind: "ok", text: `Lote ${code} ${to === "released" ? "liberado" : "rechazado"}.` })
        router.refresh()
      } else {
        setMessage({ kind: "error", text: result.error?.message ?? "No se pudo completar la acción. Intenta nuevamente." })
      }
    })
  }

  return (
    <div className="space-y-6">
      {!mutationsEnabled && (
        <p className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground" data-testid="mutations-disabled-note">
          Esta función todavía está en configuración. Puedes revisar lotes, filtrar, consultar totales y exportar la
          información; la recepción y cambios de calidad se habilitan cuando tu sesión permita guardar cambios.
        </p>
      )}

      {message && (
        <p
          className={`rounded-lg border p-3 text-sm ${
            message.kind === "ok"
              ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"
              : "border-red-300 bg-red-50 text-red-900 dark:bg-red-950/30 dark:text-red-200"
          }`}
          data-testid={`action-${message.kind}`}
          role="status"
        >
          {message.text}
          {message.hiddenToken && <span className="sr-only">{message.hiddenToken}</span>}
        </p>
      )}

      {mutationsEnabled && canReceive && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <PackagePlus className="h-4 w-4" aria-hidden /> Recibir lote (entra en cuarentena)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
              onSubmit={(event) => {
                event.preventDefault()
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
                    {skuOptions.map((sku) => (
                      <SelectItem key={sku.sku} value={sku.sku}>
                        {sku.sku} - {sku.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="recv-lot">Código de lote</Label>
                <Input id="recv-lot" onChange={(event) => setLotCode(event.target.value)} placeholder="LOT-2026-001" required value={lotCode} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="recv-qty">Cantidad (pzas)</Label>
                <Input
                  id="recv-qty"
                  inputMode="decimal"
                  onChange={(event) => setQuantity(event.target.value)}
                  placeholder="10"
                  required
                  value={quantity}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="recv-exp">Caducidad</Label>
                <Input id="recv-exp" onChange={(event) => setExpiry(event.target.value)} type="date" value={expiry} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="recv-loc">Ubicación</Label>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger id="recv-loc" aria-label="Ubicación de recepción">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locationOptions.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2 lg:col-span-5">
                <Button disabled={isPending || !skuCode || !lotCode || !quantity} type="submit">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
                  Registrar recepción
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTablePro
        columns={columns}
        emptyMessage="Sin existencias por lote registradas."
        getRowId={(row) => `${row.lotId}-${row.locationName}`}
        getRowTestId={(row) => `lot-row-${row.lotCode}`}
        moduleName="Inventario por lote"
        quickFilters={[
          { label: "Asignables", predicate: (row) => row.usable },
          { label: "Por vencer", predicate: (row) => row.expiresInDays !== null && row.expiresInDays >= 0 && row.expiresInDays <= 60 },
          { label: "Vencidos", predicate: (row) => row.expiresInDays !== null && row.expiresInDays < 0 },
          { label: "Cuarentena", predicate: (row) => row.qualityStatus === "quarantine" || row.qualityStatus === "pending" },
        ]}
        recentChanges={recentChanges}
        rowActions={lotRowActions}
        rows={rows}
        tableId="inventory-lots"
        testId="inventory-lots-table"
      />
    </div>
  )
}

function ExpiryCell({ row }: { row: LotRowView }) {
  return (
    <span className="text-sm">
      {row.expiryDate ?? "N/A"}
      {row.expiresInDays !== null && (
        <span
          className={`block text-xs ${
            row.expiresInDays < 0
              ? "font-medium text-red-600 dark:text-red-400"
              : row.expiresInDays <= 60
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground"
          }`}
        >
          {row.expiresInDays < 0 ? `Vencido hace ${-row.expiresInDays} días` : `Vence en ${row.expiresInDays} días`}
        </span>
      )}
    </span>
  )
}

function qualityLabel(status: LotQualityStatus) {
  return qualityOptions.find((option) => option.value === status)?.label ?? status
}
