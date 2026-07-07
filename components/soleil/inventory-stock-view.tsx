"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { DataTablePro, type ProColumn, type RecentChange } from "@/components/ui/data-table-pro"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { usePlatform } from "@/contexts/platform-context"
import { appendAudit, bulkInsert, listAudit } from "@/lib/platform/tenant-store"
import {
  buildStockPositions,
  loadSoleilInventory,
  loadSoleilMovements,
  loadSoleilProducts,
  type SoleilMovementType,
  type SoleilStockMovement,
  type SoleilStockPosition,
} from "@/lib/domain/soleilwire/client-data"
import type { SoleilProduct } from "@/lib/domain/soleilwire"
import { ArrowDownToLine, ArrowUpFromLine, Lock, LockOpen, Repeat, Scale } from "lucide-react"

/**
 * Módulo combinado "Inventario y Existencias" para distribución de cables:
 * bobinas/rollos/series en lugar de caducidades, con disponible/apartado,
 * movimientos auditados y trazabilidad por producto o bobina.
 */

const MOVEMENT_LABEL: Record<SoleilMovementType, string> = {
  entrada: "Entrada",
  salida: "Salida",
  transferencia: "Transferencia",
  ajuste: "Ajuste",
  apartado: "Apartado",
  liberacion: "Liberación",
}

interface PositionRow extends SoleilStockPosition {
  producto: string
  familia: string
  stockMinimo: number | null
  stockBajo: boolean
}

export function InventoryStockView({ tenantName }: { tenantName: string }) {
  const { toast } = useToast()
  const { user } = useAuth()
  const { activeTenantId } = usePlatform()
  const [refreshKey, setRefreshKey] = useState(0)
  const [products, setProducts] = useState<SoleilProduct[]>([])
  const [positions, setPositions] = useState<SoleilStockPosition[]>([])
  const [movements, setMovements] = useState<SoleilStockMovement[]>([])
  const [recentChanges, setRecentChanges] = useState<RecentChange[]>([])
  const [movementDialog, setMovementDialog] = useState<SoleilMovementType | null>(null)
  const [movSku, setMovSku] = useState("")
  const [movQty, setMovQty] = useState("")
  const [movWarehouse, setMovWarehouse] = useState("Principal")
  const [movWarehouseDest, setMovWarehouseDest] = useState("")
  const [movSerie, setMovSerie] = useState("")
  const [movReason, setMovReason] = useState("")

  const actorEmail = user?.email ?? "usuario@soleilwire"

  useEffect(() => {
    const prods = loadSoleilProducts(activeTenantId)
    const inv = loadSoleilInventory(activeTenantId)
    const movs = loadSoleilMovements(activeTenantId)
    setProducts(prods)
    setMovements(movs)
    setPositions(buildStockPositions(inv, movs))
    listAudit(activeTenantId, 30)
      .then((records) =>
        setRecentChanges(
          records
            .filter((r) => r.entityType === "inventario")
            .slice(0, 8)
            .map((r) => ({
              id: r.id,
              title: r.summary,
              description: `${r.entityId} · ${r.action}`,
              actor: r.actorEmail,
              at: new Date(r.at).toLocaleString("es-MX"),
            })),
        ),
      )
      .catch(() => setRecentChanges([]))
  }, [activeTenantId, refreshKey])

  const productBySku = useMemo(() => new Map(products.map((p) => [p.sku, p])), [products])

  const rows = useMemo<PositionRow[]>(
    () =>
      positions.map((pos) => {
        const product = productBySku.get(pos.sku)
        const min = product?.stockMinimo ?? null
        return {
          ...pos,
          producto: product?.producto ?? pos.sku,
          familia: product?.familia ?? "—",
          stockMinimo: min,
          stockBajo: pos.capturado && min !== null && pos.disponible < min,
        }
      }),
    [positions, productBySku],
  )

  const warehouses = useMemo(() => {
    const names = new Set<string>(["Principal"])
    for (const r of rows) names.add(r.almacen)
    return [...names].sort()
  }, [rows])

  const totalDisponible = rows.reduce((acc, r) => acc + r.disponible, 0)
  const totalApartado = rows.reduce((acc, r) => acc + r.apartado, 0)
  const skusCapturados = new Set(rows.filter((r) => r.capturado).map((r) => r.sku)).size

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  const openMovement = useCallback((tipo: SoleilMovementType, sku?: string) => {
    setMovementDialog(tipo)
    setMovSku(sku ?? "")
    setMovQty("")
    setMovWarehouseDest("")
    setMovSerie("")
    setMovReason("")
  }, [])

  const saveMovement = useCallback(async () => {
    if (!movementDialog) return
    const sku = movSku.trim().toUpperCase()
    const qty = Number(movQty)
    if (!sku || !productBySku.has(sku)) {
      toast({ title: "Elige un SKU válido del catálogo", variant: "destructive" })
      return
    }
    if (!Number.isFinite(qty) || qty === 0) {
      toast({ title: "Captura una cantidad válida", variant: "destructive" })
      return
    }
    if (movementDialog !== "ajuste" && qty < 0) {
      toast({ title: "La cantidad debe ser positiva; usa Ajuste para correcciones negativas", variant: "destructive" })
      return
    }
    if (movementDialog === "transferencia" && !movWarehouseDest.trim()) {
      toast({ title: "Indica el almacén destino", variant: "destructive" })
      return
    }
    if ((movementDialog === "ajuste" || movementDialog === "salida") && !movReason.trim()) {
      toast({ title: "El motivo es obligatorio para salidas y ajustes", variant: "destructive" })
      return
    }
    const product = productBySku.get(sku)
    const movement: SoleilStockMovement = {
      sku,
      tipo: movementDialog,
      cantidad: qty,
      unidad: product?.unidadVenta ?? "m",
      almacen: movWarehouse.trim() || "Principal",
      almacenDestino: movementDialog === "transferencia" ? movWarehouseDest.trim() : null,
      loteSerie: movSerie.trim() || null,
      motivo: movReason.trim() || null,
      actorEmail,
      at: new Date().toISOString(),
    }
    await bulkInsert(activeTenantId, "stockMovements", [movement as unknown as Record<string, unknown>])
    await appendAudit({
      tenantId: activeTenantId,
      actorEmail,
      actorRole: "usuario",
      action: `inventario.${movementDialog}`,
      entityType: "inventario",
      entityId: movement.loteSerie ? `${sku} · ${movement.loteSerie}` : sku,
      summary: `${MOVEMENT_LABEL[movementDialog]} de ${qty} ${movement.unidad} de ${sku} en ${movement.almacen}${movement.almacenDestino ? ` → ${movement.almacenDestino}` : ""}`,
      before: null,
      after: { cantidad: qty, motivo: movement.motivo },
      source: "ui",
    })
    toast({
      title: `${MOVEMENT_LABEL[movementDialog]} registrada`,
      description: `${sku} · ${qty} ${movement.unidad}`,
    })
    setMovementDialog(null)
    refresh()
  }, [movementDialog, movSku, movQty, movWarehouse, movWarehouseDest, movSerie, movReason, productBySku, actorEmail, activeTenantId, toast, refresh])

  const positionColumns = useMemo<ProColumn<PositionRow>[]>(
    () => [
      { key: "sku", header: "SKU", accessor: (r) => r.sku, cell: (r) => <span className="font-mono text-xs">{r.sku}</span>, filterType: "text" },
      {
        key: "producto",
        header: "Producto",
        accessor: (r) => r.producto,
        cell: (r) => (
          <span className="block max-w-64 truncate" title={r.producto}>
            {r.producto}
          </span>
        ),
        filterType: "text",
      },
      { key: "familia", header: "Familia", accessor: (r) => r.familia, filterType: "text" },
      { key: "almacen", header: "Almacén", accessor: (r) => r.almacen, filterType: "text" },
      { key: "ubicacion", header: "Ubicación", accessor: (r) => r.ubicacion ?? "", filterType: "text", defaultVisible: false },
      {
        key: "loteSerie",
        header: "Bobina / Serie",
        accessor: (r) => r.loteSerie ?? "",
        cell: (r) => (r.loteSerie ? <span className="font-mono text-xs">{r.loteSerie}</span> : <span className="text-muted-foreground text-xs">—</span>),
        filterType: "text",
      },
      {
        key: "disponible",
        header: "Disponible",
        accessor: (r) => (r.capturado ? r.disponible : null),
        cell: (r) =>
          r.capturado ? (
            <span className={`font-mono text-sm ${r.stockBajo ? "text-amber-600 dark:text-amber-300 font-semibold" : ""}`}>
              {r.disponible.toLocaleString("es-MX")}
            </span>
          ) : (
            <Badge variant="outline" className="text-[11px]">
              Por capturar
            </Badge>
          ),
        numeric: true,
        align: "right",
        filterType: "number",
      },
      {
        key: "apartado",
        header: "Apartado",
        accessor: (r) => r.apartado,
        cell: (r) => <span className="font-mono text-sm">{r.apartado.toLocaleString("es-MX")}</span>,
        numeric: true,
        align: "right",
        filterType: "number",
      },
      { key: "unidad", header: "Unidad", accessor: (r) => r.unidad },
      {
        key: "stockMinimo",
        header: "Stock mín.",
        accessor: (r) => r.stockMinimo,
        cell: (r) => <span className="font-mono text-sm">{r.stockMinimo ?? "—"}</span>,
        numeric: true,
        align: "right",
        filterType: "number",
        defaultVisible: false,
      },
      {
        key: "estado",
        header: "Estado",
        accessor: (r) => (r.stockBajo ? "Stock bajo" : r.capturado ? "Con existencia" : "Sin captura"),
        cell: (r) =>
          r.stockBajo ? (
            <Badge variant="outline" className="border-amber-400/60 text-amber-600 dark:text-amber-300">
              Stock bajo
            </Badge>
          ) : r.capturado ? (
            <Badge variant="secondary">Con existencia</Badge>
          ) : (
            <Badge variant="outline">Sin captura</Badge>
          ),
        filterType: "select",
        filterOptions: [
          { label: "Stock bajo", value: "Stock bajo" },
          { label: "Con existencia", value: "Con existencia" },
          { label: "Sin captura", value: "Sin captura" },
        ],
      },
      {
        key: "ultimoMovimiento",
        header: "Último movimiento",
        accessor: (r) =>
          r.ultimoMovimiento ? `${MOVEMENT_LABEL[r.ultimoMovimiento.tipo]} · ${new Date(r.ultimoMovimiento.at).toLocaleString("es-MX")}` : "",
        cell: (r) =>
          r.ultimoMovimiento ? (
            <span className="text-xs text-muted-foreground">
              {MOVEMENT_LABEL[r.ultimoMovimiento.tipo]} · {new Date(r.ultimoMovimiento.at).toLocaleString("es-MX")}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
        defaultVisible: false,
      },
    ],
    [],
  )

  const movementColumns = useMemo<ProColumn<SoleilStockMovement>[]>(
    () => [
      {
        key: "at",
        header: "Fecha",
        accessor: (r) => r.at,
        cell: (r) => <span className="text-xs">{new Date(r.at).toLocaleString("es-MX")}</span>,
        filterType: "date",
      },
      {
        key: "tipo",
        header: "Movimiento",
        accessor: (r) => MOVEMENT_LABEL[r.tipo],
        cell: (r) => <Badge variant={r.tipo === "salida" || r.tipo === "apartado" ? "outline" : "secondary"}>{MOVEMENT_LABEL[r.tipo]}</Badge>,
        filterType: "select",
        filterOptions: Object.entries(MOVEMENT_LABEL).map(([value, label]) => ({ label, value: label })),
      },
      { key: "sku", header: "SKU", accessor: (r) => r.sku, cell: (r) => <span className="font-mono text-xs">{r.sku}</span>, filterType: "text" },
      {
        key: "cantidad",
        header: "Cantidad",
        accessor: (r) => r.cantidad,
        cell: (r) => <span className="font-mono text-sm">{r.cantidad.toLocaleString("es-MX")}</span>,
        numeric: true,
        align: "right",
        filterType: "number",
      },
      { key: "unidad", header: "Unidad", accessor: (r) => r.unidad },
      {
        key: "almacen",
        header: "Almacén",
        accessor: (r) => (r.almacenDestino ? `${r.almacen} → ${r.almacenDestino}` : r.almacen),
        filterType: "text",
      },
      {
        key: "loteSerie",
        header: "Bobina / Serie",
        accessor: (r) => r.loteSerie ?? "",
        cell: (r) => (r.loteSerie ? <span className="font-mono text-xs">{r.loteSerie}</span> : <span className="text-xs text-muted-foreground">—</span>),
        filterType: "text",
      },
      { key: "motivo", header: "Motivo", accessor: (r) => r.motivo ?? "", filterType: "text" },
      { key: "actorEmail", header: "Usuario", accessor: (r) => r.actorEmail, filterType: "text" },
    ],
    [],
  )

  const helpItems = [
    "Registra entradas, salidas, transferencias y ajustes con los botones de acciones rápidas.",
    "Aparta material para una venta y libéralo si la operación no se concreta.",
    "El disponible se calcula con el inventario inicial más los movimientos registrados.",
    "Filtra por bobina/serie para ver la trazabilidad completa de un carrete.",
    "Importa el inventario inicial desde el Centro de Importación.",
    "Exporta la vista actual respetando filtros y columnas.",
  ]

  const quickActions: { tipo: SoleilMovementType; icon: typeof ArrowDownToLine; label: string }[] = [
    { tipo: "entrada", icon: ArrowDownToLine, label: "Entrada rápida" },
    { tipo: "salida", icon: ArrowUpFromLine, label: "Salida rápida" },
    { tipo: "transferencia", icon: Repeat, label: "Transferencia" },
    { tipo: "ajuste", icon: Scale, label: "Ajuste con motivo" },
    { tipo: "apartado", icon: Lock, label: "Apartar" },
    { tipo: "liberacion", icon: LockOpen, label: "Liberar" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-balance">Inventario y Existencias</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Existencias por bobina, rollo y serie con movimientos auditados. El inventario inicial se importa o se
            captura; nada se inventa.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{totalDisponible.toLocaleString("es-MX")} disponibles</Badge>
          <Badge variant="outline">{totalApartado.toLocaleString("es-MX")} apartados</Badge>
          <Badge variant="outline">{skusCapturados} SKUs con captura</Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {quickActions.map(({ tipo, icon: Icon, label }) => (
          <Button
            key={tipo}
            size="sm"
            variant="outline"
            onClick={() => openMovement(tipo)}
            data-testid={`soleil-movement-${tipo}`}
          >
            <Icon className="w-4 h-4 mr-1" /> {label}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="existencias" className="space-y-4">
        <TabsList>
          <TabsTrigger value="existencias">Existencias</TabsTrigger>
          <TabsTrigger value="movimientos">Movimientos y trazabilidad</TabsTrigger>
        </TabsList>

        <TabsContent value="existencias">
          <DataTablePro
            tableId="soleil-existencias"
            columns={positionColumns}
            rows={rows}
            getRowId={(r) => r.key}
            moduleName="Inventario y Existencias"
            tenantName={tenantName}
            quickFilters={[
              { label: "Stock bajo", predicate: (r) => r.stockBajo },
              { label: "Con existencia", predicate: (r) => r.capturado && r.disponible > 0 },
              { label: "Apartados", predicate: (r) => r.apartado > 0 },
              { label: "Sin captura", predicate: (r) => !r.capturado },
            ]}
            rowActions={(r) => (
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" title="Registrar entrada" onClick={() => openMovement("entrada", r.sku)}>
                  <ArrowDownToLine className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" title="Registrar salida" onClick={() => openMovement("salida", r.sku)}>
                  <ArrowUpFromLine className="w-4 h-4" />
                </Button>
              </div>
            )}
            recentChanges={recentChanges}
            helpItems={helpItems}
            importHref="/dashboard/import?entity=inventario-inicial"
            onRefresh={refresh}
            emptyMessage="Aún no hay existencias capturadas."
            emptyHint="Importa el inventario inicial o registra una entrada."
            testId="soleil-inventory-table"
          />
        </TabsContent>

        <TabsContent value="movimientos">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Movimientos</CardTitle>
              <CardDescription>
                Historial completo: quién movió qué, cuándo, en qué almacén y por qué. Filtra por SKU o bobina/serie
                para seguir la trazabilidad.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTablePro
                tableId="soleil-movimientos"
                columns={movementColumns}
                rows={movements}
                getRowId={(r) => r.id ?? `${r.sku}-${r.at}`}
                moduleName="Inventario · Movimientos"
                tenantName={tenantName}
                quickFilters={[
                  { label: "Entradas", predicate: (r) => r.tipo === "entrada" },
                  { label: "Salidas", predicate: (r) => r.tipo === "salida" },
                  { label: "Apartados", predicate: (r) => r.tipo === "apartado" },
                  { label: "Ajustes", predicate: (r) => r.tipo === "ajuste" },
                ]}
                helpItems={helpItems}
                onRefresh={refresh}
                emptyMessage="Sin movimientos registrados todavía."
                emptyHint="Registra una entrada o importa el inventario inicial."
                testId="soleil-movements-table"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={movementDialog !== null} onOpenChange={(open) => !open && setMovementDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{movementDialog ? MOVEMENT_LABEL[movementDialog] : ""}</DialogTitle>
            <DialogDescription>El movimiento queda auditado con tu usuario y fecha.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="soleil-mov-sku">SKU</Label>
              <Input
                id="soleil-mov-sku"
                list="soleil-sku-options"
                value={movSku}
                onChange={(e) => setMovSku(e.target.value)}
                placeholder="SW-…"
              />
              <datalist id="soleil-sku-options">
                {products.map((p) => (
                  <option key={p.sku} value={p.sku}>
                    {p.producto}
                  </option>
                ))}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="soleil-mov-qty">Cantidad {movementDialog === "ajuste" ? "(+/-)" : ""}</Label>
                <Input
                  id="soleil-mov-qty"
                  type="number"
                  step="0.01"
                  value={movQty}
                  onChange={(e) => setMovQty(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Almacén</Label>
                <Select value={movWarehouse} onValueChange={setMovWarehouse}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w} value={w}>
                        {w}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {movementDialog === "transferencia" && (
              <div className="space-y-2">
                <Label htmlFor="soleil-mov-dest">Almacén destino</Label>
                <Input
                  id="soleil-mov-dest"
                  value={movWarehouseDest}
                  onChange={(e) => setMovWarehouseDest(e.target.value)}
                  placeholder="Sucursal, patio, tránsito…"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="soleil-mov-serie">Bobina / rollo / serie (opcional)</Label>
              <Input
                id="soleil-mov-serie"
                value={movSerie}
                onChange={(e) => setMovSerie(e.target.value)}
                placeholder="BOB-0001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="soleil-mov-reason">
                Motivo {movementDialog === "ajuste" || movementDialog === "salida" ? "(obligatorio)" : "(opcional)"}
              </Label>
              <Textarea
                id="soleil-mov-reason"
                value={movReason}
                onChange={(e) => setMovReason(e.target.value)}
                placeholder="Venta, merma, conteo físico…"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovementDialog(null)}>
              Cancelar
            </Button>
            <Button onClick={saveMovement} data-testid="soleil-save-movement">
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
