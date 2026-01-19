"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building2, User, Calendar, MapPin, CreditCard, Receipt, QrCode } from "lucide-react"

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
  pacStatus?: string
  satStatus?: string
  xmlUrl?: string
  pdfUrl?: string
  invoiceId?: string
  invoiceFolio?: string
  invoiceUuid?: string
  paymentAmount?: number
  paymentMethod?: string
  paymentDate?: any
  createdAt?: any
}

interface CfdiPreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cfdi: CfdiDoc | null
}

export function CfdiPreview({ open, onOpenChange, cfdi }: CfdiPreviewProps) {
  if (!cfdi) return null

  const isTimbrado = cfdi.uuid && cfdi.estatus === "aprobado"
  const tipoComprobante = {
    factura: "I - Ingreso",
    nota_credito: "E - Egreso",
    complemento_pago: "P - Pago"
  }[cfdi.tipo]

  const metodoPago = cfdi.tipo === "complemento_pago" ? "PPD" : "PUE"
  const formaPago = cfdi.paymentMethod || "01" // Transferencia

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white text-black">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-bold">
            Vista Previa CFDI - {tipoComprobante}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-6 bg-white">
          {/* Emisor Section */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-5 h-5" />
                <h3 className="font-semibold text-lg">Emisor</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>RFC:</strong> XAXX010101000</p>
                  <p><strong>Nombre:</strong> EMPRESA DEMO S.A. DE C.V.</p>
                  <p><strong>Régimen Fiscal:</strong> 601 - General de Ley Personas Morales</p>
                </div>
                <div>
                  <p><strong>Dirección:</strong> Calle Principal 123</p>
                  <p><strong>Código Postal:</strong> 01234</p>
                  <p><strong>Lugar de Expedición:</strong> Ciudad de México, CDMX</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Receptor Section */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5" />
                <h3 className="font-semibold text-lg">Receptor</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>RFC:</strong> {cfdi.clienteId || "XAXX010101000"}</p>
                  <p><strong>Nombre:</strong> {cfdi.clienteNombre || "Cliente Demo"}</p>
                  <p><strong>Uso CFDI:</strong> G01 - Adquisición de mercancías</p>
                </div>
                <div>
                  <p><strong>Dirección:</strong> -</p>
                  <p><strong>Código Postal:</strong> -</p>
                  <p><strong>Régimen Fiscal:</strong> 601 - General de Ley Personas Morales</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datos Generales */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Receipt className="w-5 h-5" />
                <h3 className="font-semibold text-lg">Datos del Comprobante</h3>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p><strong>Serie/Folio:</strong> {cfdi.serie || ""}{cfdi.folio || "Sin folio"}</p>
                  <p><strong>Fecha:</strong> {cfdi.createdAt ? new Date(cfdi.createdAt.seconds * 1000).toLocaleDateString('es-MX') : new Date().toLocaleDateString('es-MX')}</p>
                </div>
                <div>
                  <p><strong>Tipo de Comprobante:</strong> {tipoComprobante}</p>
                  <p><strong>Moneda:</strong> MXN</p>
                </div>
                <div>
                  <p><strong>Método de Pago:</strong> {metodoPago}</p>
                  <p><strong>Forma de Pago:</strong> {formaPago} - {formaPago === "01" ? "Efectivo" : "Transferencia"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conceptos Table */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-3">Conceptos</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clave</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Precio Unitario</TableHead>
                    <TableHead>Importe</TableHead>
                    <TableHead>IVA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>01010101</TableCell>
                    <TableCell>Servicios profesionales</TableCell>
                    <TableCell>1.00</TableCell>
                    <TableCell>Servicio</TableCell>
                    <TableCell>${(cfdi.subtotal || 0).toFixed(2)}</TableCell>
                    <TableCell>${(cfdi.subtotal || 0).toFixed(2)}</TableCell>
                    <TableCell>${(cfdi.iva || 0).toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Totales */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${(cfdi.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA 16%:</span>
                    <span>${(cfdi.iva || 0).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>${(cfdi.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timbre Fiscal */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <QrCode className="w-5 h-5" />
                <h3 className="font-semibold text-lg">Timbre Fiscal Digital</h3>
              </div>

              {isTimbrado ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>UUID:</strong></p>
                      <p className="font-mono text-xs break-all">{cfdi.uuid}</p>
                    </div>
                    <div>
                      <p><strong>Fecha de Timbrado:</strong></p>
                      <p>{cfdi.createdAt ? new Date(cfdi.createdAt.seconds * 1000).toLocaleString('es-MX') : "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <div className="w-32 h-32 border-2 border-gray-300 flex items-center justify-center">
                      <QrCode className="w-16 h-16 text-gray-400" />
                      <span className="text-xs text-gray-500 ml-2">QR</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600">
                    <p><strong>Sello Digital del CFDI:</strong></p>
                    <p className="font-mono break-all bg-gray-50 p-2 rounded">
                      [Sello digital del CFDI aparecería aquí]
                    </p>
                  </div>

                  <div className="text-xs text-gray-600">
                    <p><strong>Sello del SAT:</strong></p>
                    <p className="font-mono break-all bg-gray-50 p-2 rounded">
                      [Sello del SAT aparecería aquí]
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    BORRADOR - SIN TIMBRAR
                  </Badge>
                  <p className="text-sm text-gray-500 mt-2">
                    Este documento aún no ha sido timbrado por el SAT
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Info for Credit Notes and Payment Complements */}
          {cfdi.tipo === "nota_credito" && cfdi.invoiceFolio && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Relacionado con Factura</h4>
                <p className="text-sm">Factura origen: {cfdi.invoiceFolio}</p>
              </CardContent>
            </Card>
          )}

          {cfdi.tipo === "complemento_pago" && cfdi.invoiceFolio && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-5 h-5" />
                  <h4 className="font-semibold">Complemento de Pago</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Factura:</strong> {cfdi.invoiceFolio}</p>
                    <p><strong>Monto del Pago:</strong> ${(cfdi.paymentAmount || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p><strong>Método:</strong> {cfdi.paymentMethod || "Transferencia"}</p>
                    <p><strong>Fecha:</strong> {cfdi.paymentDate ? new Date(cfdi.paymentDate.seconds * 1000).toLocaleDateString('es-MX') : "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}