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
import { toast } from "sonner"
import { Loader2, AlertCircle } from "lucide-react"
import { COLLECTIONS } from "@/lib/firestore"
import type { SalesOrder, Delivery, Product } from "@/lib/types"
import { getNextFolio } from "@/lib/utils/folio-generator"
import { serverTimestamp, collection, doc, where, type WithFieldValue } from "firebase/firestore"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { runTransaction } from "firebase/firestore"
import { getFirebaseDb } from "@/lib/firebase"

interface GenerateDeliveryDialogProps {
  salesOrder: SalesOrder
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function GenerateDeliveryDialog({ salesOrder, open, onClose, onSuccess }: GenerateDeliveryDialogProps) {
  const { user } = useAuth()
  const companyId = user?.companyId || ""
  const [generating, setGenerating] = useState(false)
  const [shippingAddress, setShippingAddress] = useState(salesOrder.shippingAddress || "")
  const [notes, setNotes] = useState("")
  const [stockError, setStockError] = useState<string | null>(null)

  const { items: existingDeliveries } = useFirestore<Delivery>(COLLECTIONS.deliveries, [], true)
  const { items: products } = useFirestore<Product>(COLLECTIONS.products, [], true)

  const handleGenerate = async () => {
    setGenerating(true)
    setStockError(null)

    try {
      const db = getFirebaseDb()

      // Validate stock availability
      const productLines = (salesOrder.lines ?? []).filter((l) => l.type === "product" && l.productId)
      const stockErrors: string[] = []

      for (const line of productLines) {
        const product = products.find((p) => p.id === line.productId)
        if (product && (product.stock ?? 0) < (line.quantity || 0)) {
          stockErrors.push(`${product.name}: stock disponible ${product.stock ?? 0}, requerido ${line.quantity}`)
        }
      }

      if (stockErrors.length > 0) {
        setStockError(`Stock insuficiente:\n${stockErrors.join("\n")}`)
        setGenerating(false)
        return
      }

      // Generate delivery and update inventory in a transaction
      await runTransaction(db, async (transaction) => {
        // Generate delivery number
        const existingNumbers = existingDeliveries.map((d) => d.deliveryNumber).filter((n): n is string => Boolean(n))
        const deliveryNumber = getNextFolio(existingNumbers, "R")

        // Create delivery document
        const delivery: WithFieldValue<Omit<Delivery, "id">> = {
          companyId,
          deliveryNumber,
          salesOrderId: salesOrder.id,
          salesOrderNumber: salesOrder.orderNumber,
          status: "ready",
          customerId: salesOrder.customerId,
          customerName: salesOrder.customerName,
          shippingAddress: shippingAddress || salesOrder.shippingAddress || "",
          deliveryDate: serverTimestamp(),
          lines: salesOrder.lines,
          notes,
          inventoryProcessed: true,
          inventoryProcessedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }

        // We can't use addItem in transaction, need to use set directly
        const deliveryRef = doc(collection(db, COLLECTIONS.deliveries))
        transaction.set(deliveryRef, delivery)

        // Update product stock
        for (const line of productLines) {
          if (line.productId) {
            const productRef = doc(db, COLLECTIONS.products, line.productId)
            const productDoc = await transaction.get(productRef)

            if (productDoc.exists()) {
              const currentStock = productDoc.data()?.stock || 0
              const newStock = currentStock - (line.quantity || 0)
              transaction.update(productRef, {
                stock: newStock,
                updatedAt: serverTimestamp(),
              })
            }
          }
        }

        // Update sales order
        const orderRef = doc(db, COLLECTIONS.salesOrders, salesOrder.id)
        const currentDeliveryIds = salesOrder.deliveryIds || []
        transaction.update(orderRef, {
          deliveryIds: [...currentDeliveryIds, deliveryRef.id],
          status: "in_progress",
          updatedAt: serverTimestamp(),
        })

        // Log activity
        const activityRef = doc(collection(db, COLLECTIONS.salesOrderActivities))
        transaction.set(activityRef, {
          salesOrderId: salesOrder.id,
          companyId,
          timestamp: serverTimestamp(),
          userId: user?.uid,
          userName: user?.email || "Unknown",
          action: "delivered",
          description: `Remisión ${deliveryNumber} generada`,
        })
      })

      toast.success("Remisión generada correctamente e inventario actualizado")
      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (error) {
      console.error("[GenerateDeliveryDialog] Error:", error)
      toast.error("Error al generar la remisión")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generar Remisión</DialogTitle>
          <DialogDescription>Crear documento de entrega para la orden {salesOrder.orderNumber}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {stockError && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="whitespace-pre-line">{stockError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Cliente</Label>
            <Input value={salesOrder.customerName} disabled />
          </div>

          <div className="space-y-2">
            <Label>Dirección de Entrega</Label>
            <Textarea
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              rows={3}
              placeholder="Dirección completa de entrega..."
            />
          </div>

          <div className="space-y-2">
            <Label>Notas de Entrega</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Instrucciones especiales, horario de entrega, etc..."
            />
          </div>

          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Al generar la remisión, las existencias en inventario se descontarán automáticamente. Esta acción no se
              puede deshacer.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={generating}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={generating || !shippingAddress}>
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              "Generar Remisión"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
