"use client"

import { useMemo, useCallback } from "react"
import { useFirestore } from "./use-firestore"
import { useAuth } from "./use-auth"
import { useWarehouseData } from "./use-warehouse-data"
import { COLLECTIONS } from "@/lib/firestore"
import type {
  ProductionOrder,
  ProductFormula,
  MaterialPlanning,
  QualityCertificate,
  ProductionResult,
  Product,
  SupplierProduct,
  ReservedMaterial,
} from "@/lib/types"
import { orderBy } from "firebase/firestore"

export function useProductionData() {
  const { user } = useAuth()
  const companyId = user?.companyId || user?.uid || ""
  const { createMovement, inventoryStock, selectLotsForFulfillment } = useWarehouseData()

  console.log("[v0] useProductionData: Initializing with companyId:", companyId)

  const {
    items: orders,
    loading: loadingOrders,
    create: createOrderBase,
    update: updateOrderBase,
    remove: removeOrder,
  } = useFirestore<ProductionOrder>(COLLECTIONS.productionOrders, [orderBy("startDate", "desc")], true)

  const {
    items: formulas,
    loading: loadingFormulas,
    create: createFormulaBase,
    update: updateFormula,
  } = useFirestore<ProductFormula>(COLLECTIONS.productFormulas, [orderBy("productName", "asc")], true)

  const {
    items: materials,
    loading: loadingMaterials,
    create: createMaterialPlanningBase,
    update: updateMaterialPlanning,
  } = useFirestore<MaterialPlanning>(COLLECTIONS.materialPlanning, [orderBy("material", "asc")], true)

  const {
    items: qualityCerts,
    loading: loadingQuality,
    create: createQualityCertBase,
    update: updateQualityCert,
  } = useFirestore<QualityCertificate>(COLLECTIONS.qualityCertificates, [orderBy("inspectionDate", "desc")], true)

  const {
    items: results,
    loading: loadingResults,
    create: createResultBase,
  } = useFirestore<ProductionResult>(COLLECTIONS.productionResults, [orderBy("productionDate", "desc")], true)

  const { items: products, loading: loadingProducts } = useFirestore<Product>(
    COLLECTIONS.products,
    [orderBy("name", "asc")],
    true,
  )

  const { items: supplierProducts, loading: loadingSupplierProducts } = useFirestore<SupplierProduct>(
    COLLECTIONS.supplierProducts,
    [orderBy("productoNombre", "asc")],
    true,
  )

  const loading =
    loadingOrders ||
    loadingFormulas ||
    loadingMaterials ||
    loadingQuality ||
    loadingResults ||
    loadingProducts ||
    loadingSupplierProducts

  const createOrder = useCallback(
    async (data: Omit<ProductionOrder, "id" | "createdAt" | "updatedAt" | "companyId" | "userId">) => {
      if (!data.almacenOrigenId || !data.almacenDestinoId) {
        throw new Error("Debe seleccionar almacén origen y destino")
      }

      console.log("[v0] Creating production order:", data)

      const sanitized = {
        ...data,
        folio: data.folio || `PROD-${Date.now()}`,
        completed: 0,
        materialsReserved: false,
        materialsConsumed: false,
        finishedProductGenerated: false,
        reservedMaterials: [],
        companyId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      return await createOrderBase(sanitized as any)
    },
    [createOrderBase, companyId],
  )

  const reserveMaterials = useCallback(
    async (orderId: string) => {
      const order = orders.find((o) => o.id === orderId)
      if (!order) throw new Error("Orden no encontrada")
      if (order.materialsReserved) throw new Error("Materiales ya reservados")

      const formula = formulas.find((f) => f.id === order.formulaId && f.isActive)
      if (!formula) throw new Error("Fórmula no encontrada o inactiva")

      console.log("[v0] Reserving materials for order:", order.folio)

      // Calculate required materials based on quantity
      const quantityMultiplier = order.quantity / formula.outputQuantity
      const reserved: ReservedMaterial[] = []

      for (const component of formula.components) {
        const requiredQty = component.quantity * quantityMultiplier

        // Check if material is available in origin warehouse
        const stock = inventoryStock.find(
          (s) => s.productoId === component.materialId && s.almacenId === order.almacenOrigenId,
        )

        if (!stock || stock.cantidadDisponible < requiredQty) {
          throw new Error(
            `Inventario insuficiente de ${component.materialName}. Disponible: ${stock?.cantidadDisponible || 0}, Requerido: ${requiredQty}`,
          )
        }

        reserved.push({
          materialId: component.materialId,
          materialName: component.materialName,
          quantity: requiredQty,
          unit: component.unit,
          almacenId: order.almacenOrigenId,
          almacenNombre: order.almacenOrigenNombre,
          reservedAt: new Date().toISOString(),
        })
      }

      // Update order with reserved materials
      await updateOrderBase(orderId, {
        materialsReserved: true,
        reservedMaterials: reserved,
        status: "in_process",
        updatedAt: new Date().toISOString(),
      } as any)

      return reserved
    },
    [orders, formulas, inventoryStock, updateOrderBase],
  )

  const completeProduction = useCallback(
    async (orderId: string, producedQty: number, secondQualityQty = 0, wasteQty = 0): Promise<ProductionResult> => {
      const order = orders.find((o) => o.id === orderId)
      if (!order) throw new Error("Orden no encontrada")
      if (!order.materialsReserved) throw new Error("Debe reservar materiales primero")
      if (order.materialsConsumed) throw new Error("Materiales ya consumidos")

      // Check quality certificate if required
      const qualityCert = qualityCerts.find((qc) => qc.productionOrderId === orderId)
      if (qualityCert && qualityCert.blocksClosure && qualityCert.status !== "approved") {
        throw new Error("No puede completar la orden sin certificado de calidad aprobado")
      }

      console.log("[v0] Completing production for order:", order.folio)

      const materialsUsed = []

      // 1. Consume materials from origin warehouse using FIFO/FEFO
      for (const reserved of order.reservedMaterials || []) {
        const lots = selectLotsForFulfillment(order.almacenOrigenId, reserved.materialId, reserved.quantity)

        for (const lot of lots) {
          const movement = await createMovement({
            folio: `PROD-CONS-${Date.now()}-${reserved.materialId.slice(0, 6)}`,
            almacenId: order.almacenOrigenId,
            almacenNombre: order.almacenOrigenNombre,
            productoId: reserved.materialId,
            productoNombre: reserved.materialName,
            sku: "",
            tipo: "produccion_consumo",
            cantidad: lot.cantidad,
            cantidadAnterior: 0,
            cantidadNueva: 0,
            costoUnitario: lot.costoUnitario,
            fecha: new Date().toISOString(),
            motivo: `Consumo por producción ${order.folio}`,
            referencia: order.folio,
            ordenProduccionId: orderId,
            ordenProduccionFolio: order.folio,
            lote: lot.lote,
            fechaCaducidad: lot.fechaCaducidad,
          })

          materialsUsed.push({
            materialId: reserved.materialId,
            materialName: reserved.materialName,
            sku: "",
            quantityUsed: lot.cantidad,
            unit: reserved.unit,
            lote: lot.lote,
            costoUnitario: lot.costoUnitario,
            costoTotal: lot.cantidad * lot.costoUnitario,
            almacenOrigenId: order.almacenOrigenId,
            movementId: movement.id,
          })
        }
      }

      // 2. Generate finished product entry to destination warehouse
      const batchNumber = `LOTE-${order.folio}-${Date.now()}`
      const totalCostMaterials = materialsUsed.reduce((sum, m) => sum + m.costoTotal, 0)
      const formula = formulas.find((f) => f.id === order.formulaId)
      const totalCost = totalCostMaterials + (formula?.laborCost || 0) + (formula?.manufacturingCost || 0)
      const costPerUnit = totalCost / producedQty

      await createMovement({
        folio: `PROD-OUT-${Date.now()}`,
        almacenId: order.almacenDestinoId,
        almacenNombre: order.almacenDestinoNombre,
        productoId: order.productId,
        productoNombre: order.productName,
        sku: "",
        tipo: "produccion_salida",
        cantidad: producedQty,
        cantidadAnterior: 0,
        cantidadNueva: 0,
        costoUnitario: costPerUnit,
        fecha: new Date().toISOString(),
        motivo: `Producción completada ${order.folio}`,
        referencia: order.folio,
        ordenProduccionId: orderId,
        ordenProduccionFolio: order.folio,
        lote: batchNumber,
      })

      // 3. Update order status
      await updateOrderBase(orderId, {
        materialsConsumed: true,
        finishedProductGenerated: true,
        completed: producedQty,
        status: "completed",
        updatedAt: new Date().toISOString(),
      } as any)

      // 4. Create production result
      const efficiency = (producedQty / order.quantity) * 100
      const totalOutput = producedQty + secondQualityQty + wasteQty
      const yieldPercent = totalOutput > 0 ? ((producedQty + secondQualityQty) / totalOutput) * 100 : 0

      const result = await createResultBase({
        productionOrderId: orderId,
        orderNumber: order.folio,
        productName: order.productName,
        sku: "",
        plannedQuantity: order.quantity,
        producedQuantity: producedQty,
        secondQualityQuantity: secondQualityQty,
        wasteQuantity: wasteQty,
        efficiency,
        yield: yieldPercent,
        productionDate: new Date().toISOString(),
        batchNumber,
        almacenDestinoId: order.almacenDestinoId,
        almacenDestinoNombre: order.almacenDestinoNombre,
        materialsUsed,
        qualityCertificateId: qualityCert?.id,
        companyId,
        userId: user?.uid || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any)

      console.log("[v0] Production completed successfully:", result)
      return result
    },
    [
      orders,
      formulas,
      qualityCerts,
      createMovement,
      selectLotsForFulfillment,
      updateOrderBase,
      createResultBase,
      companyId,
      user,
    ],
  )

  const calculateMaterialRequirements = useCallback(async () => {
    console.log("[v0] Calculating material requirements...")

    const activeOrders = (orders || []).filter((o) => o.status === "pending" || o.status === "in_process")

    // Aggregate material requirements
    const requirements = new Map<
      string,
      {
        materialId: string
        materialName: string
        sku: string
        required: number
        reserved: number
        unit: string
        supplierId?: string
        supplierName?: string
        leadTimeDays?: number
      }
    >()

    for (const order of activeOrders) {
      const formula = formulas.find((f) => f.id === order.formulaId && f.isActive)
      if (!formula) continue

      const quantityMultiplier = order.quantity / formula.outputQuantity

      for (const component of formula.components) {
        const requiredQty = component.quantity * quantityMultiplier
        const key = component.materialId

        if (requirements.has(key)) {
          const existing = requirements.get(key)!
          existing.required += requiredQty
          if (order.materialsReserved) {
            existing.reserved += requiredQty
          }
        } else {
          // Find supplier info
          const supplierProduct = supplierProducts.find((sp) => sp.productoId === component.materialId)

          requirements.set(key, {
            materialId: component.materialId,
            materialName: component.materialName,
            sku: component.sku,
            required: requiredQty,
            reserved: order.materialsReserved ? requiredQty : 0,
            unit: component.unit,
            supplierId: supplierProduct?.proveedorId,
            supplierName: supplierProduct?.proveedorNombre,
            leadTimeDays: supplierProduct?.leadTime,
          })
        }
      }
    }

    // Update material planning with calculated values
    for (const [materialId, req] of requirements.entries()) {
      const stock = inventoryStock.find((s) => s.productoId === materialId)
      const available = stock?.cantidadActual || 0
      const shortage = Math.max(0, req.required - (available - req.reserved))

      const status: "sufficient" | "pending" | "critical" =
        shortage === 0 ? "sufficient" : shortage > req.required * 0.5 ? "critical" : "pending"

      // Calculate suggested order quantity (EOQ simplified)
      const suggestedQty = shortage > 0 ? Math.ceil(shortage * 1.2) : 0 // Add 20% buffer

      // Check if planning record exists
      const existing = materials.find((m) => m.materialId === materialId)

      if (existing) {
        await updateMaterialPlanning(existing.id, {
          available,
          reserved: req.reserved,
          required: req.required,
          shortage,
          status,
          suggestedOrderQuantity: suggestedQty,
          supplierId: req.supplierId,
          supplierName: req.supplierName,
          leadTimeDays: req.leadTimeDays,
          lastUpdated: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any)
      } else {
        await createMaterialPlanningBase({
          material: req.materialName,
          materialId: req.materialId,
          sku: req.sku,
          available,
          reserved: req.reserved,
          required: req.required,
          shortage,
          unit: req.unit,
          status,
          suggestedOrderQuantity: suggestedQty,
          supplierId: req.supplierId,
          supplierName: req.supplierName,
          leadTimeDays: req.leadTimeDays,
          lastUpdated: new Date().toISOString(),
          companyId,
          userId: user?.uid || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any)
      }
    }

    console.log("[v0] Material requirements calculated:", requirements.size, "materials")
  }, [
    orders,
    formulas,
    inventoryStock,
    supplierProducts,
    materials,
    updateMaterialPlanning,
    createMaterialPlanningBase,
    companyId,
    user,
  ])

  const createFormula = useCallback(
    async (data: Omit<ProductFormula, "id" | "createdAt" | "updatedAt" | "companyId" | "userId">) => {
      if (!data.productId || !data.components || data.components.length === 0) {
        throw new Error("La fórmula debe tener al menos un componente")
      }

      console.log("[v0] Creating formula:", data)

      const sanitized = {
        ...data,
        totalCost:
          data.components.reduce((sum: any, c: any) => sum + c.quantity * c.costPerUnit, 0) +
          data.laborCost +
          data.manufacturingCost,
        companyId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      return await createFormulaBase(sanitized as any)
    },
    [createFormulaBase, companyId],
  )

  const createQualityCert = useCallback(
    async (data: Omit<QualityCertificate, "id" | "createdAt" | "updatedAt" | "companyId" | "userId">) => {
      console.log("[v0] Creating quality certificate:", data)

      const sanitized = {
        ...data,
        blocksClosure: data.blocksClosure ?? data.status === "rejected",
        companyId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      return await createQualityCertBase(sanitized as any)
    },
    [createQualityCertBase, companyId],
  )

  // Calculate metrics
  const ordenesActivas = useMemo(() => {
    return (orders || []).filter((o) => o.status === "pending" || o.status === "in_process").length
  }, [orders])

  const enProduccion = useMemo(() => {
    return (orders || []).filter((o) => o.status === "in_process").length
  }, [orders])

  const eficienciaPromedio = useMemo(() => {
    if (!results || results.length === 0) return 0
    const totalEfficiency = (results || []).reduce((sum, r) => sum + (r.efficiency || 0), 0)
    return Math.round(totalEfficiency / results.length)
  }, [results])

  const materialesFaltantes = useMemo(() => {
    return (materials || []).filter((m) => m.status === "critical" || m.status === "pending").length
  }, [materials])

  return {
    createResult: createResultBase,
    orders: orders || [],
    formulas: formulas || [],
    materials: materials || [],
    qualityCertificates: qualityCerts || [],
    results: results || [],
    products: products || [],
    createOrder,
    updateOrder: updateOrderBase,
    removeOrder,
    createFormula,
    updateFormula,
    createQualityCert,
    updateQualityCert,
    updateMaterialPlanning,
    reserveMaterials,
    completeProduction,
    calculateMaterialRequirements,
    ordenesActivas,
    enProduccion,
    eficienciaPromedio,
    materialesFaltantes,
    loading,
  }
}
