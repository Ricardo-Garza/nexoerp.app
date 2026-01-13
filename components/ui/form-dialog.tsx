"use client"

import type React from "react"
import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Field = {
  name: string
  label: string
  type?: "text" | "number" | "email" | "tel" | "textarea" | "select" | "date"
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
}

type FormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  fields: Field[]
  initialValues?: Record<string, any>
  onSubmit: (values: Record<string, any>) => void | Promise<void>
  submitLabel?: string
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  initialValues = {},
  onSubmit,
  submitLabel = "Guardar",
}: FormDialogProps) {
  const [values, setValues] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  const areValuesEqual = (a: Record<string, any>, b: Record<string, any>) => {
    const aKeys = Object.keys(a)
    const bKeys = Object.keys(b)
    if (aKeys.length !== bKeys.length) return false
    return aKeys.every((key) => a[key] === b[key])
  }

  useEffect(() => {
    console.log("[v0] FormDialog opened, initialValues:", initialValues)
    if (open) {
      // Create safe defaults for all fields
      const safeDefaults: Record<string, any> = {}
      fields.forEach((field) => {
        const initialValue = initialValues?.[field.name]
        safeDefaults[field.name] = initialValue ?? ""
      })
      console.log("[v0] Setting safe defaults:", safeDefaults)
      if (!areValuesEqual(values, safeDefaults)) {
        setValues(safeDefaults)
      }
    }
  }, [open, initialValues, fields])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Form submit started with values:", values)
    setLoading(true)
    try {
      await onSubmit(values)
      console.log("[v0] Form submit successful")
      // Don't clear values here, let the parent control closing
    } catch (error) {
      console.error("[v0] Form submission error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) {
      console.log("[v0] Dialog closed, clearing values")
      setValues({})
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {fields.map((field) => {
              const currentValue = values[field.name] ?? ""

              return (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {field.type === "textarea" ? (
                    <textarea
                      id={field.name}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder={field.placeholder}
                      value={currentValue}
                      onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                      required={field.required}
                    />
                  ) : field.type === "select" ? (
                    <select
                      id={field.name}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={currentValue}
                      onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                      required={field.required}
                    >
                      <option value="">Seleccionar...</option>
                      {Array.isArray(field.options) &&
                        field.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <Input
                      id={field.name}
                      type={field.type || "text"}
                      placeholder={field.placeholder}
                      value={currentValue}
                      onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                      required={field.required}
                    />
                  )}
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
