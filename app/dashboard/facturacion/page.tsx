"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormDialog } from "@/components/ui/form-dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useFirestore } from "@/hooks/use-firestore"
import { COLLECTIONS } from "@/lib/firestore"
import { InvoiceSelector } from "@/components/facturacion/invoice-selector"
import { DocumentPreview } from "@/components/documents/document-preview"
import { FileText, Plus, Pencil, Trash2, Search, Eye } from "lucide-react"

type CfdiDoc = {
  id: string
  tipo: "factura" | "nota_credito" | "complemento_pago"
  estatus: "borrador" | "aprobado" | "cancelado"
  uuid?: string
  folio?: string // Invoice number/folio
  serie?: string // Invoice series
  clienteId?: string
  clienteNombre?: string
  vendedor?: string
  salesOrderId?: string
  subtotal?: number
  iva?: number
  total?: number
  facturacionTipo?: "parcial" | "total"
  montoFacturado?: number
  pacStatus?: string
  satStatus?: string
  xmlUrl?: string
  pdfUrl?: string
  // For credit notes and payment complements - reference to originating invoice
  invoiceId?: string // ID of the originating invoice
  invoiceFolio?: string // Folio of the originating invoice
  invoiceUuid?: string // UUID of the originating invoice
  // For payment complements
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
  { value: "nota_credito", label: "Notas de credito" },
  { value: "complemento_pago", label: "Complementos de pago" },
]

const statusLabels: Record<string, string> = {
  borrador: "Borrador",
  aprobado: "Aprobado",
  cancelado: "Cancelado",
}

export default function FacturacionPage() {
  const { items: cfdis, loading, create, update, remove } = useFirestore<CfdiDoc>(COLLECTIONS.cfdi, [], true)
  const { items: customers } = useFirestore<Customer>(COLLECTIONS.customers, [], true)

  const [activeTab, setActiveTab] = useState("factura")
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
    return cfdis.filter((doc) => {
      const matchesTab = doc.tipo === activeTab
      const matchesStatus = statusFilter ? doc.estatus === statusFilter : true
      const matchesCustomer = clienteFilter ? doc.clienteId === clienteFilter : true
      const searchLower = search.toLowerCase()
      const matchesSearch =
        doc.folio?.toLowerCase().includes(searchLower) ||
        doc.clienteNombre?.toLowerCase().includes(searchLower) ||
        doc.salesOrderId?.toLowerCase().includes(searchLower) ||
        doc.serie?.toLowerCase().includes(searchLower)
      return matchesTab && matchesStatus && matchesCustomer && (search ? matchesSearch : true)
    })
  }, [cfdis, activeTab, statusFilter, clienteFilter, search])

  const clientHistory = useMemo(() => {
    if (!clienteFilter) return []
    return cfdis
      .filter((doc) => doc.clienteId === clienteFilter)
      .sort((a, b) => {
        const aDate = (a.createdAt as any)?.seconds || 0
        const bDate = (b.createdAt as any)?.seconds || 0
        return bDate - aDate
      })
      .slice(0, 6)
  }, [cfdis, clienteFilter])

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
      label: "Estatus",
      type: "select" as const,
      required: true,
      options: [
        { value: "borrador", label: "Borrador" },
        { value: "aprobado", label: "Aprobado" },
        { value: "cancelado", label: "Cancelado" },
      ],
    },
    {
      name: "clienteId",
      label: "Cliente",
      type: "select" as const,
      options: customerOptions,
    },
    { name: "clienteNombre", label: "Cliente (texto)", type: "text" as const },
    { name: "vendedor", label: "Vendedor asignado", type: "text" as const },
    { name: "salesOrderId", label: "Pedido de venta", type: "text" as const },
    { name: "folio", label: "Folio", type: "text" as const },
    { name: "serie", label: "Serie", type: "text" as const },
    { name: "uuid", label: "UUID", type: "text" as const },
    { name: "pacStatus", label: "Estatus PAC", type: "text" as const },
    { name: "satStatus", label: "Estatus SAT", type: "text" as const },
    { name: "subtotal", label: "Subtotal", type: "number" as const },
    { name: "iva", label: "IVA", type: "number" as const },
    { name: "total", label: "Total", type: "number" as const },
    {
      name: "facturacionTipo",
      label: "Facturacion",
      type: "select" as const,
      options: [
        { value: "total", label: "Total" },
        { value: "parcial", label: "Parcial" },
      ],
    },
    { name: "montoFacturado", label: "Monto facturado", type: "number" as const },
    // Fields for linking credit notes and payment complements to invoices
    { name: "invoiceId", label: "ID Factura origen", type: "text" as const },
    { name: "invoiceFolio", label: "Folio Factura origen", type: "text" as const },
    { name: "invoiceUuid", label: "UUID Factura origen", type: "text" as const },
    // Payment complement specific fields
    { name: "paymentAmount", label: "Monto del pago", type: "number" as const },
    { name: "paymentMethod", label: "Método de pago", type: "text" as const },
    { name: "xmlUrl", label: "XML (URL)", type: "text" as const },
    { name: "pdfUrl", label: "PDF (URL)", type: "text" as const },
  ]

  const handleSave = async (values: Record<string, any>) => {
    const payload: Partial<CfdiDoc> = {
      ...values,
      subtotal: Number(values.subtotal || 0),
      iva: Number(values.iva || 0),
      total: Number(values.total || 0),
      montoFacturado: Number(values.montoFacturado || 0),
      clienteNombre:
        values.clienteNombre ||
        customers.find((c) => c.id === values.clienteId)?.name ||
        "",
    }

    if (editingItem?.id) {
      await update(editingItem.id, payload)
    } else {
      await create(payload as Omit<CfdiDoc, "id">)
    }

    setDialogOpen(false)
    setEditingItem(null)
    setSelectedInvoice(null)
  }

  const openNew = () => {
    const tipo = activeTab as CfdiDoc["tipo"]

    // For credit notes and payment complements, require invoice selection first
    if (tipo === "nota_credito" || tipo === "complemento_pago") {
      if (!selectedInvoice) {
        // Don't open dialog, user needs to select invoice first
        return
      }

      // Pre-populate with invoice data
      setEditingItem({
        id: "",
        tipo,
        estatus: "borrador",
        clienteId: selectedInvoice.clienteId,
        clienteNombre: selectedInvoice.clienteNombre,
        salesOrderId: selectedInvoice.salesOrderId,
        invoiceId: selectedInvoice.id,
        invoiceFolio: selectedInvoice.folio,
        invoiceUuid: selectedInvoice.uuid,
      })
    } else {
      // For regular invoices, clear selected invoice
      setSelectedInvoice(null)
      setEditingItem({
        id: "",
        tipo,
        estatus: "borrador",
      })
    }

    setDialogOpen(true)
  }

  const openEdit = (item: CfdiDoc) => {
    setEditingItem(item)
    setDialogOpen(true)
  }

  const openPreview = (item: CfdiDoc) => {
    setPreviewItem(item)
    setPreviewOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Facturacion CFDI</h2>
          <p className="text-sm text-muted-foreground">Gestiona facturas, notas de credito y complementos.</p>
        </div>
        {(activeTab === "nota_credito" || activeTab === "complemento_pago") && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Factura de origen:</label>
            <InvoiceSelector
              selectedInvoice={selectedInvoice}
              onSelect={setSelectedInvoice}
            />
          </div>
        )}
        <Button
          onClick={openNew}
          disabled={(activeTab === "nota_credito" || activeTab === "complemento_pago") && !selectedInvoice}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo {tipoTabs.find(tab => tab.value === activeTab)?.label}
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por folio, cliente o pedido..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos los estatus</option>
              <option value="borrador">Borrador</option>
              <option value="aprobado">Aprobado</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <select
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              value={clienteFilter}
              onChange={(e) => setClienteFilter(e.target.value)}
            >
              <option value="">Todos los clientes</option>
              {customerOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Badge variant="outline">{filteredDocs.length} resultados</Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 justify-center">
          {tipoTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tipoTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-6 text-sm text-muted-foreground">Cargando...</div>
                ) : filteredDocs.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="text-sm text-muted-foreground mb-4">
                      {activeTab === "factura"
                        ? "No hay facturas registradas."
                        : activeTab === "nota_credito"
                        ? "No hay notas de crédito. Selecciona una factura para crear una."
                        : "No hay complementos de pago. Selecciona una factura para crear uno."}
                    </div>
                    {activeTab === "factura" && (
                      <Button onClick={openNew}>
                        <Plus className="w-4 h-4 mr-2" />
                        Crear primera factura
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-white/10">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="h-9">Cliente</TableHead>
                          <TableHead className="h-9">Folio</TableHead>
                          <TableHead className="h-9">Factura Origen</TableHead>
                          <TableHead className="h-9">Estatus</TableHead>
                          <TableHead className="h-9">Total</TableHead>
                          <TableHead className="h-9">Pedido</TableHead>
                          <TableHead className="h-9 text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDocs.map((doc) => (
                          <TableRow key={doc.id} className="h-12">
                            <TableCell className="py-2 font-medium">{doc.clienteNombre || "Sin cliente"}</TableCell>
                            <TableCell className="py-2">{doc.folio || doc.serie ? `${doc.serie || ""}${doc.folio || ""}`.trim() || "-" : "-"}</TableCell>
                            <TableCell className="py-2">
                              {doc.tipo !== "factura" && (doc.invoiceFolio || doc.invoiceUuid) ?
                                (doc.invoiceFolio || doc.invoiceUuid) : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{statusLabels[doc.estatus] || doc.estatus}</Badge>
                            </TableCell>
                            <TableCell className="py-2">
                              {(doc.total || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                            </TableCell>
                            <TableCell className="py-2">{doc.salesOrderId || "-"}</TableCell>
                            <TableCell className="py-2 text-right">
                              <div className="flex justify-end gap-1">
                                <Button size="icon" variant="ghost" onClick={() => openPreview(doc)} title="Vista previa">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => openEdit(doc)}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => remove(doc.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Historial por cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {clienteFilter ? (
            clientHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay historial para este cliente.</p>
            ) : (
              clientHistory.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{doc.tipo}</p>
                      <p className="text-xs text-muted-foreground">{doc.folio || doc.serie || "Sin folio"}</p>
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
        title={editingItem?.id ? "Editar CFDI" : "Nuevo CFDI"}
        description={
          editingItem?.tipo === "nota_credito"
            ? "Crea una nota de crédito vinculada a la factura seleccionada."
            : editingItem?.tipo === "complemento_pago"
            ? "Registra un complemento de pago para la factura seleccionada."
            : "Registra facturas, notas de credito, cancelaciones y complementos."
        }
        fields={fields}
        initialValues={editingItem || { tipo: activeTab, estatus: "borrador" }}
        onSubmit={handleSave}
      />

      <DocumentPreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        documentType="cfdi"
        cfdi={previewItem}
      />
    </div>
  )
}
