"use client"

import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Edit,
  FileText,
  TrendingUp,
  Calendar,
  AlertTriangle,
  DollarSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

type ClientDetailData = {
  // Campos fiscales/contacto opcionales mostrados en el detalle
  razonSocial?: string
  regimenFiscal?: string
  usoCfdi?: string
  codigoPostal?: string
  correosFacturacion?: string
  telefonos?: string
  direccionFiscal?: string
  historialCambiosFiscales?: string
  city?: string
  state?: string
  id?: string
  name?: string
  rfc?: string
  email?: string
  phone?: string
  address?: string
  status?: string
  creditLimit?: number
  balance?: number
  creditDays?: number
  clientType?: string
  priceType?: string
  tags?: string[]
  notes?: string
}

interface ClientDetailProps {
  client: ClientDetailData | null
  onBack: () => void
  onEdit: (client: ClientDetailData) => void
}

export function ClientDetail({ client, onBack, onEdit }: ClientDetailProps) {
  if (!client) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Cliente no encontrado</p>
      </div>
    )
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount)

  const statusMap: Record<string, { label: string; className: string }> = {
    active: { label: "Activo", className: "bg-[#24A148] text-white hover:bg-[#24A148]/90" },
    prospecto: { label: "Prospecto", className: "bg-[#F1C21B] text-[#1A1D1F] hover:bg-[#F1C21B]/90" },
    inactive: { label: "Inactivo", className: "bg-[#6F7780] text-white hover:bg-[#6F7780]/90" },
    vip: { label: "VIP", className: "bg-[#0F62FE] text-white hover:bg-[#0F62FE]/90" },
  }

  const status = client.status || "prospecto"
  const statusBadge = statusMap[status] || statusMap.prospecto

  const creditLimit = client.creditLimit ?? 0
  const currentBalance = client.balance ?? 0
  const creditPercentage = creditLimit > 0 ? (currentBalance / creditLimit) * 100 : 0

  const riskLevel =
    creditPercentage >= 90 ? "Alto" : creditPercentage >= 75 ? "Medio" : "Bajo"
  const riskBadgeMap: Record<string, string> = {
    Bajo: "bg-[#24A148] text-white",
    Medio: "bg-[#F1C21B] text-[#1A1D1F]",
    Alto: "bg-[#DA1E28] text-white",
  }

  const historyItems =
    currentBalance !== 0
      ? [
          {
            type: "Saldo",
            date: new Date().toISOString(),
            description: "Saldo actual del cliente",
            amount: currentBalance,
            icon: DollarSign,
            color: "text-[#24A148]",
          },
        ]
      : []

  const notes = client.notes
    ? [
        {
          id: 1,
          user: "Equipo",
          date: "Reciente",
          content: client.notes,
        },
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{client.name || "Cliente"}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {client.clientType === "persona" ? "Persona" : "Empresa"} · RFC: {client.rfc || "N/A"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Informacion General</CardTitle>
                <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm">{client.email || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Telefono</p>
                    <p className="text-sm">{client.phone || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Direccion</p>
                    <p className="text-sm">{client.address || "N/A"}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold mb-3">Datos fiscales</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Nombre comercial</p>
                    <p className="text-sm font-medium">{client.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Razon social</p>
                    <p className="text-sm font-medium">{client.razonSocial || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">RFC</p>
                    <p className="text-sm font-medium">{client.rfc || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Regimen fiscal</p>
                    <p className="text-sm font-medium">{client.regimenFiscal || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Uso CFDI</p>
                    <p className="text-sm font-medium">{client.usoCfdi || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Codigo postal</p>
                    <p className="text-sm font-medium">{client.codigoPostal || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Correos para facturacion</p>
                    <p className="text-sm font-medium">{client.correosFacturacion || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telefonos</p>
                    <p className="text-sm font-medium">{client.telefonos || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Direccion fiscal</p>
                    <p className="text-sm font-medium">{client.direccionFiscal || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Historial cambios fiscales</p>
                    <p className="text-sm font-medium">{client.historialCambiosFiscales || "N/A"}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold mb-3">Condiciones Comerciales</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Tipo de Precio</p>
                    <p className="text-sm font-medium">{client.priceType || "Menudeo"}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Dias de Credito</p>
                    <p className="text-sm font-medium">{client.creditDays ?? 0} dias</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Limite de Credito</p>
                    <p className="text-sm font-medium">{formatCurrency(creditLimit)}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Saldo Actual</p>
                    <p className="text-sm font-medium text-[#F1C21B]">{formatCurrency(currentBalance)}</p>
                    <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`${creditPercentage > 80 ? "bg-[#F1C21B]" : "bg-[#24A148]"} h-full`}
                        style={{ width: `${Math.min(creditPercentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{creditPercentage.toFixed(1)}% utilizado</p>
                  </div>
                </div>
              </div>

              <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => onEdit(client)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar Cliente
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="resumen" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-muted">
              <TabsTrigger value="resumen">Resumen</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
              <TabsTrigger value="notas">Notas</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
            </TabsList>

            <TabsContent value="resumen" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Ventas Totales</p>
                        <p className="text-2xl font-semibold mt-1">{formatCurrency(0)}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Ticket Promedio</p>
                        <p className="text-2xl font-semibold mt-1">{formatCurrency(0)}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-[#24A148]/10 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-[#24A148]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Ultima Compra</p>
                        <p className="text-2xl font-semibold mt-1">N/A</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-[#8A3FFC]/10 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-[#8A3FFC]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Frecuencia</p>
                        <p className="text-2xl font-semibold mt-1">N/A</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-[#F1C21B]/10 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-[#F1C21B]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Indicador de Riesgo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Nivel de riesgo crediticio actual</p>
                      <Badge className={riskBadgeMap[riskLevel]}>{riskLevel}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Credito disponible</p>
                      <p
                        className={`text-lg font-semibold ${
                          currentBalance > creditLimit ? "text-[#DA1E28]" : "text-[#24A148]"
                        }`}
                      >
                        {formatCurrency(creditLimit - currentBalance)}
                      </p>
                    </div>
                  </div>
                  {creditLimit > 0 && currentBalance > creditLimit && (
                    <div className="mt-4 p-3 bg-[#DA1E28]/10 border border-[#DA1E28]/30 rounded-lg flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-[#DA1E28] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-[#DA1E28]">Credito Excedido</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          El cliente ha superado su limite de credito.
                        </p>
                      </div>
                    </div>
                  )}
                  {creditLimit > 0 && currentBalance / creditLimit > 0.8 && currentBalance <= creditLimit && (
                    <div className="mt-4 p-3 bg-[#F1C21B]/10 border border-[#F1C21B]/30 rounded-lg flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-[#F1C21B] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-[#1A1D1F]">Cerca del Limite</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          El cliente esta usando mas del 80% del credito.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="historial" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Timeline de Actividad</CardTitle>
                </CardHeader>
                <CardContent>
                  {historyItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin actividad registrada.</p>
                  ) : (
                    <div className="space-y-4">
                      {historyItems.map((item, idx) => {
                        const Icon = item.icon
                        return (
                          <div key={idx} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                                <Icon className={`w-5 h-5 ${item.color}`} />
                              </div>
                              {idx < historyItems.length - 1 && (
                                <div className="w-0.5 h-12 bg-border mt-2" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">{item.type}</p>
                                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(item.date).toLocaleDateString("es-MX", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </p>
                                </div>
                                {item.amount !== null && (
                                  <p
                                    className={`font-semibold ${
                                      item.amount > 0 ? "text-[#24A148]" : "text-[#0F62FE]"
                                    }`}
                                  >
                                    {item.amount > 0 ? "+" : ""}
                                    {formatCurrency(Math.abs(item.amount))}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notas" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Agregar Nota</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea placeholder="Escribe una nota sobre este cliente..." className="min-h-[100px]" />
                  <Button className="w-full bg-primary hover:bg-primary/90">Guardar Nota</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notas Anteriores</CardTitle>
                </CardHeader>
                <CardContent>
                  {notes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin notas registradas.</p>
                  ) : (
                    <div className="space-y-4">
                      {notes.map((note) => (
                        <div key={note.id} className="border-l-2 border-primary pl-4 py-2">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium">{note.user}</p>
                            <p className="text-xs text-muted-foreground">{note.date}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documentos" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Documentos del Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "Factura FAC-001234.pdf", date: "10 Ene 2025", size: "245 KB" },
                      { name: "Cotizacion COT-5678.pdf", date: "05 Ene 2025", size: "189 KB" },
                      { name: "Contrato Marco.pdf", date: "15 Dic 2024", size: "1.2 MB" },
                    ].map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.date} · {doc.size}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          Descargar
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
