"use client"

import { useMemo, useCallback } from "react"
import { useFirestore } from "./use-firestore"
import { useAuth } from "./use-auth"
import { COLLECTIONS } from "@/lib/firestore"
import type { Warehouse, StockMovement, WarehouseTransfer, PhysicalCount, ReorderRule, Product } from "@/lib/types"
import { orderBy, where } from "firebase/firestore"
import { calculateInventoryFromLedger, selectLotsFIFO } from "@/lib/utils/inventory-ledger"

export function useWarehouseData() {
  const { user } = useAuth()
  const companyId = user?.companyId || user?.uid || ""
  const companyFilter = companyId ? [where("companyId", "==", companyId)] : []

  console.log("[v0] useWarehouseData: Initializing with companyId:", companyId)

  const {
    items: warehouses,
    loading: loadingWarehouses,
    create: createWarehouseBase,
    update: updateWarehouse,
    remove: removeWarehouse,
  } = useFirestore<Warehouse>(
    COLLECTIONS.warehouses,
    [...companyFilter, orderBy("nombre", "asc")],
    true,
    false,
  )

  const {
    items: stockMovements,
    loading: loadingMovements,
    create: createMovementBase,
    update: updateMovement,
    remove: removeMovement,
  } = useFirestore<StockMovement>(
    COLLECTIONS.stockMovements,
    [...companyFilter, orderBy("fecha", "desc")],
    true,
    false,
  )

  const {
    items: transfers,
    loading: loadingTransfers,
    create: createTransferBase,
    update: updateTransferBase,
    remove: removeTransfer,
  } = useFirestore<WarehouseTransfer>(
    COLLECTIONS.warehouseTransfers,
    [...companyFilter, orderBy("fechaSolicitud", "desc")],
    true,
    false,
  )

  const {
    items: physicalCounts,
    loading: loadingCounts,
    create: createPhysicalCountBase,
    update: updatePhysicalCountBase,
    remove: removePhysicalCount,
  } = useFirestore<PhysicalCount>(
    COLLECTIONS.physicalCounts,
    [...companyFilter, orderBy("fechaConteo", "desc")],
    true,
    false,
  )

  const {
    items: reorderRules,
    loading: loadingRules,
    create: createReorderRule,
    update: updateReorderRule,
    remove: removeReorderRule,
  } = useFirestore<ReorderRule>(
    COLLECTIONS.reorderRules,
    [...companyFilter, orderBy("productoNombre", "asc")],
    true,
    false,
  )

  const { items: products, loading: loadingProducts } = useFirestore<Product>(
    COLLECTIONS.products,
    [...companyFilter, orderBy("name", "asc")],
    true,
    false,
  )

  const loading =
    loadingWarehouses || loadingMovements || loadingTransfers || loadingCounts || loadingRules || loadingProducts

  const inventoryStock = useMemo(() => {
    if (!stockMovements) return []
    return calculateInventoryFromLedger(stockMovements)
  }, [stockMovements])

  console.log("[v0] useWarehouseData: Calculated inventory from ledger", {
    warehouses: warehouses?.length,
    movements: stockMovements?.length,
    calculatedStock: inventoryStock.length,
    loading,
  })

  const createWarehouse = useCallback(
    async (data: Omit<Warehouse, "id" | "createdAt" | "updatedAt" | "companyId" | "userId">) => {
      if (!data.nombre || data.nombre.trim() === "") {
        throw new Error("El nombre del almacen es obligatorio")
      }
      if (!data.codigo || data.codigo.trim() === "") {
        throw new Error("El codigo del almacen es obligatorio")
      }
      if (!data.ubicacion || data.ubicacion.trim() === "") {
        throw new Error("La ubicacion del almacen es obligatoria")
      }

      console.log("[v0] Creating warehouse with companyId:", companyId)
      const sanitized = {
        ...data,
        codigo: data.codigo.trim(),
        nombre: data.nombre.trim(),
        ubicacion: data.ubicacion.trim(),
        tipo: data.tipo || "principal",
        estado: data.estado || "activo",
        capacidadMaxima: data.capacidadMaxima || 0,
        direccion: data.direccion || "",
        responsable: data.responsable || "",
        telefono: data.telefono || "",
        email: data.email || "",
        companyId: companyId, // Always include companyId
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      console.log("[v0] Warehouse data with companyId:", sanitized)
      return await createWarehouseBase(sanitized as any)
    },
    [createWarehouseBase, companyId],
  )

  const createMovement = useCallback(
    async (data: Omit<StockMovement, "id" | "createdAt" | "updatedAt" | "companyId" | "userId">) => {
      console.log("[v0] Creating movement in ledger:", data)

      const producto = products.find((p) => p.id === data.productoId)

      // Calculate quantity changes for ledger
      const currentStock = inventoryStock.find(
        (s) =>
          s.almacenId === data.almacenId &&
          s.productoId === data.productoId &&
          (data.lote ? s.lote === data.lote : !s.lote),
      )

      const cantidadAnterior = currentStock?.cantidadActual || 0
      let cantidadNueva = cantidadAnterior

      if (
        data.tipo === "entrada" ||
        data.tipo === "recepcion_compra" ||
        data.tipo === "transferencia_entrada" ||
        data.tipo === "devolucion_venta" ||
        data.tipo === "produccion_salida"
      ) {
        cantidadNueva = cantidadAnterior + (data.cantidad || 0)
      } else if (
        data.tipo === "salida" ||
        data.tipo === "venta" ||
        data.tipo === "transferencia_salida" ||
        data.tipo === "devolucion_compra" ||
        data.tipo === "produccion_consumo"
      ) {
        cantidadNueva = cantidadAnterior - (data.cantidad || 0)
        if (cantidadNueva < 0) {
          throw new Error(`Inventario insuficiente. Disponible: ${cantidadAnterior}, Solicitado: ${data.cantidad}`)
        }
      } else if (data.tipo === "ajuste") {
        cantidadNueva = data.cantidad || 0
      }

      console.log("[v0] Ledger update:", { cantidadAnterior, cantidadNueva, tipo: data.tipo, lote: data.lote })

      // Create movement record with full traceability
      const sanitized = {
        ...data,
        folio: data.folio || `MOV-${Date.now()}`,
        unidadBase: producto?.baseUnit || data.unidadBase || "PZA",
        cantidadAnterior,
        cantidadNueva,
        costoUnitario: data.costoUnitario || 0,
        costoTotal: (data.cantidad || 0) * (data.costoUnitario || 0),
        fecha: data.fecha || new Date().toISOString(),
        motivo: data.motivo || "",
        referencia: data.referencia || "",
        usuarioId: user?.uid || "",
        usuarioNombre: user?.email || "Usuario",
        lote: data.lote || null,
        serie: data.serie || null,
        fechaCaducidad: data.fechaCaducidad || null,
        proveedorId: data.proveedorId || null,
        proveedorNombre: data.proveedorNombre || null,
        ordenCompraId: data.ordenCompraId || null,
        ordenCompraFolio: data.ordenCompraFolio || null,
        recepcionId: data.recepcionId || null,
        recepcionFolio: data.recepcionFolio || null,
        clienteId: data.clienteId || null,
        clienteNombre: data.clienteNombre || null,
        ordenVentaId: data.ordenVentaId || null,
        ordenVentaFolio: data.ordenVentaFolio || null,
        remisionId: data.remisionId || null,
        remisionFolio: data.remisionFolio || null,
        facturaId: data.facturaId || null,
        facturaFolio: data.facturaFolio || null,
        transferenciaId: data.transferenciaId || null,
        transferenciaFolio: data.transferenciaFolio || null,
        ordenProduccionId: data.ordenProduccionId || null,
        ordenProduccionFolio: data.ordenProduccionFolio || null,
        conteoFisicoId: data.conteoFisicoId || null,
        conteoFisicoFolio: data.conteoFisicoFolio || null,
        companyId: companyId,
        notas: data.notas || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      return await createMovementBase(sanitized as any)
    },
    [inventoryStock, products, createMovementBase, companyId, user],
  )

  const selectLotsForFulfillment = useCallback(
    (almacenId: string, productoId: string, cantidadRequerida: number) => {
      return selectLotsFIFO(stockMovements || [], almacenId, productoId, cantidadRequerida)
    },
    [stockMovements],
  )

  const createTransfer = useCallback(
    async (data: any) => {
      console.log("[v0] Creating transfer:", data)

      const sanitized = {
        folioTransferencia: data.folioTransferencia || `TRF-${Date.now()}`,
        almacenOrigenId: data.almacenOrigenId || "",
        almacenOrigenNombre: data.almacenOrigenNombre || "",
        almacenDestinoId: data.almacenDestinoId || "",
        almacenDestinoNombre: data.almacenDestinoNombre || "",
        productoId: data.productoId || "",
        productoNombre: data.productoNombre || "",
        cantidad: data.cantidad || 0,
        lote: data.lote || null,
        estado: "solicitada" as const,
        fechaSolicitud: new Date().toISOString(),
        solicitadoPor: data.solicitadoPor || user?.email || "Usuario Actual",
        motivo: data.motivo || "",
        companyId: companyId,
        notas: data.notas || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      return await createTransferBase(sanitized as any)
    },
    [createTransferBase, companyId, user],
  )

  const createPhysicalCount = useCallback(
    async (data: any) => {
      console.log("[v0] Creating physical count:", data)

      const sanitized = {
        folioConteo: data.folioConteo || `CNT-${Date.now()}`,
        almacenId: data.almacenId || "",
        almacenNombre: data.almacenNombre || "",
        tipo: data.tipo || "ciclico",
        fechaConteo: data.fechaConteo || new Date().toISOString(),
        estado: "en_progreso" as const,
        iniciadoPor: data.iniciadoPor || user?.email || "Usuario Actual",
        companyId: companyId,
        conteos: data.conteos || [],
        notas: data.notas || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      return await createPhysicalCountBase(sanitized as any)
    },
    [createPhysicalCountBase, companyId, user],
  )

  const updateTransfer = useCallback(
    async (transferId: string, updates: Partial<WarehouseTransfer>) => {
      console.log("[v0] Updating transfer:", transferId, updates)

      const transfer = transfers.find((t) => t.id === transferId)
      if (!transfer) {
        throw new Error("Transfer not found")
      }

      // If completing transfer, create movements
      if (updates.estado === "completada" && transfer.estado === "en_transito") {
        console.log("[v0] Completing transfer - creating movements")

        // Create salida movement from origin
        await createMovement({
          folio: `TRF-OUT-${Date.now()}`,
          almacenId: transfer.almacenOrigenId,
          almacenNombre: transfer.almacenOrigenNombre,
          productoId: transfer.productoId,
          productoNombre: transfer.productoNombre,
          sku: "",
          tipo: "transferencia_salida",
          cantidad: transfer.cantidad,
          cantidadAnterior: 0,
          cantidadNueva: 0,
          fecha: new Date().toISOString(),
          motivo: `Transferencia ${transfer.folioTransferencia}`,
          referencia: transfer.folioTransferencia,
          transferenciaId: transferId,
        })

        // Create entrada movement to destination
        await createMovement({
          folio: `TRF-IN-${Date.now()}`,
          almacenId: transfer.almacenDestinoId,
          almacenNombre: transfer.almacenDestinoNombre,
          productoId: transfer.productoId,
          productoNombre: transfer.productoNombre,
          sku: "",
          tipo: "transferencia_entrada",
          cantidad: transfer.cantidad,
          cantidadAnterior: 0,
          cantidadNueva: 0,
          fecha: new Date().toISOString(),
          motivo: `Transferencia ${transfer.folioTransferencia}`,
          referencia: transfer.folioTransferencia,
          transferenciaId: transferId,
        })
      }

      const sanitized = {
        ...updates,
        updatedAt: new Date().toISOString(),
      }

      return await updateTransferBase(transferId, sanitized as any)
    },
    [transfers, createMovement, updateTransferBase],
  )

  const updatePhysicalCount = useCallback(
    async (countId: string, updates: Partial<PhysicalCount>) => {
      console.log("[v0] Updating physical count:", countId, updates)

      const count = physicalCounts.find((c) => c.id === countId)
      if (!count) {
        throw new Error("Physical count not found")
      }

      // If finalizing, create adjustment movements for differences
      if (updates.estado === "finalizado" && count.estado === "en_progreso") {
        console.log("[v0] Finalizing count - creating adjustments")

        // Get all stock items for this warehouse
        const warehouseStock = inventoryStock.filter((s) => s.almacenId === count.almacenId)

        for (const stock of warehouseStock) {
          // For this example, create adjustment to match system quantity
          // In real implementation, you'd have actual count data in count.conteos
          const systemQty = stock.cantidadActual
          const countedQty = systemQty // TODO: Get from actual count data

          if (systemQty !== countedQty) {
            await createMovement({
              folio: `ADJ-${Date.now()}-${stock.productoId.slice(0, 8)}`,
              almacenId: count.almacenId,
              almacenNombre: count.almacenNombre,
              productoId: stock.productoId,
              productoNombre: stock.productoNombre,
              sku: stock.sku,
              tipo: "ajuste",
              cantidad: countedQty,
              cantidadAnterior: systemQty,
              cantidadNueva: countedQty,
              fecha: new Date().toISOString(),
              motivo: `Ajuste por conteo fisico ${count.folioConteo}`,
              referencia: count.folioConteo,
            })
          }
        }
      }

      const sanitized = {
        ...updates,
        updatedAt: new Date().toISOString(),
      }

      return await updatePhysicalCountBase(countId, sanitized as any)
    },
    [physicalCounts, inventoryStock, createMovement, updatePhysicalCountBase],
  )

  const almacenesActivos = useMemo(() => {
    return (warehouses || []).filter((w) => w.estado === "activo").length
  }, [warehouses])

  const productosTotales = useMemo(() => {
    const uniqueProducts = new Set((inventoryStock || []).map((s) => s.productoId))
    return uniqueProducts.size
  }, [inventoryStock])

  const bajoPuntoReorden = useMemo(() => {
    return (inventoryStock || []).filter((s) => {
      const puntoReorden = s.puntoReorden || s.minimoStock || 0
      return s.cantidadActual <= puntoReorden
    }).length
  }, [inventoryStock])

  const valorTotalInventario = useMemo(() => {
    return inventoryStock.reduce((sum, s) => sum + (s.valorTotal || 0), 0)
  }, [inventoryStock])

  const almacenesEstadisticas = useMemo(() => {
    return (warehouses || []).map((warehouse) => {
      const warehouseStock = (inventoryStock || []).filter((s) => s.almacenId === warehouse.id)
      const valorInventario = warehouseStock.reduce(
        (sum, s) => sum + (s.cantidadActual || 0) * (s.costoPromedio || 0),
        0,
      )

      return {
        ...warehouse,
        productosCantidad: warehouseStock.length,
        valorInventario,
      }
    })
  }, [warehouses, inventoryStock])

  const movimientosRecientes = useMemo(() => {
    return [...(stockMovements || [])].slice(0, 20)
  }, [stockMovements])

  const transferenciasPendientes = useMemo(() => {
    return (transfers || []).filter((t) => t.estado === "solicitada" || t.estado === "aprobada").length
  }, [transfers])

  const transferenciasEnTransito = useMemo(() => {
    return (transfers || []).filter((t) => t.estado === "en_transito").length
  }, [transfers])

  const conteosEnProgreso = useMemo(() => {
    return (physicalCounts || []).filter((c) => c.estado === "en_progreso").length
  }, [physicalCounts])

  return {
    // Collections
    warehouses: warehouses || [],
    inventoryStock,
    stockMovements: stockMovements || [],
    transfers: transfers || [],
    physicalCounts: physicalCounts || [],
    reorderRules: reorderRules || [],
    products: products || [],

    // CRUD methods - Warehouses
    createWarehouse,
    updateWarehouse,
    removeWarehouse,

    // CRUD methods - Movements (ledger-based)
    createMovement,
    updateMovement,
    removeMovement,

    // CRUD methods - Transfers
    createTransfer,
    updateTransfer,
    removeTransfer,

    // CRUD methods - Physical Counts
    createPhysicalCount,
    updatePhysicalCount,
    removePhysicalCount,

    // CRUD methods - Reorder Rules
    createReorderRule,
    updateReorderRule,
    removeReorderRule,

    selectLotsForFulfillment,

    // Metrics
    almacenesActivos,
    productosTotales,
    bajoPuntoReorden,
    valorTotalInventario,
    almacenesEstadisticas,
    movimientosRecientes,
    transferenciasPendientes,
    transferenciasEnTransito,
    conteosEnProgreso,

    loading,
  }
}
