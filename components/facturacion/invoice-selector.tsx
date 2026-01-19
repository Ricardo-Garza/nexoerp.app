"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Check } from "lucide-react"
import { useFirestore } from "@/hooks/use-firestore"
import { COLLECTIONS } from "@/lib/firestore"
import { where } from "firebase/firestore"

type CfdiDoc = {
  id: string
  tipo: "factura" | "nota_credito" | "complemento_pago"
  estatus: "borrador" | "aprobado" | "cancelado"
  uuid?: string
  folio?: string
  serie?: string
  clienteId?: string
  clienteNombre?: string
  salesOrderId?: string
  total?: number
  createdAt?: any
}

type Customer = {
  id: string
  name?: string
  rfc?: string
}

interface InvoiceSelectorProps {
  onSelect: (invoice: CfdiDoc) => void
  selectedInvoice?: CfdiDoc | null
  trigger?: React.ReactNode
}

export function InvoiceSelector({ onSelect, selectedInvoice, trigger }: InvoiceSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const { items: invoices, loading } = useFirestore<CfdiDoc>(COLLECTIONS.cfdi, [
    where("tipo", "==", "factura"),
    where("estatus", "==", "aprobado")
  ], true)
  const { items: customers } = useFirestore<Customer>(COLLECTIONS.customers, [], true)

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const searchLower = search.toLowerCase()
      return (
        invoice.folio?.toLowerCase().includes(searchLower) ||
        invoice.clienteNombre?.toLowerCase().includes(searchLower) ||
        invoice.salesOrderId?.toLowerCase().includes(searchLower) ||
        invoice.serie?.toLowerCase().includes(searchLower)
      )
    })
  }, [invoices, search])

  const handleSelect = (invoice: CfdiDoc) => {
    onSelect(invoice)
    setOpen(false)
  }

  const defaultTrigger = (
    <Button variant="outline" className="w-full">
      {selectedInvoice ? `Factura: ${selectedInvoice.folio || selectedInvoice.serie || "Sin folio"}` : "Seleccionar factura"}
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Seleccionar Factura</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por folio, cliente o pedido..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Cargando facturas...</div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No se encontraron facturas aprobadas.
              </div>
            ) : (
              filteredInvoices.map((invoice) => (
                <Card
                  key={invoice.id}
                  className={`cursor-pointer transition-all hover:bg-muted/50 ${
                    selectedInvoice?.id === invoice.id ? "ring-2 ring-primary bg-primary/5" : ""
                  }`}
                  onClick={() => handleSelect(invoice)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {invoice.folio || invoice.serie ? `${invoice.serie || ""}${invoice.folio || ""}`.trim() : "Sin folio"}
                          </span>
                          {selectedInvoice?.id === invoice.id && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>Cliente: {invoice.clienteNombre || "Sin cliente"}</div>
                          <div>Pedido: {invoice.salesOrderId || "Sin pedido"}</div>
                          <div>
                            Total: {(invoice.total || 0).toLocaleString("es-MX", {
                              style: "currency",
                              currency: "MXN"
                            })}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-4">
                        Aprobada
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}