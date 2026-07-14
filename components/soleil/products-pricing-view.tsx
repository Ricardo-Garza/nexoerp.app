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
import { DataTablePro, type ProColumn, type RecentChange } from "@/components/ui/data-table-pro"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { usePlatform } from "@/contexts/platform-context"
import { appendAudit, bulkInsert, listAudit } from "@/lib/platform/tenant-store"
import {
  buildStockPositions,
  loadSoleilInventory,
  loadSoleilMovements,
  loadSoleilPriceEntries,
  loadSoleilProducts,
  type SoleilStockMovement,
} from "@/lib/domain/soleilwire/client-data"
import { SOLEIL_TENANT_ID, getSoleilSeed, type SoleilPriceEntry, type SoleilProduct } from "@/lib/domain/soleilwire"
import { Boxes, Download, FileClock, Grid3X3, History, Import, List, PencilLine, Table2 } from "lucide-react"

/**
 * Módulo combinado "Productos y Precios": catálogo + lista de precios en una
 * sola pantalla. Los precios pendientes se muestran como tales (no se inventan)
 * y la captura manual queda auditada por registro.
 */

type CatalogViewMode = "tabla" | "tarjetas" | "lista" | "comercial" | "operativa"

interface ProductRow extends SoleilProduct {
  precioLista: number | null
  canal: string | null
}

const FAMILY_TONES = [
  "from-amber-500/30 to-orange-600/10 text-amber-600 dark:text-amber-300",
  "from-cyan-500/30 to-sky-600/10 text-cyan-700 dark:text-cyan-300",
  "from-emerald-500/30 to-teal-600/10 text-emerald-700 dark:text-emerald-300",
  "from-violet-500/30 to-purple-600/10 text-violet-700 dark:text-violet-300",
  "from-rose-500/30 to-red-600/10 text-rose-700 dark:text-rose-300",
  "from-blue-500/30 to-indigo-600/10 text-blue-700 dark:text-blue-300",
]

function familyTone(familia: string): string {
  let hash = 0
  for (const ch of familia) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return FAMILY_TONES[hash % FAMILY_TONES.length]
}

function familyInitials(familia: string): string {
  return familia
    .split(/[\s/]+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase()
}

function money(value: number | null, currency = "MXN"): string {
  if (value === null) return "—"
  return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(value)
}

export function ProductsPricingView({ tenantName }: { tenantName: string }) {
  const { toast } = useToast()
  const { user } = useAuth()
  const { activeTenantId } = usePlatform()
  const [refreshKey, setRefreshKey] = useState(0)
  const [products, setProducts] = useState<SoleilProduct[]>([])
  const [priceEntries, setPriceEntries] = useState<SoleilPriceEntry[]>([])
  const [recentChanges, setRecentChanges] = useState<RecentChange[]>([])
  const [inventoryAvailable, setInventoryAvailable] = useState<Map<string, number>>(new Map())
  const [recentMovements, setRecentMovements] = useState<SoleilStockMovement[]>([])
  const [activeTab, setActiveTab] = useState("catalogo")
  const [viewMode, setViewMode] = useState<CatalogViewMode>("tabla")
  const [columnPreset, setColumnPreset] = useState<"comercial" | "tecnica" | "precios">("comercial")
  const [cardsWithImage, setCardsWithImage] = useState(true)
  const [cardQuery, setCardQuery] = useState("")
  const [cardFamily, setCardFamily] = useState<string>("todas")
  const [cardSort, setCardSort] = useState<"nombre" | "precio-desc" | "precio-asc">("nombre")
  const [priceDialog, setPriceDialog] = useState<ProductRow | null>(null)
  const [productDialog, setProductDialog] = useState<ProductRow | null>(null)
  const [priceValue, setPriceValue] = useState("")
  const [wholesaleValue, setWholesaleValue] = useState("")

  const isSoleil = activeTenantId === SOLEIL_TENANT_ID
  const soleilSeed = getSoleilSeed()
  const actorEmail = user?.email ?? "usuario@empresa"

  useEffect(() => {
    setProducts(loadSoleilProducts(activeTenantId))
    setPriceEntries(loadSoleilPriceEntries(activeTenantId))
    const movements = loadSoleilMovements(activeTenantId)
    const positions = buildStockPositions(loadSoleilInventory(activeTenantId), movements)
    const available = new Map<string, number>()
    for (const position of positions) {
      if (!position.capturado) continue
      available.set(position.sku, (available.get(position.sku) ?? 0) + position.disponible)
    }
    setInventoryAvailable(available)
    setRecentMovements(movements.slice(0, 20))
    listAudit(activeTenantId, 30)
      .then((records) =>
        setRecentChanges(
          records
            .filter((r) => r.entityType === "producto" || r.entityType === "precio")
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

  const rows = useMemo<ProductRow[]>(() => {
    const priceBySku = new Map(priceEntries.map((e) => [e.sku, e]))
    return products.map((p) => {
      const entry = priceBySku.get(p.sku)
      return {
        ...p,
        precioLista: entry?.precioUnitario ?? p.precioBase,
        canal: entry?.canal ?? null,
      }
    })
  }, [products, priceEntries])

  const priceList = useMemo(
    () =>
      isSoleil
        ? soleilSeed.listaPrecios
        : {
            id: priceEntries[0]?.lista ?? "LISTA-BASE",
            nombre: "Lista de precios base",
            moneda: priceEntries[0]?.moneda ?? "MXN",
            estado: "activa",
          },
    [isSoleil, soleilSeed.listaPrecios, priceEntries],
  )

  const families = useMemo(() => {
    const names = new Set(rows.map((r) => r.familia))
    return [...names].sort((a, b) => a.localeCompare(b, "es"))
  }, [rows])

  const familiesWithCounts = useMemo(
    () =>
      families.map((nombre) => ({
        nombre,
        productos: rows.filter((r) => r.familia === nombre).length,
      })),
    [families, rows],
  )

  const sinPrecio = rows.filter((r) => r.activo && r.precioLista === null).length
  const activos = rows.filter((r) => r.activo).length

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  const savePrice = useCallback(async () => {
    if (!priceDialog) return
    const unit = priceValue.trim() === "" ? null : Number(priceValue)
    const wholesale = wholesaleValue.trim() === "" ? null : Number(wholesaleValue)
    if (unit === null || !Number.isFinite(unit) || unit <= 0) {
      toast({ title: "Captura un precio unitario válido", variant: "destructive" })
      return
    }
    if (wholesale !== null && (!Number.isFinite(wholesale) || wholesale <= 0)) {
      toast({ title: "El precio de mayoreo no es válido", variant: "destructive" })
      return
    }
    const before = priceDialog.precioLista
    await bulkInsert(activeTenantId, "priceEntries", [
      {
        sku: priceDialog.sku,
        lista: priceList.id,
        canal: "General",
        moneda: priceDialog.moneda,
        precioUnitario: unit,
        unidad: priceDialog.unidadVenta,
        precioMayoreo: wholesale,
        activo: true,
        notas: "Captura manual desde Productos y Precios",
      },
    ])
    await appendAudit({
      tenantId: activeTenantId,
      actorEmail,
      actorRole: "usuario",
      action: "precio.capturado",
      entityType: "precio",
      entityId: priceDialog.sku,
      summary: `Precio de ${priceDialog.sku} capturado en ${priceList.id}`,
      before: { precioUnitario: before },
      after: { precioUnitario: unit, precioMayoreo: wholesale },
      source: "ui",
    })
    toast({ title: "Precio guardado", description: `${priceDialog.sku} · ${money(unit, priceDialog.moneda)}` })
    setPriceDialog(null)
    setPriceValue("")
    setWholesaleValue("")
    refresh()
  }, [priceDialog, priceValue, wholesaleValue, activeTenantId, actorEmail, priceList.id, toast, refresh])

  const baseColumns = useMemo<ProColumn<ProductRow>[]>(
    () => [
      {
        key: "sku",
        header: "SKU",
        accessor: (r) => r.sku,
        cell: (r) => <span className="font-mono text-xs">{r.sku}</span>,
        filterType: "text",
      },
      {
        key: "producto",
        header: "Producto",
        accessor: (r) => r.producto,
        cell: (r) => (
          <span className="block max-w-72 truncate" title={r.producto}>
            {r.producto}
          </span>
        ),
        filterType: "text",
      },
      {
        key: "familia",
        header: "Familia",
        accessor: (r) => r.familia,
        filterType: "select",
        filterOptions: families.map((f) => ({ label: f, value: f })),
      },
      {
        key: "subfamilia",
        header: "Subfamilia",
        accessor: (r) => r.subfamilia ?? "",
        filterType: "text",
        defaultVisible: columnPreset === "tecnica",
      },
      {
        key: "usoAplicacion",
        header: "Aplicación",
        accessor: (r) => r.usoAplicacion ?? "",
        cell: (r) => (
          <span className="block max-w-64 truncate" title={r.usoAplicacion ?? undefined}>
            {r.usoAplicacion ?? "—"}
          </span>
        ),
        filterType: "text",
        defaultVisible: columnPreset !== "precios",
      },
      {
        key: "voltaje",
        header: "Voltaje",
        accessor: (r) => r.voltaje ?? "",
        filterType: "text",
        defaultVisible: columnPreset === "tecnica",
      },
      {
        key: "material",
        header: "Material",
        accessor: (r) => r.material ?? "",
        filterType: "text",
        defaultVisible: columnPreset === "tecnica",
      },
      {
        key: "norma",
        header: "Norma",
        accessor: (r) => r.norma ?? "",
        filterType: "text",
        defaultVisible: columnPreset === "tecnica",
      },
      {
        key: "unidadVenta",
        header: "Unidad",
        accessor: (r) => r.unidadVenta,
        defaultVisible: columnPreset !== "tecnica",
      },
      {
        key: "precioLista",
        header: `Precio (${priceList.id})`,
        accessor: (r) => r.precioLista,
        cell: (r) =>
          r.precioLista === null ? (
            <Badge variant="outline" className="border-amber-400/60 text-amber-600 dark:text-amber-300">
              Sin precio
            </Badge>
          ) : (
            <span className="font-mono text-sm">{money(r.precioLista, r.moneda)}</span>
          ),
        numeric: true,
        currency: true,
        align: "right",
        filterType: "number",
      },
      {
        key: "precioMayoreo",
        header: "Mayoreo",
        accessor: (r) => r.precioMayoreo,
        cell: (r) => <span className="font-mono text-sm">{money(r.precioMayoreo, r.moneda)}</span>,
        numeric: true,
        currency: true,
        align: "right",
        filterType: "number",
        defaultVisible: columnPreset === "precios",
      },
      {
        key: "costoEstimado",
        header: "Costo est.",
        accessor: (r) => r.costoEstimado,
        cell: (r) => <span className="font-mono text-sm">{money(r.costoEstimado, r.moneda)}</span>,
        numeric: true,
        currency: true,
        align: "right",
        filterType: "number",
        defaultVisible: columnPreset === "precios",
      },
      {
        key: "proveedor",
        header: "Proveedor",
        accessor: (r) => r.proveedor ?? "",
        filterType: "text",
        defaultVisible: false,
      },
      {
        key: "tiempoEntregaDias",
        header: "Entrega (días)",
        accessor: (r) => r.tiempoEntregaDias,
        numeric: true,
        align: "right",
        filterType: "number",
        defaultVisible: false,
      },
      {
        key: "activo",
        header: "Estado",
        accessor: (r) => (r.activo ? "Activo" : "Inactivo"),
        cell: (r) => (
          <Badge variant={r.activo ? "secondary" : "outline"}>{r.activo ? "Activo" : "Inactivo"}</Badge>
        ),
        filterType: "select",
        filterOptions: [
          { label: "Activo", value: "Activo" },
          { label: "Inactivo", value: "Inactivo" },
        ],
      },
    ],
    [families, columnPreset, priceList.id],
  )

  const priceColumns = useMemo<ProColumn<SoleilPriceEntry & { producto: string }>[]>(
    () => [
      { key: "sku", header: "SKU", accessor: (r) => r.sku, cell: (r) => <span className="font-mono text-xs">{r.sku}</span>, filterType: "text" },
      {
        key: "producto",
        header: "Producto",
        accessor: (r) => r.producto,
        cell: (r) => (
          <span className="block max-w-72 truncate" title={r.producto}>
            {r.producto}
          </span>
        ),
        filterType: "text",
      },
      { key: "lista", header: "Lista", accessor: (r) => r.lista, filterType: "text" },
      { key: "canal", header: "Canal", accessor: (r) => r.canal ?? "", filterType: "text" },
      {
        key: "precioUnitario",
        header: "Precio unitario",
        accessor: (r) => r.precioUnitario,
        cell: (r) =>
          r.precioUnitario === null ? (
            <Badge variant="outline" className="border-amber-400/60 text-amber-600 dark:text-amber-300">
              Pendiente
            </Badge>
          ) : (
            <span className="font-mono text-sm">{money(r.precioUnitario, r.moneda)}</span>
          ),
        numeric: true,
        currency: true,
        align: "right",
        filterType: "number",
      },
      { key: "unidad", header: "Unidad", accessor: (r) => r.unidad },
      {
        key: "precioMayoreo",
        header: "Mayoreo",
        accessor: (r) => r.precioMayoreo,
        cell: (r) => <span className="font-mono text-sm">{money(r.precioMayoreo, r.moneda)}</span>,
        numeric: true,
        currency: true,
        align: "right",
        filterType: "number",
      },
      {
        key: "vigenciaInicio",
        header: "Vigencia",
        accessor: (r) => r.vigenciaInicio ?? "",
        cell: (r) => <span className="text-xs">{r.vigenciaInicio ?? "Por definir"}</span>,
      },
      {
        key: "activo",
        header: "Estado",
        accessor: (r) => (r.activo ? "Activa" : "Inactiva"),
        cell: (r) => <Badge variant={r.activo ? "secondary" : "outline"}>{r.activo ? "Activa" : "Inactiva"}</Badge>,
      },
    ],
    [],
  )

  const priceRows = useMemo(() => {
    const nameBySku = new Map(products.map((p) => [p.sku, p.producto]))
    return priceEntries.map((e) => ({ ...e, producto: nameBySku.get(e.sku) ?? e.sku }))
  }, [priceEntries, products])

  const cardRows = useMemo(() => {
    const q = cardQuery.trim().toLowerCase()
    let list = rows.filter((r) => r.activo)
    if (cardFamily !== "todas") list = list.filter((r) => r.familia === cardFamily)
    if (q) {
      list = list.filter(
        (r) =>
          r.sku.toLowerCase().includes(q) ||
          r.producto.toLowerCase().includes(q) ||
          (r.usoAplicacion ?? "").toLowerCase().includes(q) ||
          (r.material ?? "").toLowerCase().includes(q),
      )
    }
    switch (cardSort) {
      case "precio-desc":
        list = [...list].sort((a, b) => (b.precioLista ?? -1) - (a.precioLista ?? -1))
        break
      case "precio-asc":
        list = [...list].sort((a, b) => (a.precioLista ?? Number.MAX_SAFE_INTEGER) - (b.precioLista ?? Number.MAX_SAFE_INTEGER))
        break
      default:
        list = [...list].sort((a, b) => a.producto.localeCompare(b.producto, "es"))
    }
    return list
  }, [rows, cardQuery, cardFamily, cardSort])

  const helpItems = [
    "Busca por SKU, producto, familia, aplicación o material desde la barra de búsqueda.",
    "Usa los filtros rápidos para ver productos sin precio o solo activos.",
    "Captura el precio con el lápiz de cada fila; queda registrado en el historial.",
    "Importa precios masivos desde el Centro de Importación (plantilla Listas de precios).",
    "Exporta la vista actual a CSV/XLSX respetando filtros y columnas visibles.",
    "Cambia entre vista tabla, tarjetas, lista, comercial u operativa según lo que necesites.",
  ]

  const openPriceDialog = useCallback((row: ProductRow) => {
    setPriceDialog(row)
    setPriceValue(row.precioLista !== null ? String(row.precioLista) : "")
    setWholesaleValue(row.precioMayoreo !== null ? String(row.precioMayoreo) : "")
  }, [])

  const productsInSelectedFamily = cardFamily === "todas" ? rows : rows.filter((r) => r.familia === cardFamily)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-balance">Productos y Precios</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Catálogo de cables y lista {priceList.id} en un solo módulo. Los precios se capturan manualmente o
            por importación; nada se inventa.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{activos} activos</Badge>
          <Badge
            variant="outline"
            className={sinPrecio > 0 ? "border-amber-400/60 text-amber-600 dark:text-amber-300" : ""}
          >
            {sinPrecio} sin precio
          </Badge>
          <Badge variant="outline">{families.length} familias</Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
          <TabsTrigger value="precios">Lista de precios</TabsTrigger>
          <TabsTrigger value="familias">Familias</TabsTrigger>
          <TabsTrigger value="importacion">Importación</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="catalogo" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-border p-0.5">
                  {(
                    [
                      { mode: "tabla" as const, icon: Table2, label: "Tabla" },
                      { mode: "tarjetas" as const, icon: Grid3X3, label: "Tarjetas" },
                      { mode: "lista" as const, icon: List, label: "Lista" },
                      { mode: "comercial" as const, icon: Download, label: "Vista comercial" },
                      { mode: "operativa" as const, icon: FileClock, label: "Vista operativa" },
                    ]
                  ).map(({ mode, icon: Icon, label }) => (
                <Button
                  key={mode}
                  size="sm"
                  variant={viewMode === mode ? "secondary" : "ghost"}
                  onClick={() => setViewMode(mode)}
                  title={`Ver como ${label.toLowerCase()}`}
                  data-testid={`soleil-view-${mode}`}
                >
                  <Icon className="w-4 h-4 mr-1" /> {label}
                </Button>
              ))}
            </div>
            {viewMode === "tabla" && (
              <Select value={columnPreset} onValueChange={(v) => setColumnPreset(v as typeof columnPreset)}>
                <SelectTrigger className="w-44" title="Conjunto de columnas">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comercial">Vista comercial</SelectItem>
                  <SelectItem value="tecnica">Vista técnica</SelectItem>
                  <SelectItem value="precios">Vista de precios</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {cardFamily !== "todas" && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
              <span>
                Familia <strong>{cardFamily}</strong>: {productsInSelectedFamily.length} productos encontrados.
              </span>
              <Button size="sm" variant="outline" onClick={() => setCardFamily("todas")}>
                Volver a todas las familias
              </Button>
            </div>
          )}

          {viewMode === "tabla" ? (
            <DataTablePro
              key={`soleil-productos-${columnPreset}`}
              tableId={`soleil-productos-${columnPreset}`}
              columns={baseColumns}
              rows={productsInSelectedFamily}
              getRowId={(r) => r.sku}
              moduleName="Productos y Precios"
              tenantName={tenantName}
              quickFilters={[
                { label: "Sin precio", predicate: (r) => r.activo && r.precioLista === null },
                { label: "Con precio", predicate: (r) => r.precioLista !== null },
                { label: "Activos", predicate: (r) => r.activo },
                { label: "Inactivos", predicate: (r) => !r.activo },
              ]}
              rowActions={(r) => (
                <Button
                  size="sm"
                  variant="ghost"
                  title="Capturar precio"
                  onClick={(event) => {
                    event.stopPropagation()
                    openPriceDialog(r)
                  }}
                  data-testid={`soleil-capture-price-${r.sku}`}
                >
                  <PencilLine className="w-4 h-4" />
                </Button>
              )}
              onRowClick={setProductDialog}
              recentChanges={recentChanges}
              helpItems={helpItems}
              importHref="/dashboard/import?entity=productos"
              onRefresh={refresh}
              emptyMessage="Sin productos en el catálogo."
              emptyHint="Importa el catálogo desde el Centro de Importación."
              testId="soleil-products-table"
            />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={cardQuery}
                  onChange={(e) => setCardQuery(e.target.value)}
                  placeholder="Buscar por SKU, producto, aplicación o material…"
                  className="w-72"
                />
                <Select value={cardFamily} onValueChange={setCardFamily}>
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Familia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las familias</SelectItem>
                    {families.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={cardSort} onValueChange={(v) => setCardSort(v as typeof cardSort)}>
                  <SelectTrigger className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nombre">Ordenar por nombre</SelectItem>
                    <SelectItem value="precio-desc">Precio: mayor a menor</SelectItem>
                    <SelectItem value="precio-asc">Precio: menor a mayor</SelectItem>
                  </SelectContent>
                </Select>
                {viewMode === "tarjetas" && (
                  <Button size="sm" variant="outline" onClick={() => setCardsWithImage((v) => !v)}>
                    {cardsWithImage ? "Ver sin imagen" : "Ver con imagen"}
                  </Button>
                )}
                <span className="text-sm text-muted-foreground ml-auto">{cardRows.length} productos</span>
              </div>

              {viewMode === "comercial" ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {cardRows.map((r) => (
                    <button
                      key={r.sku}
                      type="button"
                      onClick={() => setProductDialog(r)}
                      className="rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-xs text-muted-foreground">{r.sku}</p>
                          <p className="mt-1 line-clamp-2 text-sm font-semibold">{r.producto}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.usoAplicacion ?? "Aplicación pendiente de capturar"}</p>
                        </div>
                        {r.precioLista === null ? (
                          <Badge variant="outline" className="border-amber-400/60 text-amber-600 dark:text-amber-300">
                            Sin precio
                          </Badge>
                        ) : (
                          <span className="font-mono text-sm font-semibold">{money(r.precioLista, r.moneda)}</span>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="outline">{r.familia}</Badge>
                        <Badge variant="secondary">{r.unidadVenta}</Badge>
                        <Badge variant="outline">{r.activo ? "Activo" : "Inactivo"}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              ) : viewMode === "operativa" ? (
                <Card>
                  <CardContent className="p-0 divide-y divide-border">
                    {cardRows.map((r) => (
                      <button
                        key={r.sku}
                        type="button"
                        onClick={() => setProductDialog(r)}
                        className="grid w-full grid-cols-1 gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/50 md:grid-cols-[12rem_1fr_8rem_8rem_9rem]"
                      >
                        <span className="font-mono text-xs text-muted-foreground">{r.sku}</span>
                        <span className="min-w-0 truncate text-sm" title={r.producto}>
                          {r.producto}
                        </span>
                        <span className="text-xs text-muted-foreground">{r.familia}</span>
                        <span className="font-mono text-sm">
                          {inventoryAvailable.has(r.sku)
                            ? inventoryAvailable.get(r.sku)?.toLocaleString("es-MX")
                            : "Pendiente"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {recentMovements.some((m) => m.sku === r.sku) ? "Con movimientos" : "Sin movimientos"}
                        </span>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              ) : viewMode === "tarjetas" ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {cardRows.map((r) => (
                    <Card key={r.sku} className="overflow-hidden cursor-pointer transition-colors hover:border-primary" onClick={() => setProductDialog(r)}>
                      {cardsWithImage && (
                        <div
                          className={`h-24 bg-gradient-to-br ${familyTone(r.familia)} flex items-center justify-center`}
                        >
                          <span className="text-2xl font-bold tracking-widest opacity-80">
                            {familyInitials(r.familia)}
                          </span>
                        </div>
                      )}
                      <CardContent className="p-4 space-y-2">
                        <p className="font-mono text-[11px] text-muted-foreground">{r.sku}</p>
                        <p className="text-sm font-medium leading-snug line-clamp-2" title={r.producto}>
                          {r.producto}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline" className="text-[11px]">
                            {r.familia}
                          </Badge>
                          {r.precioLista === null ? (
                            <Badge variant="outline" className="border-amber-400/60 text-amber-600 dark:text-amber-300">
                              Sin precio
                            </Badge>
                          ) : (
                            <span className="font-mono text-sm font-semibold">{money(r.precioLista, r.moneda)}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-0 divide-y divide-border">
                    {cardRows.map((r) => (
                      <button key={r.sku} type="button" onClick={() => setProductDialog(r)} className="flex w-full items-center gap-4 px-4 py-2.5 text-left transition-colors hover:bg-muted/50">
                        <span className="font-mono text-xs text-muted-foreground w-52 shrink-0 truncate">{r.sku}</span>
                        <span className="text-sm flex-1 truncate" title={r.producto}>
                          {r.producto}
                        </span>
                        <Badge variant="outline" className="text-[11px] shrink-0 hidden md:inline-flex">
                          {r.familia}
                        </Badge>
                        <span className="font-mono text-sm w-28 text-right shrink-0">
                          {r.precioLista === null ? (
                            <span className="text-amber-600 dark:text-amber-300 text-xs">Sin precio</span>
                          ) : (
                            money(r.precioLista, r.moneda)
                          )}
                        </span>
                      </button>
                    ))}
                    {cardRows.length === 0 && (
                      <p className="px-4 py-8 text-sm text-muted-foreground text-center">Sin resultados con esos filtros.</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="precios" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle>{priceList.nombre}</CardTitle>
                <Badge variant="secondary" className="font-mono">
                  {priceList.id}
                </Badge>
                <Badge variant="outline">{priceList.moneda}</Badge>
                {sinPrecio > 0 && (
                  <Badge variant="outline" className="border-amber-400/60 text-amber-600 dark:text-amber-300">
                    {sinPrecio} precios pendientes de captura
                  </Badge>
                )}
              </div>
              <CardDescription>
                La lista arranca sin precios oficiales: captúralos manualmente o impórtalos cuando el cliente los
                apruebe.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTablePro
                tableId="soleil-lista-precios"
                columns={priceColumns}
                rows={priceRows}
                getRowId={(r) => `${r.sku}-${r.lista}`}
                moduleName="Productos y Precios · Lista"
                tenantName={tenantName}
                quickFilters={[
                  { label: "Pendientes", predicate: (r) => r.precioUnitario === null },
                  { label: "Con precio", predicate: (r) => r.precioUnitario !== null },
                ]}
                helpItems={helpItems}
                importHref="/dashboard/import?entity=precios"
                onRefresh={refresh}
                emptyMessage="La lista de precios está vacía."
                testId="soleil-prices-table"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="familias">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {familiesWithCounts.map((f) => (
              <Card key={f.nombre} className="overflow-hidden">
                <div className={`h-16 bg-gradient-to-br ${familyTone(f.nombre)} flex items-center px-4`}>
                  <Boxes className="w-5 h-5 mr-2 opacity-70" />
                  <span className="font-semibold">{f.nombre}</span>
                </div>
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{f.productos} productos</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setViewMode("tarjetas")
                      setCardFamily(f.nombre)
                      setActiveTab("catalogo")
                    }}
                  >
                    Ver productos
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="importacion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Importación de productos y precios</CardTitle>
              <CardDescription>
                Usa plantillas para cargar catálogo o listas de precios. La validación muestra errores por fila antes de guardar.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <Import className="mb-2 h-5 w-5 text-primary" />
                <p className="font-medium">Catálogo de productos</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Columnas mínimas: SKU, producto, familia, unidad, aplicación y estado.
                </p>
                <Button className="mt-3" size="sm" variant="outline" onClick={() => window.location.assign("/dashboard/import?entity=productos")}>
                  Importar productos
                </Button>
              </div>
              <div className="rounded-lg border p-4">
                <Download className="mb-2 h-5 w-5 text-primary" />
                <p className="font-medium">Lista de precios</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  No se inventan precios: si falta precio queda como “Sin precio” hasta capturarlo o importarlo.
                </p>
                <Button className="mt-3" size="sm" variant="outline" onClick={() => window.location.assign("/dashboard/import?entity=precios")}>
                  Importar precios
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Últimos cambios</CardTitle>
              <CardDescription>Actividad reciente de productos y precios para la empresa activa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentChanges.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Sin cambios registrados todavía. Se activa al capturar precios, importar productos o actualizar información.
                </p>
              ) : (
                recentChanges.map((change) => (
                  <div key={change.id} className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-sm font-medium">{change.title}</p>
                    {change.description && <p className="text-xs text-muted-foreground">{change.description}</p>}
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {[change.actor, change.at].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={priceDialog !== null} onOpenChange={(open) => !open && setPriceDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Capturar precio</DialogTitle>
            <DialogDescription>
              {priceDialog?.sku} · {priceDialog?.producto}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="soleil-price-unit">
                Precio unitario ({priceDialog?.moneda} por {priceDialog?.unidadVenta})
              </Label>
              <Input
                id="soleil-price-unit"
                type="number"
                min="0"
                step="0.01"
                value={priceValue}
                onChange={(e) => setPriceValue(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="soleil-price-wholesale">Precio mayoreo (opcional)</Label>
              <Input
                id="soleil-price-wholesale"
                type="number"
                min="0"
                step="0.01"
                value={wholesaleValue}
                onChange={(e) => setWholesaleValue(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              El cambio queda en el historial con tu usuario, fecha y valores anterior/nuevo.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceDialog(null)}>
              Cancelar
            </Button>
            <Button onClick={savePrice} data-testid="soleil-save-price">
              Guardar precio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={productDialog !== null} onOpenChange={(open) => !open && setProductDialog(null)}>
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{productDialog?.producto ?? "Ficha de producto"}</DialogTitle>
            <DialogDescription>
              {productDialog?.sku} · {productDialog?.familia ?? "Sin familia"}
            </DialogDescription>
          </DialogHeader>

          {productDialog && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <InfoTile label="SKU" value={productDialog.sku} mono />
                <InfoTile label="Familia" value={productDialog.familia} />
                <InfoTile label="Unidad" value={productDialog.unidadVenta} />
                <InfoTile label="Aplicación" value={productDialog.usoAplicacion ?? "Pendiente de capturar"} />
                <InfoTile
                  label="Estado del precio"
                  value={productDialog.precioLista === null ? "Sin precio" : "Precio capturado"}
                />
                <InfoTile label="Precio" value={productDialog.precioLista === null ? "Sin precio" : money(productDialog.precioLista, productDialog.moneda)} mono />
                <InfoTile
                  label="Inventario disponible"
                  value={
                    inventoryAvailable.has(productDialog.sku)
                      ? `${inventoryAvailable.get(productDialog.sku)?.toLocaleString("es-MX")} ${productDialog.unidadVenta}`
                      : "Pendiente de capturar"
                  }
                  mono
                />
                <InfoTile label="Material" value={productDialog.material ?? "Sin dato"} />
                <InfoTile label="Norma" value={productDialog.norma ?? "Sin dato"} />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Movimientos recientes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {recentMovements.filter((m) => m.sku === productDialog.sku).length === 0 ? (
                      <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">Sin movimientos todavía.</p>
                    ) : (
                      recentMovements
                        .filter((m) => m.sku === productDialog.sku)
                        .slice(0, 5)
                        .map((movement) => (
                          <div key={`${movement.sku}-${movement.at}-${movement.tipo}`} className="rounded-lg border p-3 text-sm">
                            <div className="flex justify-between gap-3">
                              <span className="font-medium">{movement.tipo}</span>
                              <span className="font-mono">{movement.cantidad.toLocaleString("es-MX")} {movement.unidad}</span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {[movement.almacen, movement.almacenDestino, movement.motivo].filter(Boolean).join(" · ") || "Sin referencia"}
                            </p>
                          </div>
                        ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Últimos cambios</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {recentChanges.filter((change) => change.description?.includes(productDialog.sku)).length === 0 ? (
                      <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">Sin cambios recientes para este SKU.</p>
                    ) : (
                      recentChanges
                        .filter((change) => change.description?.includes(productDialog.sku))
                        .slice(0, 5)
                        .map((change) => (
                          <div key={change.id} className="rounded-lg border p-3 text-sm">
                            <p className="font-medium">{change.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {[change.actor, change.at].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                        ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  toast({
                    title: "Preparado para configurar",
                    description: "La edición completa de producto se conectará a datos reales.",
                  })
                }
              >
                Editar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (!productDialog) return
                  openPriceDialog(productDialog)
                  setProductDialog(null)
                }}
              >
                <PencilLine className="mr-2 h-4 w-4" />
                Cargar precio
              </Button>
              <Button variant="outline" onClick={() => {
                setProductDialog(null)
                window.location.assign("/dashboard/import?entity=precios")
              }}>
                <Import className="mr-2 h-4 w-4" />
                Importar
              </Button>
              <Button variant="outline" onClick={() => {
                setActiveTab("catalogo")
                setViewMode("tabla")
                setProductDialog(null)
              }}>
                <Download className="mr-2 h-4 w-4" />
                Exportar tabla
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => {
                setActiveTab("historial")
                setProductDialog(null)
              }}>
                <History className="mr-2 h-4 w-4" />
                Ver historial
              </Button>
              <Button onClick={() => setProductDialog(null)}>Cerrar</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InfoTile({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  )
}
