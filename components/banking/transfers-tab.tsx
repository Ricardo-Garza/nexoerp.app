"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Send, Download } from "lucide-react"
import { useFirestore } from "@/hooks/use-firestore"
import { COLLECTIONS } from "@/lib/firestore"
import type { BankTransfer, BankAccount } from "@/lib/types"
import { FormDialog } from "@/components/ui/form-dialog"
import { Badge } from "@/components/ui/badge"
import { Timestamp } from "firebase/firestore"
import * as XLSX from "xlsx"

export function TransfersTab() {
  const { items: transfers, loading, create } = useFirestore<BankTransfer>(COLLECTIONS.bankTransfers, [], true)
  const { items: accounts } = useFirestore<BankAccount>(COLLECTIONS.bankAccounts, [], true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTransfers, setSelectedTransfers] = useState<Set<string>>(new Set())

  const transferFields = [
    {
      name: "tipo",
      label: "Tipo de Transferencia",
      type: "select" as const,
      required: true,
      options: [
        { value: "interna", label: "Transferencia Interna" },
        { value: "spei", label: "SPEI" },
        { value: "externa", label: "Externa" },
      ],
    },
    {
      name: "cuentaOrigenId",
      label: "Cuenta Origen",
      type: "select" as const,
      required: true,
      options: accounts.map((acc) => ({
        value: acc.id,
        label: `${acc.alias || acc.banco} - ${acc.numeroEnmascarado}`,
      })),
    },
    {
      name: "beneficiario",
      label: "Beneficiario",
      type: "text" as const,
      required: true,
      placeholder: "Nombre del beneficiario",
    },
    {
      name: "clabe",
      label: "CLABE (si aplica)",
      type: "text" as const,
      required: false,
      placeholder: "012180001234567890",
    },
    { name: "monto", label: "Monto", type: "number" as const, required: true, placeholder: "0.00" },
    {
      name: "moneda",
      label: "Moneda",
      type: "select" as const,
      required: true,
      options: [
        { value: "MXN", label: "MXN" },
        { value: "USD", label: "USD" },
      ],
    },
    { name: "fechaProgramada", label: "Fecha Programada", type: "date" as const, required: true },
    { name: "referencia", label: "Referencia", type: "text" as const, required: false, placeholder: "REF-001" },
    { name: "concepto", label: "Concepto", type: "text" as const, required: true, placeholder: "Pago por..." },
  ]

  const handleSaveTransfer = async (values: any) => {
    const transferData: Partial<BankTransfer> = {
      tipo: values.tipo,
      cuentaOrigenId: values.cuentaOrigenId,
      beneficiario: values.beneficiario,
      clabe: values.clabe || "",
      monto: Number.parseFloat(values.monto) || 0,
      moneda: values.moneda,
      fechaProgramada: values.fechaProgramada,
      referencia: values.referencia || "",
      concepto: values.concepto,
      estado: "programada",
      layoutGenerado: false,
    }

    await create(transferData)
    setDialogOpen(false)
  }

  const handleExportLayout = () => {
    const transfersToExport = transfers.filter((t) => selectedTransfers.has(t.id))

    if (transfersToExport.length === 0) {
      alert("Selecciona al menos una transferencia para exportar")
      return
    }

    const data = transfersToExport.map((t) => {
      const account = accounts.find((a) => a.id === t.cuentaOrigenId)
      return {
        Fecha:
          t.fechaProgramada instanceof Timestamp
            ? t.fechaProgramada.toDate().toLocaleDateString("es-MX")
            : new Date(t.fechaProgramada as string).toLocaleDateString("es-MX"),
        CuentaOrigen: account?.numeroEnmascarado || "",
        Beneficiario: t.beneficiario,
        CLABE: t.clabe || "",
        Monto: t.monto,
        Moneda: t.moneda,
        Referencia: t.referencia || "",
        Concepto: t.concepto,
      }
    })

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Transferencias")

    const fileName = `layout_transferencias_${new Date().toISOString().split("T")[0]}.xlsx`
    XLSX.writeFile(wb, fileName)

    setSelectedTransfers(new Set())
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Transferencias Bancarias</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportLayout} disabled={selectedTransfers.size === 0}>
            <Download className="w-4 h-4 mr-2" />
            Descargar Layout ({selectedTransfers.size})
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Send className="w-4 h-4 mr-2" />
            Nueva Transferencia
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Cargando transferencias...</div>
        ) : transfers.length === 0 ? (
          <div className="text-center py-12">
            <Send className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No hay transferencias registradas</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Transferencia
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTransfers(new Set(transfers.map((t) => t.id)))
                        } else {
                          setSelectedTransfers(new Set())
                        }
                      }}
                    />
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Beneficiario</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Monto</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Fecha</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Estado</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((transfer) => {
                  const account = accounts.find((a) => a.id === transfer.cuentaOrigenId)
                  return (
                    <tr key={transfer.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <input
                          type="checkbox"
                          checked={selectedTransfers.has(transfer.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedTransfers)
                            if (e.target.checked) {
                              newSelected.add(transfer.id)
                            } else {
                              newSelected.delete(transfer.id)
                            }
                            setSelectedTransfers(newSelected)
                          }}
                        />
                      </td>
                      <td className="py-3 px-2 text-sm capitalize">{transfer.tipo}</td>
                      <td className="py-3 px-2 text-sm">{transfer.beneficiario}</td>
                      <td className="py-3 px-2 text-sm font-medium">
                        ${transfer.monto.toLocaleString("es-MX", { minimumFractionDigits: 2 })} {transfer.moneda}
                      </td>
                      <td className="py-3 px-2 text-sm">
                        {transfer.fechaProgramada instanceof Timestamp
                          ? transfer.fechaProgramada.toDate().toLocaleDateString("es-MX")
                          : new Date(transfer.fechaProgramada as string).toLocaleDateString("es-MX")}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="default" className="capitalize">
                          {transfer.estado}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Nueva Transferencia"
        fields={transferFields}
        onSubmit={handleSaveTransfer}
      />
    </Card>
  )
}
