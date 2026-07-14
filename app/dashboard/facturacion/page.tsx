"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, FileText, MessageSquare, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTablePro, type ProColumn, type RecentChange } from "@/components/ui/data-table-pro"
import { FormDialog } from "@/components/ui/form-dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentPreview } from "@/components/documents/document-preview"
import { InvoiceSelector } from "@/components/facturacion/invoice-selector"
import { useFirestore } from "@/hooks/use-firestore"
import { COLLECTIONS } from "@/lib/firestore"

type CfdiDoc = {
  id: string
  tipo: "factura" | "nota_credito" | "complemento_pago"
  estatus: "borrador" | "aprobado" | "cancelado"
  uuid?: string
  folio?: string
  serie?: string
  clienteId?: string
  clienteNombre?: string
  vendedor?: string
  salesOrderId?: string
  subtotal?: number
  iva?: number
  total?: number
  facturacionTipo?: "parcial" | "total"
  montoFacturado?: number
  invoiceId?: string
  invoiceFolio?: string
  invoiceUuid?: string
  paymentAmount?: number
  paymentMethod?: string
  paymentDate?: any
  createdAt?: any
}

type Customer = {
  id: string
  name?: string
  rfc?: string
}

const tipoTabs = [
  { value: "factura", label: "Facturas" },
  { value: "nota_credito", label: "Notas de crédito" },
  { value: "complemento_pago", label: "Complementos de pago" },
] as const

const statusLabels: Record<string, string> = {
  borrador: "Borrador",
  aprobado: "Aprobado",
  cancelado: "Cancelado",
}

export default function FacturacionPage() {
  const router = useRouter()
  const { items: cfdis, loading, create, update, remove } = useFirestore<CfdiDoc>(COLLECTIONS.cfdi, [], true)
  const { items: customers } = useFirestore<Customer>(COLLECTIONS.customers, [], true)
  const [activeTab, setActiveTab] = useState<CfdiDoc["tipo"]>("factura")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [clienteFilter, setClienteFilter] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CfdiDoc | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<CfdiDoc | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewItem, setPreviewItem] = useState<CfdiDoc | null>(null)

  const customerOptions = useMemo(
    () =>
      customers.map((customer) => ({
        value: customer.id,
        label: `${customer.name || "Cliente"}${customer.rfc ? ` (${customer.rfc})` : ""}`,
      })),
    [customers],
  )

  const filteredDocs = useMemo(() => {
    const query = search.toLowerCase()
    return cfdis.filter((doc) => {
      const matchesTab = doc.tipo === activeTab
      const matchesStatus = statusFilter ? doc.estatus === statusFilter : true
      const matchesCustomer = clienteFilter ? doc.clienteId === clienteFilter : true
      const matchesSearch = search
        ? [formatFolio(doc), doc.clienteNombre, doc.salesOrderId, doc.serie]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query))
        : true
      return matchesTab && matchesStatus && matchesCustomer && matchesSearch
    })
  }, [activeTab, cfdis, clienteFilter, search, statusFilter])

  const clientHistory = useMemo(() => {
    if (!clienteFilter) return []
    return cfdis
      .filter((doc) => doc.clienteId === clienteFilter)
      .sort((a, b) => createdTime(b.createdAt) - createdTime(a.createdAt))
      .slice(0, 6)
  }, [cfdis, clienteFilter])

  const documentColumns = useMemo<ProColumn<CfdiDoc>[]>(
    () => [
      { key: "clienteNombre", header: "Cliente", accessor: (doc) => doc.clienteNombre || "Sin cliente", filterType: "text" },
      { key: "folio", header: "Folio", accessor: formatFolio, filterType: "text" },
      {
        key: "invoiceFolio",
        header: "Factura origen",
        accessor: (doc) => (doc.tipo !== "factura" ? doc.invoiceFolio || doc.invoiceUuid || "-" : "-"),
        filterType: "text",
      },
      {
        key: "estatus",
        header: "Estado",
        accessor: (doc) => doc.estatus,
        cell: (doc) => <Badge variant="outline">{statusLabels[doc.estatus] || doc.estatus}</Badge>,
        filterType: "select",
        filterOptions: [
          { value: "borrador", label: "Borrador" },
          { value: "aprobado", label: "Aprobado" },
          { value: "cancelado", label: "Cancelado" },
        ],
      },
      {
        key: "total",
        header: "Total",
        accessor: (doc) => doc.total || 0,
        cell: (doc) => formatMoney(doc.total || 0),
        numeric: true,
        align: "right",
        filterType: "number",
      },
      { key: "salesOrderId", header: "Pedido", accessor: (doc) => doc.salesOrderId || "-", filterType: "text" },
    ],
    [],
  )

  const recentChanges = useMemo<RecentChange[]>(
    () =>
      filteredDocs.slice(0, 8).map((doc) => ({
        id: doc.id,
        title: `${statusLabels[doc.estatus] || doc.estatus}: ${formatFolio(doc)}`,
        description: `${doc.clienteNombre || "Sin cliente"} · ${formatMoney(doc.total || 0)}`,
        actor: doc.vendedor || "Facturación",
        at: formatCreatedAt(doc.createdAt),
      })),
    [filteredDocs],
  )

  const fields = [
    {
      name: "tipo",
      label: "Tipo",
      type: "select" as const,
      required: true,
      options: tipoTabs.map((tab) => ({ value: tab.value, label: tab.label })),
    },
    {
      name: "estatus",
      label: "Estado",
      type: "select" as const,
      required: true,
      options: [
        { value: "borrador", label: "Borrador" },
        { value: "aprobado", label: "Aprobado" },
        { value: "cancelado", label: "Cancelado" },
      ],
    },
    { name: "clienteId", label: "Cliente", type: "select" as const, options: customerOptions },
    { name: "clienteNombre", label: "Cliente (texto)", type: "text" as const },
    { name: "vendedor", label: "Vendedor asignado", type: "text" as const },
    { name: "salesOrderId", label: "Pedido de venta", type: "text" as const },
    { name: "folio", label: "Folio", type: "text" as const },
    { name: "serie", label: "Serie", type: "text" as const },
    { name: "uuid", label: "UUID fiscal", type: "text" as const },
    { name: "subtotal", label: "Subtotal", type: "number" as const },
    { name: "iva", label: "IVA", type: "number" as const },
    { name: "total", label: "Total", type: "number" as const },
    {
      name: "facturacionTipo",
      label: "Tipo de facturación",
      type: "select" as const,
      options: [
        { value: "total", label: "Total" },
        { value: "parcial", label: "Parcial" },
      ],
    },
    { name: "montoFacturado", label: "Monto facturado", type: "number" as const },
    { name: "invoiceId", label: "Factura origen", type: "text" as const },
    { name: "invoiceFolio", label: "Folio de factura origen", type: "text" as const },
    { name: "invoiceUuid", label: "UUID de factura origen", type: "text" as const },
    { name: "paymentAmount", label: "Monto del pago", type: "number" as const },
    { name: "paymentMethod", label: "Método de pago", type: "text" as const },
  ]

  async function handleSave(values: Record<string, any>) {
    const payload: Partial<CfdiDoc> = {
      ...values,
      subtotal: Number(values.subtotal || 0),
      iva: Number(values.iva || 0),
      total: Number(values.total || 0),
      montoFacturado: Number(values.montoFacturado || 0),
      clienteNombre: values.clienteNombre || customers.find((customer) => customer.id === values.clienteId)?.name || "",
    }

    if (editingItem?.id) await update(editingItem.id, payload)
    else await create(payload as Omit<CfdiDoc, "id">)

    setDialogOpen(false)
    setEditingItem(null)
    setSelectedInvoice(null)
  }

  function openNew() {
    const tipo = activeTab
    if ((tipo === "nota_credito" || tipo === "complemento_pago") && !selectedInvoice) return

    setEditingItem({
      id: "",
      tipo,
      estatus: "borrador",
      clienteId: selectedInvoice?.clienteId,
      clienteNombre: selectedInvoice?.clienteNombre,
      salesOrderId: selectedInvoice?.salesOrderId,
      invoiceId: selectedInvoice?.id,
      invoiceFolio: selectedInvoice?.folio,
      invoiceUuid: selectedInvoice?.uuid,
    })
    setDialogOpen(true)
  }

  function openPreview(item: CfdiDoc) {
    setPreviewItem(item)
    setPreviewOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Facturación</h2>
          <p className="text-sm text-muted-foreground">Gestiona facturas, notas de crédito y complementos de pago.</p>
        </div>
        {(activeTab === "nota_credito" || activeTab === "complemento_pago") && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Factura de origen:</label>
            <InvoiceSelector selectedInvoice={selectedInvoice} onSelect={setSelectedInvoice} />
          </div>
        )}
        <Button disabled={(activeTab === "nota_credito" || activeTab === "complemento_pago") && !selectedInvoice} onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo {tipoTabs.find((tab) => tab.value === activeTab)?.label}
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-10"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por folio, cliente o pedido..."
                value={search}
              />
            </div>
            <select className="h-9 rounded-md border border-input bg-transparent px-3 text-sm" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
              <option value="">Todos los estados</option>
              <option value="borrador">Borrador</option>
              <option value="aprobado">Aprobado</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <select className="h-9 rounded-md border border-input bg-transparent px-3 text-sm" onChange={(event) => setClienteFilter(event.target.value)} value={clienteFilter}>
              <option value="">Todos los clientes</option>
              {customerOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Badge variant="outline">{filteredDocs.length} resultados</Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as CfdiDoc["tipo"])} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 justify-center">
          {tipoTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tipoTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {loading ? (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">Cargando...</CardContent>
              </Card>
            ) : (
              <DataTablePro
                columns={documentColumns}
                emptyMessage={emptyText(activeTab)}
                getRowId={(doc) => doc.id}
                moduleName="Facturación"
                quickFilters={[
                  { label: "Borrador", predicate: (doc) => doc.estatus === "borrador" },
                  { label: "Aprobadas", predicate: (doc) => doc.estatus === "aprobado" },
                  { label: "Canceladas", predicate: (doc) => doc.estatus === "cancelado" },
                ]}
                recentChanges={recentChanges}
                rowActions={(doc) => (
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openPreview(doc)} title="Vista previa del documento">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => {
                      setEditingItem(doc)
                      setDialogOpen(true)
                    }} title="Editar documento">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button className="text-destructive hover:text-destructive" onClick={() => remove(doc.id)} size="icon" title="Eliminar documento" variant="ghost">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                rows={filteredDocs}
                tableId={`facturacion-${activeTab}`}
                testId="facturacion-table"
              />
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle>Historial por cliente</CardTitle>
          {clienteFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary"
              onClick={() => router.push("/dashboard/crm")}
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1" /> Ver cliente en CRM
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {clienteFilter ? (
            clientHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay historial para este cliente.</p>
            ) : (
              clientHistory.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{documentTypeLabel(doc.tipo)}</p>
                      <p className="text-xs text-muted-foreground">{formatFolio(doc)}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{statusLabels[doc.estatus] || doc.estatus}</Badge>
                </div>
              ))
            )
          ) : (
            <p className="text-sm text-muted-foreground">Selecciona un cliente para ver historial.</p>
          )}
        </CardContent>
      </Card>

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingItem?.id ? "Editar documento" : "Nuevo documento"}
        description={
          editingItem?.tipo === "nota_credito"
            ? "Crea una nota de crédito vinculada a la factura seleccionada."
            : editingItem?.tipo === "complemento_pago"
              ? "Registra un complemento de pago para la factura seleccionada."
              : "Registra facturas y documentos relacionados."
        }
        fields={fields}
        initialValues={editingItem || { tipo: activeTab, estatus: "borrador" }}
        onSubmit={handleSave}
      />

      <DocumentPreview open={previewOpen} onOpenChange={setPreviewOpen} documentType="cfdi" cfdi={previewItem} />
    </div>
  )
}

function formatFolio(doc: CfdiDoc) {
  const value = `${doc.serie || ""}${doc.folio || ""}`.trim()
  return value || "-"
}

function formatMoney(value: number) {
  return value.toLocaleString("es-MX", { style: "currency", currency: "MXN" })
}

function createdTime(value?: any) {
  if (!value) return 0
  if (typeof value?.toDate === "function") return value.toDate().getTime()
  if (typeof value?.seconds === "number") return value.seconds * 1000
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

function formatCreatedAt(value?: any) {
  const time = createdTime(value)
  return time ? new Date(time).toLocaleString("es-MX") : "Sin fecha"
}

function emptyText(tab: CfdiDoc["tipo"]) {
  if (tab === "factura") return "No hay facturas registradas."
  if (tab === "nota_credito") return "No hay notas de crédito. Selecciona una factura para crear una."
  return "No hay complementos de pago. Selecciona una factura para crear uno."
}

function documentTypeLabel(tipo: CfdiDoc["tipo"]) {
  if (tipo === "nota_credito") return "Nota de crédito"
  if (tipo === "complemento_pago") return "Complemento de pago"
  return "Factura"
}
