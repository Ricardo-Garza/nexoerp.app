"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Building2, User, Calendar, MapPin, CreditCard, Receipt, QrCode, Send, Eye } from "lucide-react"
import type { SalesOrder, Invoice } from "@/lib/types"
import { formatCurrency } from "@/lib/utils/sales-calculations"

interface DocumentPreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentType: "remision" | "factura" | "cfdi"
  salesOrder?: SalesOrder
  invoice?: Invoice
  cfdi?: any // CFDI document from facturacion module
  onSend?: () => void
}

export function DocumentPreview({
  open,
  onOpenChange,
  documentType,
  salesOrder,
  invoice,
  cfdi,
  onSend
}: DocumentPreviewProps) {
  // Determine document data based on type
  const getDocumentData = () => {
    if (documentType === "cfdi" && cfdi) {
      return {
        tipo: "factura" as const,
        folio: cfdi.folio || cfdi.serie ? `${cfdi.serie || ""}${cfdi.folio || ""}`.trim() : "Sin folio",
        fecha: cfdi.createdAt ? new Date(cfdi.createdAt.seconds * 1000).toLocaleDateString('es-MX') : new Date().toLocaleDateString('es-MX'),
        clienteNombre: cfdi.clienteNombre || "Cliente Demo",
        clienteRFC: cfdi.clienteId || "XAXX010101000",
        subtotal: cfdi.subtotal || 0,
        iva: cfdi.iva || 0,
        total: cfdi.total || 0,
        items: [{ descripcion: "Servicios profesionales", cantidad: 1, precio: cfdi.subtotal || 0, importe: cfdi.subtotal || 0 }],
        uuid: cfdi.uuid,
        estatus: cfdi.estatus
      }
    }

    if (documentType === "factura" && invoice) {
      return {
        tipo: "factura" as const,
        folio: invoice.folio || "Sin folio",
        fecha: invoice.createdAt ? new Date(invoice.createdAt.seconds * 1000).toLocaleDateString('es-MX') : new Date().toLocaleDateString('es-MX'),
        clienteNombre: (invoice as any).customerName || "Cliente",
        clienteRFC: (invoice as any).customerRFC || "XAXX010101000",
        subtotal: invoice.subtotal || 0,
        iva: (invoice as any).taxAmount || 0,
        total: invoice.total || 0,
        items: (invoice as any).lines || [],
        uuid: invoice.uuid,
        estatus: (invoice as any).status
      }
    }

    if (salesOrder) {
      return {
        tipo: documentType,
        folio: (salesOrder as any).orderNumber || "Sin folio",
        fecha: salesOrder.createdAt ? new Date(salesOrder.createdAt.seconds * 1000).toLocaleDateString('es-MX') : new Date().toLocaleDateString('es-MX'),
        clienteNombre: (salesOrder as any).customerName || "Cliente",
        clienteRFC: (salesOrder as any).customerRFC || "XAXX010101000",
        subtotal: (salesOrder as any).subtotal || 0,
        iva: (salesOrder as any).taxTotal || 0,
        total: (salesOrder as any).total || 0,
        items: (salesOrder as any).lines || [],
        uuid: undefined,
        estatus: "borrador"
      }
    }

    return null
  }

  const docData = getDocumentData()
  if (!docData) return null

  const isTimbrado = docData.uuid && docData.estatus === "aprobado"
  const tipoComprobante = documentType === "remision" ? "REMISI\u00d3N" : `FACTURA${documentType === "cfdi" ? " CFDI" : ""}`

  const handleSend = () => {
    // TODO: Implement email sending
    console.log("Send document via email")
    onSend?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white text-black print:max-w-none print:h-auto print:overflow-visible print:shadow-none print:border-none print:bg-white">
        <DialogHeader className="print:hidden">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-center text-lg font-bold">
              Vista Previa - {tipoComprobante}
            </DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSend}>
                <Send className="w-4 h-4 mr-2" />
                Enviar
              </Button>
            </div>
          </div>
          <DialogDescription className="sr-only">
            Vista previa del documento listo para imprimir o enviar.
          </DialogDescription>
        </DialogHeader>

        <DocumentPrintContent documentType={documentType} salesOrder={salesOrder} invoice={invoice} cfdi={cfdi} />
      </DialogContent>
    </Dialog>
  )
}

// Print-only component that renders document content without modal
const mojibakePattern = /[\u00c3\u00c2\uFFFD]/

function normalizeText(value: string): string {
  if (!value) return value
  if (!mojibakePattern.test(value)) return value
  try {
    return decodeURIComponent(escape(value))
  } catch {
    return value
  }
}

export function DocumentPrintContent({
  documentType,
  salesOrder,
  invoice,
  cfdi,
}: {
  documentType: "remision" | "factura" | "cfdi"
  salesOrder?: SalesOrder
  invoice?: Invoice
  cfdi?: any
}) {
  const getDocumentData = () => {
    if (documentType === "cfdi" && cfdi) {
      return {
        tipo: "factura" as const,
        folio: cfdi.folio || cfdi.serie ? `${cfdi.serie || ""}${cfdi.folio || ""}`.trim() : "Sin folio",
        fecha: cfdi.createdAt
          ? new Date(cfdi.createdAt.seconds * 1000).toLocaleDateString("es-MX")
          : new Date().toLocaleDateString("es-MX"),
        clienteNombre: cfdi.clienteNombre || "Cliente Demo",
        clienteRFC: cfdi.clienteId || "XAXX010101000",
        subtotal: cfdi.subtotal || 0,
        iva: cfdi.iva || 0,
        total: cfdi.total || 0,
        items: [
          {
            descripcion: "Servicios profesionales",
            cantidad: 1,
            precio: cfdi.subtotal || 0,
            importe: cfdi.subtotal || 0,
          },
        ],
        uuid: cfdi.uuid,
        estatus: cfdi.estatus,
      }
    }

    if (documentType === "factura" && invoice) {
      return {
        tipo: "factura" as const,
        folio: invoice.folio || "Sin folio",
        fecha: invoice.createdAt
          ? new Date(invoice.createdAt.seconds * 1000).toLocaleDateString("es-MX")
          : new Date().toLocaleDateString("es-MX"),
        clienteNombre: (invoice as any).customerName || "Cliente",
        clienteRFC: (invoice as any).customerRFC || "XAXX010101000",
        subtotal: invoice.subtotal || 0,
        iva: (invoice as any).taxAmount || 0,
        total: invoice.total || 0,
        items: (invoice as any).lines || [],
        uuid: invoice.uuid,
        estatus: (invoice as any).status,
      }
    }

    if (salesOrder) {
      return {
        tipo: documentType,
        folio: (salesOrder as any).orderNumber || "Sin folio",
        fecha: salesOrder.createdAt
          ? new Date(salesOrder.createdAt.seconds * 1000).toLocaleDateString("es-MX")
          : new Date().toLocaleDateString("es-MX"),
        clienteNombre: (salesOrder as any).customerName || "Cliente",
        clienteRFC: (salesOrder as any).customerRFC || "XAXX010101000",
        subtotal: (salesOrder as any).subtotal || 0,
        iva: (salesOrder as any).taxTotal || 0,
        total: (salesOrder as any).total || 0,
        items: (salesOrder as any).lines || [],
        uuid: undefined,
        estatus: "borrador",
      }
    }

    return null
  }

  const docData = getDocumentData()
  if (!docData) return null

  const safeText = (value?: string) => normalizeText(value || "")
  const isTimbrado = docData.uuid && docData.estatus === "aprobado"
  const tipoComprobante =
    documentType === "remision"
      ? "REMISI\u00d3N"
      : `FACTURA${documentType === "cfdi" ? " CFDI" : ""}`

  return (
    <div className="space-y-6 p-6 bg-white text-black print:p-0 print:space-y-4 max-w-4xl mx-auto">
      <div className="text-center border-b-2 border-gray-800 pb-4">
        <h1 className="text-3xl font-bold mb-2">{tipoComprobante}</h1>
        <div className="flex justify-between items-center text-sm">
          <div>
            <p>
              <strong>Folio:</strong> {safeText(docData.folio)}
            </p>
            <p>
              <strong>Fecha:</strong> {safeText(docData.fecha)}
            </p>
          </div>
          <div className="text-right">
            <p>
              <strong>Lugar de Expedici\u00f3n:</strong> Ciudad de M\u00e9xico, CDMX
            </p>
            <p>
              <strong>Hora:</strong> {new Date().toLocaleTimeString("es-MX")}
            </p>
          </div>
        </div>
      </div>

      <Card className="border-2">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-5 h-5" />
            <h3 className="font-semibold text-lg">Emisor</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p>
                <strong>RFC:</strong> XAXX010101000
              </p>
              <p>
                <strong>Nombre:</strong> EMPRESA DEMO S.A. DE C.V.
              </p>
              <p>
                <strong>R\u00e9gimen Fiscal:</strong> 601 - General de Ley Personas Morales
              </p>
            </div>
            <div>
              <p>
                <strong>Domicilio:</strong> Calle Principal 123, Col. Centro
              </p>
              <p>
                <strong>Ciudad:</strong> Ciudad de M\u00e9xico, CDMX, M\u00e9xico
              </p>
              <p>
                <strong>C\u00f3digo Postal:</strong> 06000
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-5 h-5" />
            <h3 className="font-semibold text-lg">Receptor</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p>
                <strong>RFC:</strong> {safeText(docData.clienteRFC)}
              </p>
              <p>
                <strong>Nombre:</strong> {safeText(docData.clienteNombre)}
              </p>
              <p>
                <strong>Uso CFDI:</strong> G01 - Adquisici\u00f3n de mercanc\u00edas
              </p>
            </div>
            <div>
              <p>
                <strong>Domicilio:</strong> Domicilio del cliente
              </p>
              <p>
                <strong>R\u00e9gimen Fiscal:</strong> 601 - General de Ley Personas Morales
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-3">Conceptos</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Cantidad</TableHead>
                <TableHead className="text-left">Descripci\u00f3n</TableHead>
                <TableHead className="text-right">Precio Unitario</TableHead>
                <TableHead className="text-right">Importe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docData.items.map((item: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{item.cantidad || item.quantity || 1}</TableCell>
                  <TableCell>{safeText(item.descripcion || item.description || item.productName || "Producto")}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.precio || item.price || item.unitPrice || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(
                      item.importe ||
                        item.total ||
                        (item.cantidad || item.quantity || 1) * (item.precio || item.price || item.unitPrice || 0),
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardContent className="p-4">
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(docData.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>IVA (16%):</span>
                <span>{formatCurrency(docData.iva)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{formatCurrency(docData.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isTimbrado && (
        <Card className="border-2 border-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Timbrado
              </Badge>
              <span className="text-sm text-gray-600">Esta factura ha sido timbrada por el SAT</span>
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div>
                <strong>UUID:</strong> {safeText(docData.uuid)}
              </div>
              <div>
                <strong>Fecha de Timbrado:</strong> {safeText(docData.fecha)}
              </div>
              <div>
                <strong>Estatus:</strong> {safeText(docData.estatus)}
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <QrCode className="w-24 h-24" />
            </div>
          </CardContent>
        </Card>
      )}

      {documentType === "remision" && (
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm mb-8">
                Recib\u00ed de conformidad la mercanc\u00eda descrita en esta remisi\u00f3n:
              </p>
              <div className="border-b border-black w-64 mx-auto mb-2"></div>
              <p className="text-xs text-gray-600">Nombre y Firma del Receptor</p>
              <p className="text-xs text-gray-600 mt-4">Fecha: ____/____/________</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Helper function to convert numbers to words (simplified)
function numeroALetras(num: number): string {
  // Simplified implementation - in production, use a proper number-to-words library
  const unidades = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"]
  const decenas = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"]
  const centenas = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"]

  if (num === 0) return "cero"

  const entero = Math.floor(num)
  const decimal = Math.round((num - entero) * 100)

  // Simplified conversion for demo
  return `${entero} pesos con ${decimal} centavos`
}





