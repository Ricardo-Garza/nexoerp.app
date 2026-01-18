"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Truck, FileText, AlertCircle, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PostConfirmDialogProps {
  open: boolean
  onClose: () => void
  onSelectRemision: () => void
  onSelectFacturacion: () => void
  orderNumber: string
  isProcessing?: boolean
}

export function PostConfirmDialog({
  open,
  onClose,
  onSelectRemision,
  onSelectFacturacion,
  orderNumber,
  isProcessing = false,
}: PostConfirmDialogProps) {
  const [selectedOption, setSelectedOption] = useState<"remision" | "facturacion" | null>(null)

  const handleConfirm = () => {
    if (selectedOption === "remision") {
      onSelectRemision()
    } else if (selectedOption === "facturacion") {
      onSelectFacturacion()
    }
  }

  const handleClose = () => {
    if (!isProcessing) {
      setSelectedOption(null)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Confirmar Orden de Venta</DialogTitle>
          <DialogDescription>
            Orden {orderNumber} confirmada. Elige el tipo de documento:
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Esta decisión es irreversible y determina el flujo de procesamiento.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-2">
          <Card
            className={`cursor-pointer transition-all ${
              selectedOption === "remision"
                ? "ring-2 ring-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
            onClick={() => !isProcessing && setSelectedOption("remision")}
          >
            <CardContent className="p-6 text-center">
              {selectedOption === "remision" && (
                <Check className="w-6 h-6 mx-auto mb-2 text-primary" />
              )}
              <Truck className="w-12 h-12 mx-auto mb-4 text-blue-500" />
              <h3 className="font-semibold text-lg mb-2">Remisión</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Genera una nota de entrega y descuenta inventario del almacén seleccionado.
                La facturación podrá realizarse posteriormente si es necesario.
              </p>
              <ul className="text-xs text-left space-y-1 text-muted-foreground">
                <li>• Crea registro de entrega</li>
                <li>• Descuenta inventario</li>
                <li>• Actualiza estado a "Entregada"</li>
                <li>• Facturación opcional posterior</li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              selectedOption === "facturacion"
                ? "ring-2 ring-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
            onClick={() => !isProcessing && setSelectedOption("facturacion")}
          >
            <CardContent className="p-6 text-center">
              {selectedOption === "facturacion" && (
                <Check className="w-6 h-6 mx-auto mb-2 text-primary" />
              )}
              <FileText className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h3 className="font-semibold text-lg mb-2">Facturación</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Genera factura electrónica inmediatamente. El inventario se mantendrá
                hasta que se realice la entrega física.
              </p>
              <ul className="text-xs text-left space-y-1 text-muted-foreground">
                <li>• Crea factura CFDI</li>
                <li>• Inventario no se descuenta</li>
                <li>• Actualiza estado a "Facturada"</li>
                <li>• Entrega física posterior</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedOption || isProcessing}
          >
            {isProcessing ? "Procesando..." : "Confirmar Selección"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}