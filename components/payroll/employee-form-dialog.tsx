"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Employee } from "@/lib/types"

interface EmployeeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (employee: Omit<Employee, "id"> | Partial<Employee>) => Promise<void>
  employee?: Employee | null
}

export function EmployeeFormDialog({ open, onOpenChange, onSave, employee }: EmployeeFormDialogProps) {
  const [formData, setFormData] = useState({
    numeroEmpleado: "",
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    rfc: "",
    curp: "",
    nss: "",
    fechaNacimiento: "",
    fechaIngreso: "",
    departamento: "",
    puesto: "",
    nivelPuesto: "",
    tipoContrato: "planta" as const,
    salarioDiario: 0,
    salarioMensual: 0,
    moneda: "MXN" as const,
    email: "",
    telefono: "",
    estado: "activo" as const,
  })

  useEffect(() => {
    if (employee) {
      setFormData({
        numeroEmpleado: employee.numeroEmpleado,
        nombre: employee.nombre,
        apellidoPaterno: employee.apellidoPaterno,
        apellidoMaterno: employee.apellidoMaterno,
        rfc: employee.rfc,
        curp: employee.curp,
        nss: employee.nss,
        fechaNacimiento: typeof employee.fechaNacimiento === "string" ? employee.fechaNacimiento : "",
        fechaIngreso: typeof employee.fechaIngreso === "string" ? employee.fechaIngreso : "",
        departamento: employee.departamento,
        puesto: employee.puesto,
        nivelPuesto: employee.nivelPuesto,
        tipoContrato: employee.tipoContrato,
        salarioDiario: employee.salarioDiario,
        salarioMensual: employee.salarioMensual,
        moneda: employee.moneda,
        email: employee.email,
        telefono: employee.telefono,
        estado: employee.estado,
      })
    } else {
      // Reset form
      setFormData({
        numeroEmpleado: "",
        nombre: "",
        apellidoPaterno: "",
        apellidoMaterno: "",
        rfc: "",
        curp: "",
        nss: "",
        fechaNacimiento: "",
        fechaIngreso: "",
        departamento: "",
        puesto: "",
        nivelPuesto: "",
        tipoContrato: "planta",
        salarioDiario: 0,
        salarioMensual: 0,
        moneda: "MXN",
        email: "",
        telefono: "",
        estado: "activo",
      })
    }
  }, [employee, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? "Editar Empleado" : "Nuevo Empleado"}</DialogTitle>
          <DialogDescription>
            Complete la información del empleado. Los campos marcados son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numeroEmpleado">Número de Empleado</Label>
              <Input
                id="numeroEmpleado"
                value={formData.numeroEmpleado}
                onChange={(e) => setFormData({ ...formData, numeroEmpleado: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={formData.estado}
                onValueChange={(value: any) => setFormData({ ...formData, estado: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                  <SelectItem value="suspendido">Suspendido</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="apellidoPaterno">Apellido Paterno</Label>
              <Input
                id="apellidoPaterno"
                value={formData.apellidoPaterno}
                onChange={(e) => setFormData({ ...formData, apellidoPaterno: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="apellidoMaterno">Apellido Materno</Label>
              <Input
                id="apellidoMaterno"
                value={formData.apellidoMaterno}
                onChange={(e) => setFormData({ ...formData, apellidoMaterno: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="rfc">RFC</Label>
              <Input
                id="rfc"
                value={formData.rfc}
                onChange={(e) => setFormData({ ...formData, rfc: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="curp">CURP</Label>
              <Input
                id="curp"
                value={formData.curp}
                onChange={(e) => setFormData({ ...formData, curp: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="nss">NSS</Label>
              <Input
                id="nss"
                value={formData.nss}
                onChange={(e) => setFormData({ ...formData, nss: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
              <Input
                id="fechaNacimiento"
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="fechaIngreso">Fecha de Ingreso</Label>
              <Input
                id="fechaIngreso"
                type="date"
                value={formData.fechaIngreso}
                onChange={(e) => setFormData({ ...formData, fechaIngreso: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="departamento">Departamento</Label>
              <Input
                id="departamento"
                value={formData.departamento}
                onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="puesto">Puesto</Label>
              <Input
                id="puesto"
                value={formData.puesto}
                onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="salarioDiario">Salario Diario</Label>
              <Input
                id="salarioDiario"
                type="number"
                step="0.01"
                value={formData.salarioDiario}
                onChange={(e) => {
                  const diario = Number.parseFloat(e.target.value)
                  setFormData({ ...formData, salarioDiario: diario, salarioMensual: diario * 30 })
                }}
                required
              />
            </div>
            <div>
              <Label htmlFor="salarioMensual">Salario Mensual</Label>
              <Input
                id="salarioMensual"
                type="number"
                step="0.01"
                value={formData.salarioMensual}
                onChange={(e) => setFormData({ ...formData, salarioMensual: Number.parseFloat(e.target.value) })}
                required
              />
            </div>
            <div>
              <Label htmlFor="moneda">Moneda</Label>
              <Select
                value={formData.moneda}
                onValueChange={(value: any) => setFormData({ ...formData, moneda: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MXN">MXN</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
