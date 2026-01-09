"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Timestamp } from "firebase/firestore"
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

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (employee) {
      const extractDate = (dateValue: any): string => {
        if (!dateValue) return ""
        if (typeof dateValue === "string") return dateValue
        if (dateValue?.toDate) {
          const date = dateValue.toDate()
          return date.toISOString().split("T")[0]
        }
        return ""
      }

      setFormData({
        numeroEmpleado: employee.numeroEmpleado || "",
        nombre: employee.nombre || "",
        apellidoPaterno: employee.apellidoPaterno || "",
        apellidoMaterno: employee.apellidoMaterno || "",
        rfc: employee.rfc || "",
        curp: employee.curp || "",
        nss: employee.nss || "",
        fechaNacimiento: extractDate(employee.fechaNacimiento),
        fechaIngreso: extractDate(employee.fechaIngreso),
        departamento: employee.departamento || "",
        puesto: employee.puesto || "",
        nivelPuesto: employee.nivelPuesto || "",
        tipoContrato: employee.tipoContrato || "planta",
        salarioDiario: Number(employee.salarioDiario) || 0,
        salarioMensual: Number(employee.salarioMensual) || 0,
        moneda: employee.moneda || "MXN",
        email: employee.email || "",
        telefono: employee.telefono || "",
        estado: employee.estado || "activo",
      })
    } else {
      // Reset form with safe defaults
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
    setErrors({})
  }, [employee, open])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.numeroEmpleado.trim()) {
      newErrors.numeroEmpleado = "Número de empleado es obligatorio"
    }
    if (!formData.nombre.trim()) {
      newErrors.nombre = "Nombre es obligatorio"
    }
    if (!formData.apellidoPaterno.trim()) {
      newErrors.apellidoPaterno = "Apellido paterno es obligatorio"
    }
    if (!formData.rfc.trim()) {
      newErrors.rfc = "RFC es obligatorio"
    }
    if (!formData.curp.trim()) {
      newErrors.curp = "CURP es obligatorio"
    }
    if (!formData.nss.trim()) {
      newErrors.nss = "NSS es obligatorio"
    }
    if (!formData.fechaIngreso) {
      newErrors.fechaIngreso = "Fecha de ingreso es obligatoria"
    }
    if (!formData.departamento.trim()) {
      newErrors.departamento = "Departamento es obligatorio"
    }
    if (!formData.puesto.trim()) {
      newErrors.puesto = "Puesto es obligatorio"
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email es obligatorio"
    }
    if (!formData.telefono.trim()) {
      newErrors.telefono = "Teléfono es obligatorio"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const normalizedData: any = {
        numeroEmpleado: formData.numeroEmpleado.trim(),
        nombre: formData.nombre.trim(),
        apellidoPaterno: formData.apellidoPaterno.trim(),
        apellidoMaterno: formData.apellidoMaterno.trim(),
        rfc: formData.rfc.trim().toUpperCase(),
        curp: formData.curp.trim().toUpperCase(),
        nss: formData.nss.trim(),
        fechaNacimiento: formData.fechaNacimiento ? Timestamp.fromDate(new Date(formData.fechaNacimiento)) : null,
        fechaIngreso: formData.fechaIngreso ? Timestamp.fromDate(new Date(formData.fechaIngreso)) : Timestamp.now(),
        departamento: formData.departamento.trim(),
        puesto: formData.puesto.trim(),
        nivelPuesto: formData.nivelPuesto.trim(),
        tipoContrato: formData.tipoContrato,
        salarioDiario: Number(formData.salarioDiario) || 0,
        salarioMensual: Number(formData.salarioMensual) || 0,
        moneda: formData.moneda,
        email: formData.email.trim().toLowerCase(),
        telefono: formData.telefono.trim(),
        estado: formData.estado,
      }

      if (employee?.id) {
        await onSave({ id: employee.id, ...normalizedData })
      } else {
        await onSave(normalizedData)
      }

      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Error saving employee:", error)
      setErrors({ submit: "Error al guardar el empleado. Por favor intente nuevamente." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-6">
          <DialogTitle>{employee ? "Editar Empleado" : "Nuevo Empleado"}</DialogTitle>
          <DialogDescription>
            Complete la información del empleado. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numeroEmpleado">
                  Número de Empleado <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="numeroEmpleado"
                  value={formData.numeroEmpleado}
                  onChange={(e) => setFormData({ ...formData, numeroEmpleado: e.target.value })}
                  className={errors.numeroEmpleado ? "border-destructive" : ""}
                />
                {errors.numeroEmpleado && <p className="text-xs text-destructive mt-1">{errors.numeroEmpleado}</p>}
              </div>
              <div>
                <Label htmlFor="estado">
                  Estado <span className="text-destructive">*</span>
                </Label>
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
                <Label htmlFor="nombre">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className={errors.nombre ? "border-destructive" : ""}
                />
                {errors.nombre && <p className="text-xs text-destructive mt-1">{errors.nombre}</p>}
              </div>
              <div>
                <Label htmlFor="apellidoPaterno">
                  Apellido Paterno <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="apellidoPaterno"
                  value={formData.apellidoPaterno}
                  onChange={(e) => setFormData({ ...formData, apellidoPaterno: e.target.value })}
                  className={errors.apellidoPaterno ? "border-destructive" : ""}
                />
                {errors.apellidoPaterno && <p className="text-xs text-destructive mt-1">{errors.apellidoPaterno}</p>}
              </div>
              <div>
                <Label htmlFor="apellidoMaterno">Apellido Materno</Label>
                <Input
                  id="apellidoMaterno"
                  value={formData.apellidoMaterno}
                  onChange={(e) => setFormData({ ...formData, apellidoMaterno: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Datos Fiscales</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="rfc">
                  RFC <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="rfc"
                  value={formData.rfc}
                  onChange={(e) => setFormData({ ...formData, rfc: e.target.value })}
                  className={errors.rfc ? "border-destructive" : ""}
                />
                {errors.rfc && <p className="text-xs text-destructive mt-1">{errors.rfc}</p>}
              </div>
              <div>
                <Label htmlFor="curp">
                  CURP <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="curp"
                  value={formData.curp}
                  onChange={(e) => setFormData({ ...formData, curp: e.target.value })}
                  className={errors.curp ? "border-destructive" : ""}
                />
                {errors.curp && <p className="text-xs text-destructive mt-1">{errors.curp}</p>}
              </div>
              <div>
                <Label htmlFor="nss">
                  NSS <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nss"
                  value={formData.nss}
                  onChange={(e) => setFormData({ ...formData, nss: e.target.value })}
                  className={errors.nss ? "border-destructive" : ""}
                />
                {errors.nss && <p className="text-xs text-destructive mt-1">{errors.nss}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Fechas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
                <Input
                  id="fechaNacimiento"
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="fechaIngreso">
                  Fecha de Ingreso <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fechaIngreso"
                  type="date"
                  value={formData.fechaIngreso}
                  onChange={(e) => setFormData({ ...formData, fechaIngreso: e.target.value })}
                  className={errors.fechaIngreso ? "border-destructive" : ""}
                />
                {errors.fechaIngreso && <p className="text-xs text-destructive mt-1">{errors.fechaIngreso}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Información Laboral</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="departamento">
                  Departamento <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="departamento"
                  value={formData.departamento}
                  onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                  className={errors.departamento ? "border-destructive" : ""}
                />
                {errors.departamento && <p className="text-xs text-destructive mt-1">{errors.departamento}</p>}
              </div>
              <div>
                <Label htmlFor="puesto">
                  Puesto <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="puesto"
                  value={formData.puesto}
                  onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                  className={errors.puesto ? "border-destructive" : ""}
                />
                {errors.puesto && <p className="text-xs text-destructive mt-1">{errors.puesto}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nivelPuesto">Nivel de Puesto</Label>
                <Input
                  id="nivelPuesto"
                  value={formData.nivelPuesto}
                  onChange={(e) => setFormData({ ...formData, nivelPuesto: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="tipoContrato">Tipo de Contrato</Label>
                <Select
                  value={formData.tipoContrato}
                  onValueChange={(value: any) => setFormData({ ...formData, tipoContrato: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planta">Planta</SelectItem>
                    <SelectItem value="temporal">Temporal</SelectItem>
                    <SelectItem value="honorarios">Honorarios</SelectItem>
                    <SelectItem value="outsourcing">Outsourcing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Información Salarial</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="salarioDiario">Salario Diario</Label>
                <Input
                  id="salarioDiario"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.salarioDiario || ""}
                  onChange={(e) => {
                    const diario = Number(e.target.value || 0)
                    setFormData({ ...formData, salarioDiario: diario, salarioMensual: diario * 30 })
                  }}
                />
              </div>
              <div>
                <Label htmlFor="salarioMensual">Salario Mensual</Label>
                <Input
                  id="salarioMensual"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.salarioMensual || ""}
                  onChange={(e) => {
                    const mensual = Number(e.target.value || 0)
                    setFormData({ ...formData, salarioMensual: mensual })
                  }}
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
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Contacto</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="telefono">
                  Teléfono <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className={errors.telefono ? "border-destructive" : ""}
                />
                {errors.telefono && <p className="text-xs text-destructive mt-1">{errors.telefono}</p>}
              </div>
            </div>
          </div>

          {errors.submit && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
              {errors.submit}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
