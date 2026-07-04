"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, Building2 } from "lucide-react"
import { useFirestore } from "@/hooks/use-firestore"
import { COLLECTIONS } from "@/lib/firestore"
import type { BankAccount } from "@/lib/types"
import { FormDialog } from "@/components/ui/form-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"

export function BankAccountsTab() {
  const {
    items: accounts,
    loading,
    create,
    update,
    remove,
  } = useFirestore<BankAccount>(COLLECTIONS.bankAccounts, [], true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null)

  const bankFields = [
    { name: "banco", label: "Banco", type: "text" as const, required: true, placeholder: "BBVA Bancomer" },
    {
      name: "alias",
      label: "Alias / Nombre Amigable",
      type: "text" as const,
      required: true,
      placeholder: "Cuenta Principal",
    },
    {
      name: "numeroCompleto",
      label: "Número de Cuenta",
      type: "text" as const,
      required: true,
      placeholder: "0112345678",
    },
    {
      name: "tipo",
      label: "Tipo de Cuenta",
      type: "select" as const,
      required: true,
      options: [
        { value: "cheques", label: "Cuenta de Cheques" },
        { value: "inversion", label: "Cuenta de Inversión" },
        { value: "ahorro", label: "Cuenta de Ahorro" },
        { value: "nomina", label: "Cuenta de Nómina" },
      ],
    },
    {
      name: "moneda",
      label: "Moneda",
      type: "select" as const,
      required: true,
      options: [
        { value: "MXN", label: "MXN - Peso Mexicano" },
        { value: "USD", label: "USD - Dólar Estadounidense" },
        { value: "EUR", label: "EUR - Euro" },
      ],
    },
    { name: "saldoInicial", label: "Saldo Inicial", type: "number" as const, required: true, placeholder: "0.00" },
    {
      name: "clabe",
      label: "CLABE Interbancaria (opcional)",
      type: "text" as const,
      required: false,
      placeholder: "012180001234567890",
    },
  ]

  const handleSaveAccount = async (values: any) => {
    const numeroCompleto = values.numeroCompleto || ""
    const numeroEnmascarado = `****${numeroCompleto.slice(-4)}`
    const saldoInicial = Number.parseFloat(values.saldoInicial) || 0

    const accountData = {
      banco: values.banco,
      alias: values.alias,
      numeroEnmascarado,
      numeroCompleto,
      tipo: values.tipo,
      moneda: values.moneda,
      saldoInicial,
      saldoActual: editingAccount ? editingAccount.saldoActual : saldoInicial,
      estado: (editingAccount?.estado || "activa") as "activa" | "inactiva" | "suspendida",
      clabe: values.clabe || "",
    }

    if (editingAccount) {
      await update(editingAccount.id, accountData)
    } else {
      await create(accountData)
    }
    setEditingAccount(null)
    setDialogOpen(false)
  }

  const handleDeleteAccount = async () => {
    if (accountToDelete) {
      await remove(accountToDelete.id)
      setAccountToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestión de Cuentas Bancarias</CardTitle>
        <Button
          onClick={() => {
            setEditingAccount(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Cuenta
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Cargando cuentas...</div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No hay cuentas bancarias registradas</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Primera Cuenta
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <Card key={account.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{account.alias || account.banco}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {account.banco} • {account.numeroEnmascarado}
                        </p>
                        <div className="flex gap-6 mt-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Saldo Actual</p>
                            <p className="text-xl font-bold mt-1">
                              ${(account.saldoActual || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Moneda</p>
                            <p className="text-xl font-bold mt-1">{account.moneda}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Tipo</p>
                            <p className="text-sm mt-1 capitalize">{account.tipo}</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <Badge variant={account.estado === "activa" ? "outline" : "secondary"} className="capitalize">
                            {account.estado}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingAccount(account)
                          setDialogOpen(true)
                        }}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAccountToDelete(account)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <FormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingAccount(null)
        }}
        title={editingAccount ? "Editar Cuenta Bancaria" : "Nueva Cuenta Bancaria"}
        fields={bankFields}
        onSubmit={handleSaveAccount}
        initialValues={editingAccount || undefined}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cuenta bancaria?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la cuenta "{accountToDelete?.alias}" y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
