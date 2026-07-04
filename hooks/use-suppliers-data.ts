"use client"

import { useMemo, useCallback } from "react"
import { useFirestore } from "./use-firestore"
import { COLLECTIONS } from "@/lib/firestore"
import type {
  Supplier,
  SupplierDocument,
  SupplierProduct,
  PurchaseOrder,
  GoodsReceipt,
  AccountPayable,
} from "@/lib/types"
import { orderBy } from "firebase/firestore"
import { useWarehouseData } from "./use-warehouse-data"
import { convertToBaseUnits, calculateCostPerBaseUnit } from "@/lib/utils/inventory-ledger"

export function useSuppliersData() {
  const {
    items: suppliers,
    loading: loadingSuppliers,
    create: createSupplier,
    update: updateSupplier,
    remove: removeSupplier,
  } = useFirestore<Supplier>(COLLECTIONS.suppliers, [orderBy("nombre", "asc")], true)

  const {
    items: documents,
    loading: loadingDocuments,
    create: createDocument,
    update: updateDocument,
    remove: removeDocument,
  } = useFirestore<SupplierDocument>(COLLECTIONS.supplierDocuments, [orderBy("fecha", "desc")], true)

  const {
    items: products,
    loading: loadingProducts,
    create: createProduct,
    update: updateProduct,
    remove: removeProduct,
  } = useFirestore<SupplierProduct>(COLLECTIONS.supplierProducts, [orderBy("nombre", "asc")], true)

  const {
    items: purchaseOrders,
    loading: loadingPOs,
    create: createPurchaseOrder,
    update: updatePurchaseOrder,
    remove: removePurchaseOrder,
  } = useFirestore<PurchaseOrder>(COLLECTIONS.purchaseOrders, [orderBy("fecha", "desc")], true)

  const {
    items: goodsReceipts,
    loading: loadingReceipts,
    create: createGoodsReceipt,
    update: updateGoodsReceipt,
    remove: removeGoodsReceipt,
  } = useFirestore<GoodsReceipt>(COLLECTIONS.goodsReceipts, [orderBy("fecha", "desc")], true)

  const {
    items: accountsPayable,
    loading: loadingPayables,
    create: createAccountPayable,
    update: updateAccountPayable,
    remove: removeAccountPayable,
  } = useFirestore<AccountPayable>(COLLECTIONS.accountsPayable, [orderBy("fechaVencimiento", "asc")], true)

  const { createMovement } = useWarehouseData()

  const loading =
    loadingSuppliers || loadingDocuments || loadingProducts || loadingPOs || loadingReceipts || loadingPayables

  // Calculate metrics
  const totalProveedores = useMemo(() => {
    return (suppliers || []).length
  }, [suppliers])

  const proveedoresActivos = useMemo(() => {
    return (suppliers || []).filter((s) => s.estadoProveedor === "activo").length
  }, [suppliers])

  const comprasDelMes = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    return (purchaseOrders || [])
      .filter((po) => {
        if (po.estado === "cancelada") return false
        const fecha = po.fecha instanceof Date ? po.fecha : new Date(po.fecha as string)
        return fecha >= startOfMonth
      })
      .reduce((sum, po) => sum + (po.total || 0), 0)
  }, [purchaseOrders])

  const porcentajeIncrementoCompras = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const thisMonth = (purchaseOrders || [])
      .filter((po) => {
        if (po.estado === "cancelada") return false
        const fecha = po.fecha instanceof Date ? po.fecha : new Date(po.fecha as string)
        return fecha >= startOfMonth
      })
      .reduce((sum, po) => sum + (po.total || 0), 0)

    const lastMonth = (purchaseOrders || [])
      .filter((po) => {
        if (po.estado === "cancelada") return false
        const fecha = po.fecha instanceof Date ? po.fecha : new Date(po.fecha as string)
        return fecha >= startOfLastMonth && fecha <= endOfLastMonth
      })
      .reduce((sum, po) => sum + (po.total || 0), 0)

    if (lastMonth === 0) return 0
    return ((thisMonth - lastMonth) / lastMonth) * 100
  }, [purchaseOrders])

  const ordenesCompraActivas = useMemo(() => {
    return (purchaseOrders || []).filter(
      (po) => po.estado === "autorizada" || po.estado === "enviada" || po.estado === "recibida_parcial",
    ).length
  }, [purchaseOrders])

  const ordenesPendientes = useMemo(() => {
    return (purchaseOrders || []).filter((po) => po.estado === "borrador" || po.estado === "autorizada").length
  }, [purchaseOrders])

  const cuentasPorPagarTotal = useMemo(() => {
    return (accountsPayable || []).filter((ap) => ap.estado !== "pagada").reduce((sum, ap) => sum + (ap.saldo || 0), 0)
  }, [accountsPayable])

  const cuentasPorVencer = useMemo(() => {
    const now = new Date()
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    return (accountsPayable || [])
      .filter((ap) => {
        if (ap.estado === "pagada") return false
        const vencimiento =
          ap.fechaVencimiento instanceof Date ? ap.fechaVencimiento : new Date(ap.fechaVencimiento as string)
        return vencimiento >= now && vencimiento <= in30Days
      })
      .reduce((sum, ap) => sum + (ap.saldo || 0), 0)
  }, [accountsPayable])

  // Purchase statistics
  const ordenesCompraEstadisticas = useMemo(() => {
    const stats = {
      borrador: 0,
      autorizada: 0,
      enviada: 0,
      recibida_parcial: 0,
      recibida_completa: 0,
      cancelada: 0,
    }
    ;(purchaseOrders || []).forEach((po) => {
      if (stats.hasOwnProperty(po.estado)) {
        stats[po.estado as keyof typeof stats]++
      }
    })

    return stats
  }, [purchaseOrders])

  // Payables aging
  const cuentasPorPagarVencimiento = useMemo(() => {
    const now = new Date()
    const aging = {
      vigente: 0,
      vencido30: 0,
      vencido60: 0,
      vencido90: 0,
      vencido90Plus: 0,
    }
    ;(accountsPayable || [])
      .filter((ap) => ap.estado !== "pagada")
      .forEach((ap) => {
        const dueDate =
          ap.fechaVencimiento instanceof Date ? ap.fechaVencimiento : new Date(ap.fechaVencimiento as string)
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

        if (daysOverdue <= 0) {
          aging.vigente += ap.saldo || 0
        } else if (daysOverdue <= 30) {
          aging.vencido30 += ap.saldo || 0
        } else if (daysOverdue <= 60) {
          aging.vencido60 += ap.saldo || 0
        } else if (daysOverdue <= 90) {
          aging.vencido90 += ap.saldo || 0
        } else {
          aging.vencido90Plus += ap.saldo || 0
        }
      })

    return aging
  }, [accountsPayable])

  // Top suppliers by purchase volume
  const topProveedores = useMemo(() => {
    return [...(suppliers || [])].sort((a, b) => (b.comprasTotales || 0) - (a.comprasTotales || 0)).slice(0, 10)
  }, [suppliers])

  const createGoodsReceiptWithInventoryImpact = useCallback(
    async (data: Omit<GoodsReceipt, "id" | "createdAt" | "updatedAt" | "companyId" | "userId">) => {
      if (!data.almacenId || !data.almacenNombre) {
        throw new Error("Debe seleccionar un almacén destino para la recepción de mercancía")
      }

      console.log("[v0] Creating goods receipt with inventory impact and unit conversion:", data)

      // Create the goods receipt document
      const receipt = await createGoodsReceipt(data)

      for (const item of data.items) {
        if (item.cantidadRecibida > 0) {
          // Convert purchase units to base units
          const cantidadBase = convertToBaseUnits(item.cantidadRecibida, item.unidadesPorEmpaque)
          const costoUnitarioBase = calculateCostPerBaseUnit(
            item.cantidadRecibida * item.precioUnitario,
            item.cantidadRecibida,
            item.unidadesPorEmpaque,
          )

          console.log("[v0] Unit conversion:", {
            cantidadCompra: item.cantidadRecibida,
            unidadCompra: item.unidadCompra,
            unidadesPorEmpaque: item.unidadesPorEmpaque,
            cantidadBase,
            unidadBase: item.unidadBase,
            costoUnitarioBase,
          })

          await createMovement({
            folio: `RCP-${receipt.id.slice(0, 8)}-${item.sku}`,
            almacenId: data.almacenId,
            almacenNombre: data.almacenNombre,
            productoId: item.productoId,
            productoNombre: item.descripcion,
            sku: item.sku,
            unidadBase: item.unidadBase,
            tipo: "recepcion_compra",
            cantidad: cantidadBase, // Always in base units for ledger
            cantidadAnterior: 0,
            cantidadNueva: 0,
            costoUnitario: costoUnitarioBase, // Cost per base unit
            fecha: data.fecha,
            motivo: `Recepción de compra ${data.ordenCompraFolio} - ${item.cantidadRecibida} ${item.unidadCompra}`,
            referencia: data.ordenCompraFolio,
            proveedorId: data.proveedorId,
            proveedorNombre: data.proveedorNombre,
            ordenCompraId: data.ordenCompraId,
            ordenCompraFolio: data.ordenCompraFolio,
            recepcionId: receipt.id,
            recepcionFolio: data.folio,
            lote: item.lote || null,
            fechaCaducidad: item.fechaCaducidad || null,
          })
        }
      }

      // Update purchase order status
      const po = purchaseOrders.find((p) => p.id === data.ordenCompraId)
      if (po) {
        const allItemsReceived = data.items.every((item: any) => item.cantidadRecibida >= item.cantidadOrdenada)
        const someItemsReceived = data.items.some((item: any) => item.cantidadRecibida > 0)
        const newStatus = allItemsReceived ? "recibida_completa" : someItemsReceived ? "recibida_parcial" : po.estado

        await updatePurchaseOrder(po.id, {
          estado: newStatus,
          items: data.items.map((item: any) => ({
            ...po.items.find((poi) => poi.sku === item.sku)!,
            cantidadRecibida: item.cantidadRecibida,
          })),
        })
      }

      console.log("[v0] Goods receipt completed, inventory movements created in ledger")
      return receipt
    },
    [createGoodsReceipt, purchaseOrders, updatePurchaseOrder, createMovement],
  )

  return {
    loading,
    // Collections
    suppliers: suppliers || [],
    documents: documents || [],
    products: products || [],
    purchaseOrders: purchaseOrders || [],
    goodsReceipts: goodsReceipts || [],
    accountsPayable: accountsPayable || [],

    // CRUD methods - Suppliers
    createSupplier,
    updateSupplier,
    removeSupplier,

    // CRUD methods - Documents
    createDocument,
    updateDocument,
    removeDocument,

    // CRUD methods - Products
    createProduct,
    updateProduct,
    removeProduct,

    // CRUD methods - Purchase Orders
    createPurchaseOrder,
    updatePurchaseOrder,
    removePurchaseOrder,

    // CRUD methods - Goods Receipts
    createGoodsReceipt,
    updateGoodsReceipt,
    removeGoodsReceipt,

    // CRUD methods - Accounts Payable
    createAccountPayable,
    updateAccountPayable,
    removeAccountPayable,

    // Metrics
    totalProveedores,
    proveedoresActivos,
    comprasDelMes,
    porcentajeIncrementoCompras,
    ordenesCompraActivas,
    ordenesPendientes,
    cuentasPorPagarTotal,
    cuentasPorVencer,
    ordenesCompraEstadisticas,
    cuentasPorPagarVencimiento,
    topProveedores,

    // New integrated function
    createGoodsReceiptWithInventoryImpact,
  }
}
