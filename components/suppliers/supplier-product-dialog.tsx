"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, Info, Plus, CalendarIcon, Package, Hash, Barcode, X } from "lucide-react"
import type { SupplierProduct, Supplier, Product } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useSuppliersData } from "@/hooks/use-suppliers-data"
import { COLLECTIONS } from "@/lib/firestore"
import { useFirestore } from "@/hooks/use-firestore"
import { useWarehouseData } from "@/hooks/use-warehouse-data"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface SupplierProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: SupplierProduct
  supplierId?: string
  supplierName?: string
  onSave: (product: Partial<SupplierProduct>) => Promise<void>
}

const UNIT_OPTIONS = [
  { value: "PZA", label: "PZA - Pieza" },
  { value: "KG", label: "KG - Kilogramo" },
  { value: "G", label: "G - Gramo" },
  { value: "L", label: "L - Litro" },
  { value: "ML", label: "ML - Mililitro" },
  { value: "M", label: "M - Metro" },
  { value: "CM", label: "CM - Centímetro" },
  { value: "CAJA", label: "CAJA - Caja" },
  { value: "PAQUETE", label: "PAQUETE - Paquete" },
  { value: "LOTE", label: "LOTE - Lote" },
  { value: "SET", label: "SET - Set" },
  { value: "BOLSA", label: "BOLSA - Bolsa" },
  { value: "ROLLO", label: "ROLLO - Rollo" },
  { value: "TARIMA", label: "TARIMA - Tarima" },
]

interface VolumeDiscount {
  id: string
  porcentajeDescuento: number
  cantidadMinima: number
  vigenciaInicio: Date | null
  vigenciaFin: Date | null
}

export function SupplierProductDialog({
  open,
  onOpenChange,
  product,
  supplierId,
  supplierName,
  onSave,
}: SupplierProductDialogProps) {
  const [loading, setLoading] = useState(false)
  const [creatingNewProduct, setCreatingNewProduct] = useState(false)

  const { suppliers } = useSuppliersData()
  const { warehouses } = useWarehouseData()
  const { items: inventoryProducts, create: createInventoryProduct } = useFirestore<Product>(
    COLLECTIONS.products,
    [],
    true,
  )

  const [openSupplierCombo, setOpenSupplierCombo] = useState(false)
  const [openProductCombo, setOpenProductCombo] = useState(false)
  const [supplierSearch, setSupplierSearch] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const [openExpiryCalendar, setOpenExpiryCalendar] = useState(false)

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const [formData, setFormData] = useState<Partial<SupplierProduct>>({
    proveedorId: supplierId || "",
    proveedorNombre: supplierName || "",
    productoId: "",
    nombre: "",
    descripcion: "",
    sku: "",
    codigoProveedor: "",
    nombreProveedor: "",
    unidadMedida: "PZA",
    unidadCompra: "PZA",
    unidadesPorPresentacion: 1,
    trackingType: "ninguno",
    requiresExpiry: false,
    loteInicial: "",
    almacenDestinoId: "",
    almacenDestinoNombre: "",
    fechaCaducidad: null,
    tasaIVA: 16,
    monedaPrincipal: "MXN",
    precioBase: 0,
    tiposCambio: {
      usdToMxn: 20,
      eurToMxn: 22,
    },
    costoUltimo: 0,
    leadTimeMin: 5,
    leadTimeMax: 10,
    leadTimePromedio: 7,
    cantidadMinima: 1,
    cantidadMaxima: 0,
    activo: true,
    notas: "",
    notasEntrega: "",
  })

  const [volumeDiscounts, setVolumeDiscounts] = useState<VolumeDiscount[]>([])
  const [openDiscountStartCal, setOpenDiscountStartCal] = useState<string | null>(null)
  const [openDiscountEndCal, setOpenDiscountEndCal] = useState<string | null>(null)

  const sortedProducts = useMemo(() => {
    return [...inventoryProducts].sort((a, b) => (a.name || "").localeCompare(b.name || ""))
  }, [inventoryProducts])

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch) return suppliers.slice(0, 50)
    return suppliers
      .filter(
        (s) =>
          s.nombre?.toLowerCase().includes(supplierSearch.toLowerCase()) ||
          s.rfc?.toLowerCase().includes(supplierSearch.toLowerCase()),
      )
      .slice(0, 50)
  }, [suppliers, supplierSearch])

  const filteredProducts = useMemo(() => {
    if (!productSearch) return sortedProducts.slice(0, 50)
    return sortedProducts
      .filter(
        (p) =>
          p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.description?.toLowerCase().includes(productSearch.toLowerCase()),
      )
      .slice(0, 50)
  }, [sortedProducts, productSearch])

  const calculatedPrices = useMemo(() => {
    const base = formData.precioBase || 0
    const currency = formData.monedaPrincipal || "MXN"
    const rates = formData.tiposCambio || { usdToMxn: 20, eurToMxn: 22 }
    const tasaIVA = formData.tasaIVA || 16

    let basePrices = { MXN: 0, USD: 0, EUR: 0 }

    if (currency === "MXN") {
      basePrices = {
        MXN: base,
        USD: base / rates.usdToMxn,
        EUR: base / rates.eurToMxn,
      }
    } else if (currency === "USD") {
      basePrices = {
        MXN: base * rates.usdToMxn,
        USD: base,
        EUR: (base * rates.usdToMxn) / rates.eurToMxn,
      }
    } else {
      basePrices = {
        MXN: base * rates.eurToMxn,
        USD: (base * rates.eurToMxn) / rates.usdToMxn,
        EUR: base,
      }
    }

    // Calculate IVA for each currency
    const iva = {
      MXN: basePrices.MXN * (tasaIVA / 100),
      USD: basePrices.USD * (tasaIVA / 100),
      EUR: basePrices.EUR * (tasaIVA / 100),
    }

    const totales = {
      MXN: basePrices.MXN + iva.MXN,
      USD: basePrices.USD + iva.USD,
      EUR: basePrices.EUR + iva.EUR,
    }

    return {
      subtotal: basePrices,
      iva,
      total: totales,
    }
  }, [formData.precioBase, formData.monedaPrincipal, formData.tiposCambio, formData.tasaIVA])

  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        trackingType: product.trackingType || "ninguno",
        requiresExpiry: product.requiresExpiry || false,
        loteInicial: (product as any).loteInicial || "",
        almacenDestinoId: (product as any).almacenDestinoId || "",
        almacenDestinoNombre: (product as any).almacenDestinoNombre || "",
        fechaCaducidad: (product as any).fechaCaducidad || null,
        tasaIVA: (product as any).tasaIVA || 16,
        monedaPrincipal: product.monedaPrincipal || "MXN",
        precioBase: product.precioBase || 0,
        tiposCambio: product.tiposCambio || { usdToMxn: 20, eurToMxn: 22 },
        unidadMedida: product.unidadMedida || "PZA",
        unidadCompra: product.unidadCompra || "PZA",
        unidadesPorPresentacion: product.unidadesPorPresentacion || 1,
        costoUltimo: product.costoUltimo || 0,
        leadTimeMin: product.leadTimeMin || 5,
        leadTimeMax: product.leadTimeMax || 10,
        leadTimePromedio: product.leadTimePromedio || 7,
        cantidadMinima: product.cantidadMinima || 1,
        cantidadMaxima: product.cantidadMaxima || 0,
        activo: product.activo !== false,
        notasEntrega: product.notasEntrega || "",
      })

      if (product.proveedorId) {
        const supplier = suppliers.find((s) => s.id === product.proveedorId)
        if (supplier) setSelectedSupplier(supplier)
      }

      if (product.productoId) {
        const invProduct = sortedProducts.find((p) => p.id === product.productoId)
        if (invProduct) setSelectedProduct(invProduct)
      }

      if (product.descuentosVolumen && Array.isArray(product.descuentosVolumen)) {
        setVolumeDiscounts(
          product.descuentosVolumen.map((d: any, idx: number) => ({
            id: d.id || `discount-${idx}`,
            porcentajeDescuento: d.porcentajeDescuento || 0,
            cantidadMinima: d.cantidadMinima || 0,
            vigenciaInicio: d.vigenciaInicio ? new Date(d.vigenciaInicio) : null,
            vigenciaFin: d.vigenciaFin ? new Date(d.vigenciaFin) : null,
          })),
        )
      }
    } else {
      if (supplierId && supplierName) {
        const supplier = suppliers.find((s) => s.id === supplierId)
        if (supplier) setSelectedSupplier(supplier)
      }
      const firstWarehouse = warehouses.find((w) => w.estado === "activo")
      if (firstWarehouse && !formData.almacenDestinoId) {
        setFormData((prev) => ({
          ...prev,
          almacenDestinoId: firstWarehouse.id,
          almacenDestinoNombre: firstWarehouse.nombre,
        }))
      }
    }
  }, [product, supplierId, supplierName, suppliers, sortedProducts, warehouses])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const cleanData: Partial<SupplierProduct> = {
        proveedorId: formData.proveedorId || "",
        proveedorNombre: formData.proveedorNombre || "",
        productoId: formData.productoId || "",
        nombre: formData.nombre || "",
        descripcion: formData.descripcion || "",
        sku: formData.sku || "",
        codigoProveedor: formData.codigoProveedor || "",
        nombreProveedor: formData.nombreProveedor || "",
        unidadMedida: formData.unidadMedida || "PZA",
        unidadCompra: formData.unidadCompra || "PZA",
        unidadesPorPresentacion: formData.unidadesPorPresentacion || 1,
        trackingType: formData.trackingType || "ninguno",
        requiresExpiry: formData.requiresExpiry || false,
        loteInicial: formData.loteInicial || "",
        almacenDestinoId: formData.almacenDestinoId || "",
        almacenDestinoNombre: formData.almacenDestinoNombre || "",
        fechaCaducidad: formData.fechaCaducidad || null,
        tasaIVA: formData.tasaIVA || 16,
        monedaPrincipal: formData.monedaPrincipal || "MXN",
        precioBase: formData.precioBase || 0,
        tiposCambio: {
          usdToMxn: formData.tiposCambio?.usdToMxn || 20,
          eurToMxn: formData.tiposCambio?.eurToMxn || 22,
        },
        precios: {
          MXN: calculatedPrices.total.MXN,
          USD: calculatedPrices.total.USD,
          EUR: calculatedPrices.total.EUR,
        },
        costoUltimo: formData.costoUltimo || 0,
        descuentosVolumen: volumeDiscounts.map((d) => ({
          porcentajeDescuento: d.porcentajeDescuento,
          cantidadMinima: d.cantidadMinima,
          vigenciaInicio: d.vigenciaInicio || null,
          vigenciaFin: d.vigenciaFin || null,
        })),
        leadTimeMin: formData.leadTimeMin || 5,
        leadTimeMax: formData.leadTimeMax || 10,
        leadTimePromedio: formData.leadTimePromedio || 7,
        cantidadMinima: formData.cantidadMinima || 1,
        cantidadMaxima: formData.cantidadMaxima || 0,
        activo: formData.activo !== false,
        notas: formData.notas || "",
        notasEntrega: formData.notasEntrega || "",
      } as any

      await onSave(cleanData)
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving product:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setFormData({
      ...formData,
      proveedorId: supplier.id,
      proveedorNombre: supplier.nombre,
    })
    setOpenSupplierCombo(false)
  }

  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod)
    setFormData({
      ...formData,
      productoId: prod.id,
      nombre: prod.name,
      descripcion: prod.description || "",
      precioBase: prod.cost || 0,
      costoUltimo: prod.cost || 0,
    })
    setOpenProductCombo(false)
  }

  const handleCreateNewProduct = async () => {
    if (!productSearch.trim()) return

    setCreatingNewProduct(true)
    try {
      const newProductData = {
        name: productSearch,
        description: "",
        category: "Otros",
        price: 0,
        cost: 0,
        stock: 0,
        unit: "PZA",
        status: "active",
      }

      const newProductId = await createInventoryProduct(newProductData)

      const newProduct: Product = {
        id: newProductId,
        ...newProductData,
      } as Product

      handleSelectProduct(newProduct)
      setProductSearch("")
    } catch (error) {
      console.error("Error creating product:", error)
    } finally {
      setCreatingNewProduct(false)
    }
  }

  const addVolumeDiscount = () => {
    setVolumeDiscounts([
      ...volumeDiscounts,
      {
        id: `discount-${Date.now()}`,
        porcentajeDescuento: 0,
        cantidadMinima: 0,
        vigenciaInicio: null,
        vigenciaFin: null,
      },
    ])
  }

  const removeVolumeDiscount = (id: string) => {
    setVolumeDiscounts(volumeDiscounts.filter((d) => d.id !== id))
  }

  const updateVolumeDiscount = (id: string, field: keyof VolumeDiscount, value: any) => {
    setVolumeDiscounts(volumeDiscounts.map((d) => (d.id === id ? { ...d, [field]: value } : d)))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{product ? "Editar Producto del Proveedor" : "Agregar Producto del Proveedor"}</DialogTitle>
          <DialogDescription>
            {product
              ? "Modifica los detalles del producto suministrado por el proveedor."
              : "Agrega un nuevo producto que este proveedor puede suministrar, incluyendo precios, unidades y condiciones de entrega."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <Tabs defaultValue="general" className="flex flex-col flex-1 overflow-hidden">
            <TabsList className="grid w-full grid-cols-4 shrink-0">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="precios">Precios</TabsTrigger>
              <TabsTrigger value="descuentos">Descuentos</TabsTrigger>
              <TabsTrigger value="entrega">Entrega</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              {/* GENERAL TAB */}
              <TabsContent value="general" className="space-y-6 mt-0">
                {/* Supplier and Product Selection */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Proveedor *</Label>
                    <Popover open={openSupplierCombo} onOpenChange={setOpenSupplierCombo}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openSupplierCombo}
                          className="w-full justify-between bg-transparent"
                          disabled={!!supplierId}
                        >
                          {formData.proveedorNombre || "Seleccionar proveedor..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Buscar proveedor..."
                            value={supplierSearch}
                            onValueChange={setSupplierSearch}
                          />
                          <CommandList>
                            <CommandEmpty>No se encontró proveedor.</CommandEmpty>
                            <CommandGroup>
                              {filteredSuppliers.map((supplier) => (
                                <CommandItem
                                  key={supplier.id}
                                  value={supplier.nombre}
                                  onSelect={() => handleSelectSupplier(supplier)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.proveedorId === supplier.id ? "opacity-100" : "opacity-0",
                                    )}
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium">{supplier.nombre}</p>
                                    {supplier.rfc && (
                                      <p className="text-xs text-muted-foreground">RFC: {supplier.rfc}</p>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {selectedSupplier && (
                      <div className="p-2 border rounded-lg bg-muted/30 text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <Info className="w-3 h-3 text-muted-foreground" />
                          <span className="font-medium">Info rápida:</span>
                        </div>
                        {selectedSupplier.diasCredito && <p>Crédito: {selectedSupplier.diasCredito} días</p>}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Producto *</Label>
                    <Popover open={openProductCombo} onOpenChange={setOpenProductCombo}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openProductCombo}
                          className="w-full justify-between bg-transparent"
                        >
                          {formData.nombre || "Seleccionar producto..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Buscar o escribir nuevo producto..."
                            value={productSearch}
                            onValueChange={setProductSearch}
                          />
                          <CommandList>
                            {filteredProducts.length === 0 && productSearch.trim() && (
                              <CommandEmpty>
                                <div className="py-4 space-y-3">
                                  <p className="text-sm text-muted-foreground">No se encontró producto.</p>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    className="w-full"
                                    onClick={handleCreateNewProduct}
                                    disabled={creatingNewProduct}
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    {creatingNewProduct ? "Creando..." : `Crear producto "${productSearch}"`}
                                  </Button>
                                </div>
                              </CommandEmpty>
                            )}
                            {filteredProducts.length === 0 && !productSearch.trim() && (
                              <CommandEmpty>Escribe para buscar o crear un producto.</CommandEmpty>
                            )}
                            <CommandGroup>
                              {filteredProducts.map((prod) => (
                                <CommandItem key={prod.id} value={prod.name} onSelect={() => handleSelectProduct(prod)}>
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.productoId === prod.id ? "opacity-100" : "opacity-0",
                                    )}
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium">{prod.name}</p>
                                    {prod.description && (
                                      <p className="text-xs text-muted-foreground truncate">{prod.description}</p>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Product Details */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      value={formData.sku || ""}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="codigoProveedor">Código del Proveedor</Label>
                    <Input
                      id="codigoProveedor"
                      value={formData.codigoProveedor || ""}
                      onChange={(e) => setFormData({ ...formData, codigoProveedor: e.target.value })}
                      placeholder="Código interno del proveedor"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombreProveedor">Nombre según Proveedor</Label>
                  <Input
                    id="nombreProveedor"
                    value={formData.nombreProveedor || ""}
                    onChange={(e) => setFormData({ ...formData, nombreProveedor: e.target.value })}
                    placeholder="Como lo llama el proveedor"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion || ""}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="unidadMedida">Unidad de Medida</Label>
                    <Select
                      value={formData.unidadMedida || "PZA"}
                      onValueChange={(value) => setFormData({ ...formData, unidadMedida: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_OPTIONS.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unidadCompra">Unidad de Compra</Label>
                    <Select
                      value={formData.unidadCompra || "PZA"}
                      onValueChange={(value) => setFormData({ ...formData, unidadCompra: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_OPTIONS.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unidadesPorPresentacion">Factor de Conversión</Label>
                    <Input
                      id="unidadesPorPresentacion"
                      type="text"
                      value={formData.unidadesPorPresentacion || 1}
                      onChange={(e) => {
                        const val = e.target.value
                        const parsed = Number.parseFloat(val)
                        if (!Number.isNaN(parsed) && parsed > 0) {
                          setFormData({ ...formData, unidadesPorPresentacion: parsed })
                        } else if (val === "") {
                          setFormData({ ...formData, unidadesPorPresentacion: 1 })
                        }
                      }}
                      placeholder="1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Trazabilidad (Caducidad y Lotes)</Label>

                  <div className="space-y-3">
                    <Label className="text-sm">Tipo de Seguimiento</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, trackingType: "ninguno" })}
                        className={cn(
                          "p-4 border-2 rounded-lg flex flex-col items-center justify-center gap-2 transition-all hover:bg-muted/50",
                          formData.trackingType === "ninguno"
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background",
                        )}
                      >
                        <Package className="w-8 h-8" />
                        <div className="text-center">
                          <p className="font-medium">Ninguno</p>
                          <p className="text-xs text-muted-foreground">Sin seguimiento</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, trackingType: "lote" })}
                        className={cn(
                          "p-4 border-2 rounded-lg flex flex-col items-center justify-center gap-2 transition-all hover:bg-muted/50",
                          formData.trackingType === "lote"
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background",
                        )}
                      >
                        <Hash className="w-8 h-8" />
                        <div className="text-center">
                          <p className="font-medium">Lote</p>
                          <p className="text-xs text-muted-foreground">Por lotes de producción</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, trackingType: "serie" })}
                        className={cn(
                          "p-4 border-2 rounded-lg flex flex-col items-center justify-center gap-2 transition-all hover:bg-muted/50",
                          formData.trackingType === "serie"
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background",
                        )}
                      >
                        <Barcode className="w-8 h-8" />
                        <div className="text-center">
                          <p className="font-medium">Serie</p>
                          <p className="text-xs text-muted-foreground">Individual por serie</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {(formData.trackingType === "lote" || formData.trackingType === "serie") && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/10">
                      <Label className="text-sm font-medium">Captura Operativa (para recepción)</Label>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="loteInicial">
                            {formData.trackingType === "lote" ? "Lote Inicial" : "Serie Inicial"}
                          </Label>
                          <Input
                            id="loteInicial"
                            value={(formData as any).loteInicial || ""}
                            onChange={(e) => setFormData({ ...formData, loteInicial: e.target.value } as any)}
                            placeholder={formData.trackingType === "lote" ? "Ej: Lote 1" : "Ej: SN-001"}
                          />
                          <p className="text-xs text-muted-foreground">
                            Sugerencia: {formData.trackingType === "lote" ? "Lote 1" : "SN-001"}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="almacenDestino">Almacén Destino</Label>
                          <Select
                            value={(formData as any).almacenDestinoId || ""}
                            onValueChange={(value) => {
                              const warehouse = warehouses.find((w) => w.id === value)
                              setFormData({
                                ...formData,
                                almacenDestinoId: value,
                                almacenDestinoNombre: warehouse?.nombre || "",
                              } as any)
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar almacén" />
                            </SelectTrigger>
                            <SelectContent>
                              {warehouses
                                .filter((w) => w.estado === "activo")
                                .map((warehouse) => (
                                  <SelectItem key={warehouse.id} value={warehouse.id}>
                                    {warehouse.nombre}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                    <div>
                      <Label htmlFor="requiresExpiry" className="cursor-pointer">
                        Requiere caducidad
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">Producto con fecha de vencimiento</p>
                    </div>
                    <Switch
                      id="requiresExpiry"
                      checked={formData.requiresExpiry || false}
                      onCheckedChange={(checked) => setFormData({ ...formData, requiresExpiry: checked })}
                    />
                  </div>

                  {formData.requiresExpiry && (
                    <div className="space-y-2 p-4 border rounded-lg bg-muted/10">
                      <Label htmlFor="fechaCaducidad">Fecha de Caducidad *</Label>
                      <Popover open={openExpiryCalendar} onOpenChange={setOpenExpiryCalendar}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal bg-transparent"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {(formData as any).fechaCaducidad ? (
                              format(new Date((formData as any).fechaCaducidad), "PPP", { locale: es })
                            ) : (
                              <span>Seleccionar fecha de caducidad</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              (formData as any).fechaCaducidad ? new Date((formData as any).fechaCaducidad) : undefined
                            }
                            onSelect={(date) => {
                              setFormData({ ...formData, fechaCaducidad: date?.toISOString() || null } as any)
                              setOpenExpiryCalendar(false)
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <p className="text-xs text-muted-foreground">Fecha específica de vencimiento del producto</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="precios" className="space-y-6 mt-0">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="monedaPrincipal">Moneda Base *</Label>
                    <Select
                      value={formData.monedaPrincipal || "MXN"}
                      onValueChange={(value) => setFormData({ ...formData, monedaPrincipal: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                        <SelectItem value="USD">USD - Dólar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="precioBase">Precio Base (sin IVA) *</Label>
                    <Input
                      id="precioBase"
                      type="text"
                      value={formData.precioBase || 0}
                      onChange={(e) => {
                        const val = e.target.value
                        const parsed = Number.parseFloat(val)
                        if (!Number.isNaN(parsed) && parsed >= 0) {
                          setFormData({ ...formData, precioBase: parsed })
                        } else if (val === "") {
                          setFormData({ ...formData, precioBase: 0 })
                        }
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tasaIVA">IVA (%)</Label>
                  <Input
                    id="tasaIVA"
                    type="text"
                    value={(formData as any).tasaIVA || 16}
                    onChange={(e) => {
                      const val = e.target.value
                      const parsed = Number.parseFloat(val)
                      if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 100) {
                        setFormData({ ...formData, tasaIVA: parsed } as any)
                      } else if (val === "") {
                        setFormData({ ...formData, tasaIVA: 0 } as any)
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Porcentaje de IVA aplicable (generalmente 16% en México)
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Tipos de Cambio</Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="usdToMxn" className="text-sm">
                        USD → MXN
                      </Label>
                      <Input
                        id="usdToMxn"
                        type="text"
                        value={formData.tiposCambio?.usdToMxn || 20}
                        onChange={(e) => {
                          const val = e.target.value
                          const parsed = Number.parseFloat(val)
                          if (!Number.isNaN(parsed) && parsed > 0) {
                            setFormData({
                              ...formData,
                              tiposCambio: {
                                ...formData.tiposCambio,
                                usdToMxn: parsed,
                              },
                            })
                          } else if (val === "") {
                            setFormData({
                              ...formData,
                              tiposCambio: {
                                ...formData.tiposCambio,
                                usdToMxn: 20,
                              },
                            })
                          }
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="eurToMxn" className="text-sm">
                        EUR → MXN
                      </Label>
                      <Input
                        id="eurToMxn"
                        type="text"
                        value={formData.tiposCambio?.eurToMxn || 22}
                        onChange={(e) => {
                          const val = e.target.value
                          const parsed = Number.parseFloat(val)
                          if (!Number.isNaN(parsed) && parsed > 0) {
                            setFormData({
                              ...formData,
                              tiposCambio: {
                                ...formData.tiposCambio,
                                eurToMxn: parsed,
                              },
                            })
                          } else if (val === "") {
                            setFormData({
                              ...formData,
                              tiposCambio: {
                                ...formData.tiposCambio,
                                eurToMxn: 22,
                              },
                            })
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Precios Calculados</Label>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="p-4 border rounded-lg bg-muted/20 space-y-2">
                      <p className="text-sm text-muted-foreground">MXN</p>
                      <div className="space-y-1">
                        <p className="text-sm">Subtotal: ${calculatedPrices.subtotal.MXN.toFixed(2)}</p>
                        <p className="text-sm">IVA: ${calculatedPrices.iva.MXN.toFixed(2)}</p>
                        <p className="text-xl font-bold border-t pt-1">
                          Total: ${calculatedPrices.total.MXN.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg bg-muted/20 space-y-2">
                      <p className="text-sm text-muted-foreground">USD</p>
                      <div className="space-y-1">
                        <p className="text-sm">Subtotal: ${calculatedPrices.subtotal.USD.toFixed(2)}</p>
                        <p className="text-sm">IVA: ${calculatedPrices.iva.USD.toFixed(2)}</p>
                        <p className="text-xl font-bold border-t pt-1">
                          Total: ${calculatedPrices.total.USD.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg bg-muted/20 space-y-2">
                      <p className="text-sm text-muted-foreground">EUR</p>
                      <div className="space-y-1">
                        <p className="text-sm">Subtotal: €{calculatedPrices.subtotal.EUR.toFixed(2)}</p>
                        <p className="text-sm">IVA: €{calculatedPrices.iva.EUR.toFixed(2)}</p>
                        <p className="text-xl font-bold border-t pt-1">
                          Total: €{calculatedPrices.total.EUR.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="descuentos" className="space-y-6 mt-0">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Descuentos por Volumen</Label>

                  {volumeDiscounts.length === 0 ? (
                    <div className="p-8 border-2 border-dashed rounded-lg text-center">
                      <p className="text-sm text-muted-foreground mb-4">No hay descuentos por volumen configurados</p>
                      <Button type="button" onClick={addVolumeDiscount} variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Descuento
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {volumeDiscounts.map((discount) => (
                        <div key={discount.id} className="p-4 border rounded-lg bg-muted/20 space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Descuento por Volumen</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeVolumeDiscount(discount.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label className="text-sm">Porcentaje de Descuento (%)</Label>
                              <Input
                                type="text"
                                value={discount.porcentajeDescuento}
                                onChange={(e) => {
                                  const val = e.target.value
                                  const parsed = Number.parseFloat(val)
                                  if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 100) {
                                    updateVolumeDiscount(discount.id, "porcentajeDescuento", parsed)
                                  } else if (val === "") {
                                    updateVolumeDiscount(discount.id, "porcentajeDescuento", 0)
                                  }
                                }}
                                placeholder="0"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm">Cantidad Mínima</Label>
                              <Input
                                type="text"
                                value={discount.cantidadMinima}
                                onChange={(e) => {
                                  const val = e.target.value
                                  const parsed = Number.parseInt(val)
                                  if (!Number.isNaN(parsed) && parsed >= 0) {
                                    updateVolumeDiscount(discount.id, "cantidadMinima", parsed)
                                  } else if (val === "") {
                                    updateVolumeDiscount(discount.id, "cantidadMinima", 0)
                                  }
                                }}
                                placeholder="0"
                              />
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label className="text-sm">Vigencia Inicio</Label>
                              <Popover
                                open={openDiscountStartCal === discount.id}
                                onOpenChange={(open) => setOpenDiscountStartCal(open ? discount.id : null)}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start text-left font-normal bg-transparent"
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {discount.vigenciaInicio ? (
                                      format(discount.vigenciaInicio, "PPP", { locale: es })
                                    ) : (
                                      <span>Seleccionar fecha</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={discount.vigenciaInicio || undefined}
                                    onSelect={(date) => {
                                      updateVolumeDiscount(discount.id, "vigenciaInicio", date || null)
                                      setOpenDiscountStartCal(null)
                                    }}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm">Vigencia Fin</Label>
                              <Popover
                                open={openDiscountEndCal === discount.id}
                                onOpenChange={(open) => setOpenDiscountEndCal(open ? discount.id : null)}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start text-left font-normal bg-transparent"
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {discount.vigenciaFin ? (
                                      format(discount.vigenciaFin, "PPP", { locale: es })
                                    ) : (
                                      <span>Seleccionar fecha</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={discount.vigenciaFin || undefined}
                                    onSelect={(date) => {
                                      updateVolumeDiscount(discount.id, "vigenciaFin", date || null)
                                      setOpenDiscountEndCal(null)
                                    }}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        </div>
                      ))}

                      <Button
                        type="button"
                        onClick={addVolumeDiscount}
                        variant="outline"
                        size="sm"
                        className="w-full bg-transparent"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Otro Descuento
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="entrega" className="space-y-6 mt-0">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Tiempos de Entrega (días)</Label>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="leadTimeMin">Mínimo</Label>
                      <Input
                        id="leadTimeMin"
                        type="text"
                        value={formData.leadTimeMin || 5}
                        onChange={(e) => {
                          const val = e.target.value
                          const parsed = Number.parseInt(val)
                          if (!Number.isNaN(parsed) && parsed >= 0) {
                            setFormData({ ...formData, leadTimeMin: parsed })
                          } else if (val === "") {
                            setFormData({ ...formData, leadTimeMin: 0 })
                          }
                        }}
                        placeholder="5"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="leadTimeMax">Máximo</Label>
                      <Input
                        id="leadTimeMax"
                        type="text"
                        value={formData.leadTimeMax || 10}
                        onChange={(e) => {
                          const val = e.target.value
                          const parsed = Number.parseInt(val)
                          if (!Number.isNaN(parsed) && parsed >= 0) {
                            setFormData({ ...formData, leadTimeMax: parsed })
                          } else if (val === "") {
                            setFormData({ ...formData, leadTimeMax: 0 })
                          }
                        }}
                        placeholder="10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="leadTimePromedio">Promedio</Label>
                      <Input
                        id="leadTimePromedio"
                        type="text"
                        value={formData.leadTimePromedio || 7}
                        onChange={(e) => {
                          const val = e.target.value
                          const parsed = Number.parseInt(val)
                          if (!Number.isNaN(parsed) && parsed >= 0) {
                            setFormData({ ...formData, leadTimePromedio: parsed })
                          } else if (val === "") {
                            setFormData({ ...formData, leadTimePromedio: 0 })
                          }
                        }}
                        placeholder="7"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">Cantidades de Pedido</Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cantidadMinima">Cantidad Mínima</Label>
                      <Input
                        id="cantidadMinima"
                        type="text"
                        value={formData.cantidadMinima || 1}
                        onChange={(e) => {
                          const val = e.target.value
                          const parsed = Number.parseInt(val)
                          if (!Number.isNaN(parsed) && parsed >= 0) {
                            setFormData({ ...formData, cantidadMinima: parsed })
                          } else if (val === "") {
                            setFormData({ ...formData, cantidadMinima: 0 })
                          }
                        }}
                        placeholder="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cantidadMaxima">Cantidad Máxima</Label>
                      <Input
                        id="cantidadMaxima"
                        type="text"
                        value={formData.cantidadMaxima || 0}
                        onChange={(e) => {
                          const val = e.target.value
                          const parsed = Number.parseInt(val)
                          if (!Number.isNaN(parsed) && parsed >= 0) {
                            setFormData({ ...formData, cantidadMaxima: parsed })
                          } else if (val === "") {
                            setFormData({ ...formData, cantidadMaxima: 0 })
                          }
                        }}
                        placeholder="Sin límite"
                      />
                      <p className="text-xs text-muted-foreground">0 = sin límite</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notasEntrega">Notas de Entrega</Label>
                  <Textarea
                    id="notasEntrega"
                    value={formData.notasEntrega || ""}
                    onChange={(e) => setFormData({ ...formData, notasEntrega: e.target.value })}
                    rows={4}
                    placeholder="Instrucciones especiales de entrega, horarios, condiciones de empaque, etc."
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                  <div>
                    <Label htmlFor="activo" className="cursor-pointer">
                      Producto Activo
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Desactivar si el producto ya no está disponible
                    </p>
                  </div>
                  <Switch
                    id="activo"
                    checked={formData.activo !== false}
                    onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="mt-4 shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Producto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
