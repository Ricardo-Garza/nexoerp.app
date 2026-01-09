"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Send } from "lucide-react"
import type { BIQuery, BIDashboard } from "@/lib/types"

interface AssistantTabProps {
  onAddQuery: (query: Omit<BIQuery, "id" | "createdAt" | "updatedAt">) => Promise<void>
  onAddDashboard: (dashboard: Omit<BIDashboard, "id" | "createdAt" | "updatedAt">) => Promise<void>
}

export function AssistantTab({ onAddQuery, onAddDashboard }: AssistantTabProps) {
  const [prompt, setPrompt] = useState("")
  const [processing, setProcessing] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    setProcessing(true)
    setTimeout(() => {
      setSuggestions([
        "Consulta sugerida: Ventas del último mes agrupadas por producto",
        "Dashboard sugerido: Panel de KPIs de ventas con gráficas de tendencias",
        "Reporte sugerido: Análisis de rentabilidad por cliente",
      ])
      setProcessing(false)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Asistente de BI con IA</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Describe qué información necesitas analizar y te ayudaré a crear consultas, dashboards y reportes
                automáticamente.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ej: Necesito ver las ventas del último trimestre agrupadas por región y comparadas con el año anterior..."
                  rows={4}
                  className="resize-none"
                />
                <Button type="submit" disabled={!prompt.trim() || processing}>
                  <Send className="w-4 h-4 mr-2" />
                  {processing ? "Procesando..." : "Generar Análisis"}
                </Button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Sugerencias generadas:</h4>
          {suggestions.map((suggestion, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <p className="text-sm">{suggestion}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="border-t pt-6">
        <h4 className="font-medium mb-3">Ejemplos de consultas:</h4>
        <div className="grid gap-3 md:grid-cols-2">
          <Card
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => setPrompt("Ventas totales por producto en el último mes")}
          >
            <CardContent className="p-4">
              <p className="text-sm font-medium">Ventas por Producto</p>
              <p className="text-xs text-muted-foreground mt-1">Ver productos más vendidos</p>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => setPrompt("Comparar ingresos vs gastos por mes")}
          >
            <CardContent className="p-4">
              <p className="text-sm font-medium">Ingresos vs Gastos</p>
              <p className="text-xs text-muted-foreground mt-1">Análisis financiero mensual</p>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => setPrompt("Top 10 clientes por monto total de compras")}
          >
            <CardContent className="p-4">
              <p className="text-sm font-medium">Top Clientes</p>
              <p className="text-xs text-muted-foreground mt-1">Mejores clientes por ventas</p>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => setPrompt("Inventario con stock bajo (menos de 10 unidades)")}
          >
            <CardContent className="p-4">
              <p className="text-sm font-medium">Alertas de Inventario</p>
              <p className="text-xs text-muted-foreground mt-1">Productos con stock crítico</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
