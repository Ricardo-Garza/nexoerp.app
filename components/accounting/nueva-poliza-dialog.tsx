"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import type { JournalEntry, JournalMovement } from "@/lib/types"

interface NuevaPolizaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (entry: any) => Promise<void>
  ledgerAccounts: Array<{ id: string; codigo: string; nombre: string }>
}

export function NuevaPolizaDialog({ open, onOpenChange, onSave, ledgerAccounts }: NuevaPolizaDialogProps) {
  const [loading, setLoading] = useState(false)
  const [tipo, setTipo] = useState<"Diario" | "Ingresos" | "Egresos" | "Ajuste">("Diario")
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0])
  const [concepto, setConcepto] = useState("")
  const [referencia, setReferencia] = useState("")
  const [movimientos, setMovimientos] = useState<JournalMovement[]>([
    { cuentaId: "", cuentaCodigo: "", cuentaNombre: "", tipo: "cargo", monto: 0, referencia: "", notas: "" },
    { cuentaId: "", cuentaCodigo: "", cuentaNombre: "", tipo: "abono", monto: 0, referencia: "", notas: "" },
  ])

  const totalCargos = movimientos.filter((m) => m.tipo === "cargo").reduce((sum, m) => sum + (m.monto || 0), 0)
  const totalAbonos = movimientos.filter((m) => m.tipo === "abono").reduce((sum, m) => sum + (m.monto || 0), 0)
  const diferencia = totalCargos - totalAbonos

  const handleAddMovimiento = () => {
    setMovimientos([
      ...movimientos,
      { cuentaId: "", cuentaCodigo: "", cuentaNombre: "", tipo: "cargo", monto: 0, referencia: "", notas: "" },
    ])
  }

  const handleRemoveMovimiento = (index: number) => {
    setMovimientos(movimientos.filter((_, i) => i !== index))
  }

  const handleUpdateMovimiento = (index: number, field: keyof JournalMovement, value: any) => {
    const updated = [...movimientos]
    updated[index] = { ...updated[index], [field]: value }

    // If cuenta is selected, update codigo and nombre
    if (field === "cuentaId") {
      const account = ledgerAccounts.find((acc) => acc.id === value)
      if (account) {
        updated[index].cuentaCodigo = account.codigo
        updated[index].cuentaNombre = account.nombre
      }
    }

    setMovimientos(updated)
  }

  const handleSubmit = async () => {
    if (!concepto.trim()) {
      alert("El concepto es requerido")
      return
    }

    if (Math.abs(diferencia) > 0.01) {
      alert("La póliza no está balanceada. Los cargos deben ser iguales a los abonos.")
      return
    }

    if (movimientos.length < 2) {
      alert("Se requieren al menos 2 movimientos")
      return
    }

    setLoading(true)
    try {
      const now = new Date()
      const año = now.getFullYear()
      const mes = String(now.getMonth() + 1).padStart(2, "0")
      const folio = `POL-${año}${mes}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`

      await onSave({
        // DTO de póliza (Firestore schemaless)
        folio,
        tipo,
        fecha,
        concepto,
        referencia: referencia || undefined,
        estado: "borrador",
        movimientos,
        totalCargos,
        totalAbonos,
        diferencia,
      })

      // Reset form
      setConcepto("")
      setReferencia("")
      setMovimientos([
        { cuentaId: "", cuentaCodigo: "", cuentaNombre: "", tipo: "cargo", monto: 0, referencia: "", notas: "" },
        { cuentaId: "", cuentaCodigo: "", cuentaNombre: "", tipo: "abono", monto: 0, referencia: "", notas: "" },
      ])
      onOpenChange(false)
    } catch (error) {
      console.error("Error creating journal entry:", error)
      alert("Error al crear la póliza")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Póliza Contable</DialogTitle>
          <DialogDescription>Registra una nueva póliza contable con sus movimientos</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipo">Tipo de Póliza</Label>
              <select
                id="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="Diario">Diario</option>
                <option value="Ingresos">Ingresos</option>
                <option value="Egresos">Egresos</option>
                <option value="Ajuste">Ajuste</option>
              </select>
            </div>
            <div>
              <Label htmlFor="fecha">Fecha</Label>
              <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
          </div>

          <div>
            <Label htmlFor="concepto">Concepto</Label>
            <Textarea
              id="concepto"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder="Descripción de la póliza..."
            />
          </div>

          <div>
            <Label htmlFor="referencia">Referencia (opcional)</Label>
            <Input
              id="referencia"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="No. de factura, documento, etc."
            />
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Movimientos</h3>
              <Button type="button" size="sm" variant="outline" onClick={handleAddMovimiento}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Movimiento
              </Button>
            </div>

            {movimientos.map((mov, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                  <Label className="text-xs">Cuenta</Label>
                  <select
                    value={mov.cuentaId}
                    onChange={(e) => handleUpdateMovimiento(index, "cuentaId", e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    <option value="">Seleccionar...</option>
                    {ledgerAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.codigo} - {acc.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Tipo</Label>
                  <select
                    value={mov.tipo}
                    onChange={(e) => handleUpdateMovimiento(index, "tipo", e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    <option value="cargo">Cargo</option>
                    <option value="abono">Abono</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Monto</Label>
                  <Input
                    type="number"
                    value={mov.monto}
                    onChange={(e) => handleUpdateMovimiento(index, "monto", Number.parseFloat(e.target.value) || 0)}
                    className="text-sm"
                    step="0.01"
                  />
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">Notas</Label>
                  <Input
                    value={mov.notas || ""}
                    onChange={(e) => handleUpdateMovimiento(index, "notas", e.target.value)}
                    className="text-sm"
                    placeholder="Notas..."
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveMovimiento(index)}
                    disabled={movimientos.length <= 2}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="border-t pt-3 mt-3">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Cargos:</span>
                  <span className="font-bold ml-2">${totalCargos.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Abonos:</span>
                  <span className="font-bold ml-2">${totalAbonos.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Diferencia:</span>
                  <span className={`font-bold ml-2 ${Math.abs(diferencia) > 0.01 ? "text-red-600" : "text-green-600"}`}>
                    ${diferencia.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading || Math.abs(diferencia) > 0.01}>
              {loading ? "Guardando..." : "Guardar Póliza"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
