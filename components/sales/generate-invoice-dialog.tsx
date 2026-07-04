"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useFirestore } from "@/hooks/use-firestore"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, AlertCircle } from "lucide-react"
import { COLLECTIONS, addItem, updateItem } from "@/lib/firestore"
import type { SalesOrder, Invoice } from "@/lib/types"
import { getNextFolio } from "@/lib/utils/folio-generator"
import { serverTimestamp, type WithFieldValue} from "firebase/firestore"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface GenerateInvoiceDialogProps {
  salesOrder: SalesOrder
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function GenerateInvoiceDialog({ salesOrder, open, onClose, onSuccess }: GenerateInvoiceDialogProps) {
  const { user } = useAuth()
  const companyId = user?.companyId || ""
  const [generating, setGenerating] = useState(false)
  const [customerRFC, setCustomerRFC] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [metodoPago, setMetodoPago] = useState("PUE")
  const [notes, setNotes] = useState("")

  const { items: existingInvoices } = useFirestore<Invoice>(COLLECTIONS.salesInvoices, [], true)

  const handleGenerate = async () => {
    if (!customerRFC) {
      toast.error("El RFC del cliente es obligatorio")
      return
    }

    setGenerating(true)

    try {
      // Generate invoice number
      const existingNumbers = existingInvoices.map((i) => i.invoiceNumber).filter((n): n is string => Boolean(n))
      const invoiceNumber = getNextFolio(existingNumbers, "F")

      // Calculate due date based on payment terms
      const dueDate = new Date()
      if (salesOrder.paymentTerms) {
        const days = Number.parseInt(salesOrder.paymentTerms) || 30
        dueDate.setDate(dueDate.getDate() + days)
      }

      // Create invoice
      const invoice: WithFieldValue<Omit<Invoice, "id">> = {
        companyId,
        invoiceNumber,
        salesOrderId: salesOrder.id,
        salesOrderNumber: salesOrder.orderNumber,
        status: "pending",
        customerId: salesOrder.customerId,
        customerName: salesOrder.customerName,
        customerRFC,
        customerEmail,
        invoiceDate: serverTimestamp(),
        dueDate: dueDate.toISOString(),
        paymentTerms: salesOrder.paymentTerms,
        paymentMethod: salesOrder.paymentMethod || "",
        paymentStatus: "unpaid",
        amountPaid: 0,
        cfdiUse: salesOrder.cfdiUse || "G03",
        metodoPago,
        formaPago: salesOrder.paymentMethod || "",
        lines: salesOrder.lines,
        subtotal: salesOrder.subtotal,
        taxTotal: (salesOrder.taxTotal ?? 0),
        discountTotal: salesOrder.discountTotal,
        total: salesOrder.total,
        currency: salesOrder.currency,
        exchangeRate: salesOrder.exchangeRate,
        notes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const created = await addItem(COLLECTIONS.salesInvoices, invoice as Omit<Invoice, 'id'>)

      await addItem(COLLECTIONS.cfdi, {
        tipo: "factura",
        estatus: "borrador",
        clienteId: salesOrder.customerId,
        clienteNombre: salesOrder.customerName,
        vendedor: user?.email || "",
        salesOrderId: salesOrder.id,
        subtotal: salesOrder.subtotal,
        iva: (salesOrder.taxTotal ?? 0),
        total: salesOrder.total,
        facturacionTipo: "parcial",
        montoFacturado: salesOrder.total,
        companyId,
      })

      // Update sales order
      const currentInvoiceIds = salesOrder.invoiceIds || []
      await updateItem(COLLECTIONS.salesOrders, salesOrder.id, {
        invoiceIds: [...currentInvoiceIds, created.id],
        status: "invoiced_partial",
      })

      // Log activity
      await addItem(COLLECTIONS.salesOrderActivities, {
        salesOrderId: salesOrder.id,
        companyId,
        timestamp: serverTimestamp(),
        userId: user?.uid,
        userName: user?.email || "Unknown",
        action: "invoiced_partial",
        description: `CFDI ${invoiceNumber} generado (facturacion parcial)`,
      })

      toast.success("Factura generada correctamente")
      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (error) {
      console.error("[GenerateInvoiceDialog] Error:", error)
      toast.error("Error al generar la factura")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generar Factura</DialogTitle>
          <DialogDescription>Crear factura para la orden {salesOrder.orderNumber}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Esta factura quedará lista para timbrado. Asegúrate de tener configurado tu proveedor de timbrado (PAC).
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Cliente</Label>
            <Input value={salesOrder.customerName} disabled />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 min-w-0">
              <Label>RFC del Cliente *</Label>
              <Input
                value={customerRFC}
                onChange={(e) => setCustomerRFC(e.target.value.toUpperCase())}
                placeholder="XAXX010101000"
                maxLength={13}
                className="w-full min-w-0"
              />
            </div>

            <div className="space-y-2 min-w-0">
              <Label>Email del Cliente</Label>
              <Input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="cliente@example.com"
                className="w-full min-w-0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-2 min-w-0">
              <Label>Método de Pago</Label>
              <Select value={metodoPago} onValueChange={setMetodoPago}>
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUE">PUE - Pago en una sola exhibición</SelectItem>
                  <SelectItem value="PPD">PPD - Pago en parcialidades</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 min-w-0">
              <Label>Forma de Pago</Label>
              <Input value={salesOrder.paymentMethod || ""} disabled className="w-full min-w-0" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Uso CFDI</Label>
            <Input value={salesOrder.cfdiUse || "G03 - Gastos en general"} disabled />
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Notas adicionales para la factura..."
            />
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-medium">${salesOrder.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>IVA:</span>
              <span className="font-medium">${(salesOrder.taxTotal ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>${salesOrder.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={generating}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={generating || !customerRFC}>
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              "Generar Factura"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
