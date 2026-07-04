"use client"

import { useState } from "react"
import { useData } from "@/hooks/use-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FormDialog } from "@/components/ui/form-dialog"
import {
  ShoppingBag,
  FileText,
  CheckCircle,
  Clock,
  Search,
  Plus,
  Upload,
  Download,
  Users,
  Package,
  TrendingUp,
} from "lucide-react"

const stats = [
  {
    name: "Requisiciones Activas",
    value: "28",
    change: "+5",
    icon: FileText,
  },
  {
    name: "Proveedores Registrados",
    value: "45",
    change: "+8",
    icon: Users,
  },
  {
    name: "Órdenes Procesadas",
    value: "156",
    change: "+23",
    icon: Package,
  },
  {
    name: "Ahorro del Mes",
    value: "$18,500",
    change: "+12%",
    icon: TrendingUp,
  },
]

const initialRequisitions = [
  {
    id: "REQ-001",
    description: "Materia Prima A",
    department: "Producción",
    quantity: 500,
    requestedBy: "Juan Pérez",
    date: "2024-01-15",
    status: "pending",
  },
  {
    id: "REQ-002",
    description: "Material de Empaque",
    department: "Almacén",
    quantity: 200,
    requestedBy: "María González",
    date: "2024-01-14",
    status: "approved",
  },
  {
    id: "REQ-003",
    description: "Refacciones",
    department: "Mantenimiento",
    quantity: 50,
    requestedBy: "Carlos López",
    date: "2024-01-14",
    status: "processing",
  },
  {
    id: "REQ-004",
    description: "Suministros de Oficina",
    department: "Administración",
    quantity: 100,
    requestedBy: "Ana Martínez",
    date: "2024-01-13",
    status: "completed",
  },
]

const supplierBids = [
  {
    requisition: "REQ-001",
    supplier: "Proveedor Alpha",
    price: 15000,
    deliveryDays: 7,
    rating: 4.5,
    status: "active",
  },
  {
    requisition: "REQ-001",
    supplier: "Proveedor Beta",
    price: 14200,
    deliveryDays: 10,
    rating: 4.2,
    status: "active",
  },
  {
    requisition: "REQ-001",
    supplier: "Proveedor Gamma",
    price: 16500,
    deliveryDays: 5,
    rating: 4.8,
    status: "active",
  },
]

const statusConfig = {
  pending: { label: "Pendiente", variant: "secondary" as const },
  approved: { label: "Aprobada", variant: "default" as const },
  processing: { label: "En Proceso", variant: "default" as const },
  completed: { label: "Completada", variant: "outline" as const },
}

export default function EProcurementPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("requisitions")
  const {
    items: requisitions,
    addItem: addRequisition,
    updateItem: updateRequisition,
    deleteItem: deleteRequisition,
  } = useData("eprocurement-requisitions", initialRequisitions)
  const [isRequisitionDialogOpen, setIsRequisitionDialogOpen] = useState(false)
  const [editingRequisition, setEditingRequisition] = useState<any>(null)

  const tabs = [
    { id: "requisitions", label: "Requisiciones" },
    { id: "bids", label: "Cotizaciones" },
    { id: "orders", label: "Órdenes de Compra" },
    { id: "suppliers", label: "Portal Proveedores" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
<Button
          onClick={() => {
            setEditingRequisition(null)
            setIsRequisitionDialogOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Requisición
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <Badge variant="outline" className="text-green-600">
                  {stat.change}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">{stat.name}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 border-b overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "requisitions" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Requisiciones de Compra</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Importar
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar requisiciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">ID</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Descripción</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Departamento</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Cantidad</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Solicitante</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Fecha</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Estado</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {requisitions.map((req) => (
                    <tr key={req.id} className="border-b last:border-0">
                      <td className="py-3 px-2 text-sm font-medium">{req.id}</td>
                      <td className="py-3 px-2 text-sm">{req.description}</td>
                      <td className="py-3 px-2 text-sm">{req.department}</td>
                      <td className="py-3 px-2 text-sm">{req.quantity}</td>
                      <td className="py-3 px-2 text-sm">{req.requestedBy}</td>
                      <td className="py-3 px-2 text-sm text-muted-foreground">{req.date}</td>
                      <td className="py-3 px-2">
                        <Badge variant={statusConfig[req.status as keyof typeof statusConfig].variant}>
                          {statusConfig[req.status as keyof typeof statusConfig].label}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingRequisition(req)
                            setIsRequisitionDialogOpen(true)
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`¿Eliminar requisición ${req.id}?`)) {
                              deleteRequisition(req.id)
                            }
                          }}
                        >
                          Eliminar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "bids" && (
        <Card>
          <CardHeader>
            <CardTitle>Cotizaciones de Proveedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {supplierBids.map((bid, index) => (
                <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{bid.supplier}</h4>
                          <Badge variant="outline">★ {bid.rating}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Requisición: {bid.requisition}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">${bid.price.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{bid.deliveryDays} días entrega</p>
                    </div>
                    <Button>Aceptar</Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Sistema de Cotización Automatizado</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Los proveedores pueden enviar sus cotizaciones directamente desde el portal, facilitando la
                    comparación y selección.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "orders" && (
        <Card>
          <CardHeader>
            <CardTitle>Órdenes de Compra Generadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Las órdenes de compra se generan automáticamente al aceptar una cotización
              </p>
              <Button className="mt-4">Ver Historial de Órdenes</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "suppliers" && (
        <Card>
          <CardHeader>
            <CardTitle>Portal de Proveedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold">Acceso para Proveedores</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Cada proveedor recibe credenciales de acceso para ver requisiciones, enviar cotizaciones y dar
                    seguimiento a órdenes.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold">Cotización en Línea</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Los proveedores pueden enviar cotizaciones directamente desde el portal con precios, tiempos de
                    entrega y condiciones.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold">Seguimiento en Tiempo Real</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Visibilidad completa del estado de órdenes de compra y seguimiento de entregas programadas.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                      <Download className="w-5 h-5 text-orange-600" />
                    </div>
                    <h3 className="font-semibold">Documentos Digitales</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Descarga de órdenes de compra, facturas y documentos relacionados directamente desde el portal.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm font-medium mb-2">Beneficios del E-Procurement</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Reducción de tiempos de cotización hasta 80%
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Comparación automática de ofertas
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Trazabilidad completa del proceso
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Ahorro promedio de 15-20% en costos de compra
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <FormDialog
        open={isRequisitionDialogOpen}
        onOpenChange={setIsRequisitionDialogOpen}
        title={editingRequisition ? "Editar Requisición" : "Nueva Requisición"}
        fields={[
          { name: "description", label: "Descripción", type: "text", required: true },
          { name: "department", label: "Departamento", type: "text", required: true },
          { name: "quantity", label: "Cantidad", type: "number", required: true },
          { name: "requestedBy", label: "Solicitado por", type: "text", required: true },
        ]}
        initialData={editingRequisition}
        onSubmit={(data) => {
          if (editingRequisition) {
            updateRequisition(editingRequisition.id, data)
          } else {
            addRequisition({
              ...(data as any),
              id: `REQ-${String(requisitions.length + 1).padStart(3, "0")}`,
              date: new Date().toISOString().split("T")[0],
              status: "pending",
            })
          }
          setIsRequisitionDialogOpen(false)
        }}
      />
    </div>
  )
}
