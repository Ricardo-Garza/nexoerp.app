"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { MapPin, Download } from "lucide-react"
import type { BIQuery } from "@/lib/types"

interface MapsTabProps {
  queries: BIQuery[]
  getDataSource: (collection: string, filters?: any) => Promise<any[]>
  onCreateExport: (exportConfig: any) => Promise<void>
}

export function MapsTab({ queries, getDataSource, onCreateExport }: MapsTabProps) {
  const [selectedQuery, setSelectedQuery] = useState("")
  const [loading, setLoading] = useState(false)

  const handleVisualize = async () => {
    if (!selectedQuery) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Visualización Geográfica</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Visualiza tus datos en mapas interactivos. Ideal para análisis de ventas por región, distribución de
                clientes, rutas de entrega, etc.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Selecciona una consulta</label>
                  <Select value={selectedQuery} onValueChange={setSelectedQuery}>
                    <SelectTrigger>
                      <SelectValue placeholder="Elige una consulta con datos geográficos" />
                    </SelectTrigger>
                    <SelectContent>
                      {queries.map((query) => (
                        <SelectItem key={query.id} value={query.id}>
                          {query.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleVisualize} disabled={!selectedQuery || loading}>
                    <MapPin className="w-4 h-4 mr-2" />
                    {loading ? "Cargando..." : "Visualizar en Mapa"}
                  </Button>
                  <Button variant="outline" disabled={!selectedQuery}>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Selecciona una consulta para visualizar datos en el mapa</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium">Ventas por Estado</p>
            <p className="text-xs text-muted-foreground mt-1">Mapa de calor de ventas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium">Distribución de Clientes</p>
            <p className="text-xs text-muted-foreground mt-1">Ubicación de clientes activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium">Rutas de Entrega</p>
            <p className="text-xs text-muted-foreground mt-1">Optimización de rutas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
