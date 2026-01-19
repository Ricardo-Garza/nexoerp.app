"use client"

import { useState, useEffect, useCallback } from "react"
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, or } from "firebase/firestore"
import { getFirebaseDb } from "@/lib/firebase"
import { COLLECTIONS, addItem } from "@/lib/firestore"
import type { SalesOrder, Delivery, Invoice } from "@/lib/types"
import { serverTimestamp } from "firebase/firestore"
import { toast } from "sonner"
import { useWarehouseData } from "./use-warehouse-data"

export function useSalesData(companyId: string, userId?: string) {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const effectiveCompanyId = companyId || userId || ""

  const { createMovement, selectLotsForFulfillment } = useWarehouseData()

  useEffect(() => {
    if (!effectiveCompanyId) {
      console.log("[v0] useSalesData - No companyId or userId provided")
      setLoading(false)
      setSalesOrders([])
      return
    }

    console.log("[v0] useSalesData - Setting up listeners")
    console.log("[v0] useSalesData - companyId:", companyId)
    console.log("[v0] useSalesData - userId:", userId)
    console.log("[v0] useSalesData - effectiveCompanyId:", effectiveCompanyId)

    const db = getFirebaseDb()
    const unsubscribers: (() => void)[] = []

    try {
      const salesOrdersQuery = query(
        collection(db, COLLECTIONS.salesOrders),
        or(
          where("companyId", "==", effectiveCompanyId),
          where("userId", "==", userId || ""),
          where("companyId", "==", ""),
        ),
        orderBy("createdAt", "desc"),
      )

      const unsubSalesOrders = onSnapshot(
        salesOrdersQuery,
        (snapshot) => {
          const orders = snapshot.docs.map((doc) => {
            const data = doc.data()
            
            // Normalize corrupted status data (backward compatibility)
            let normalizedData = { ...data }
            if (typeof data.status === "object" && data.status !== null) {
              // If status is an object, extract the actual status and move other fields to top level
              const statusObj = data.status as any
              normalizedData.status = statusObj.status || "unknown"
              if (statusObj.cancelReturnType) normalizedData.cancelReturnType = statusObj.cancelReturnType
              if (statusObj.cancelReturnReason) normalizedData.cancelReturnReason = statusObj.cancelReturnReason
              if (statusObj.cancelReturnAt) normalizedData.cancelReturnAt = statusObj.cancelReturnAt
              if (statusObj.cancelReturnBy) normalizedData.cancelReturnBy = statusObj.cancelReturnBy
            }
            
            return {
              id: doc.id,
              ...normalizedData,
            }
          }) as SalesOrder[]
          console.log("[v0] useSalesData - Loaded orders:", orders.length)
          if (orders.length > 0) {
            console.log("[v0] useSalesData - First order:", orders[0])
          }
          setSalesOrders(orders)
          setLoading(false)
        },
        (err) => {
          console.error("[v0] useSalesData - Error fetching sales orders:", err)
          setError(err.message)
          setLoading(false)
          setSalesOrders([])
        },
      )
      unsubscribers.push(unsubSalesOrders)

      const deliveriesQuery = query(
        collection(db, COLLECTIONS.deliveries),
        or(where("companyId", "==", effectiveCompanyId), where("userId", "==", userId || "")),
        orderBy("createdAt", "desc"),
      )

      const unsubDeliveries = onSnapshot(deliveriesQuery, (snapshot) => {
        const dels = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Delivery[]
        setDeliveries(dels)
      })
      unsubscribers.push(unsubDeliveries)

      const invoicesQuery = query(
        collection(db, COLLECTIONS.salesInvoices),
        or(where("companyId", "==", effectiveCompanyId), where("userId", "==", userId || "")),
        orderBy("createdAt", "desc"),
      )

      const unsubInvoices = onSnapshot(invoicesQuery, (snapshot) => {
        const invs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Invoice[]
        setInvoices(invs)
      })
      unsubscribers.push(unsubInvoices)
    } catch (err) {
      console.error("[v0] useSalesData - Setup error:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
      setLoading(false)
      setSalesOrders([])
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub())
    }
  }, [effectiveCompanyId, userId])

  const updateOrderStatus = useCallback(
    async (orderId: string, status: SalesOrder["status"], userId?: string, userEmail?: string) => {
      try {
        const db = getFirebaseDb()
        const orderRef = doc(db, COLLECTIONS.salesOrders, orderId)

        await updateDoc(orderRef, {
          status,
          updatedAt: serverTimestamp(),
        })

        await addItem(COLLECTIONS.salesOrderActivities, {
          salesOrderId: orderId,
          companyId: effectiveCompanyId,
          timestamp: serverTimestamp(),
          userId: userId || "",
          userName: userEmail || "Unknown",
          action: status === "confirmed" ? "confirmed" : "updated",
          description: `Estado actualizado a: ${status}`,
        })

        toast.success("Estado de orden actualizado correctamente")
        return true
      } catch (error) {
        console.error("[v0] useSalesData - Error updating order status:", error)
        toast.error("Error al actualizar el estado de la orden")
        return false
      }
    },
    [effectiveCompanyId],
  )

  const sendOrderByEmail = useCallback(
    async (orderId: string, userId?: string, userEmail?: string) => {
      try {
        await addItem(COLLECTIONS.salesOrderActivities, {
          salesOrderId: orderId,
          companyId: effectiveCompanyId,
          timestamp: serverTimestamp(),
          userId: userId || "",
          userName: userEmail || "Unknown",
          action: "email_sent",
          description: "Orden enviada por correo electrónico",
        })

        toast.success("Orden enviada por correo")
        return true
      } catch (error) {
        console.error("[v0] useSalesData - Error sending order:", error)
        toast.error("Error al enviar la orden")
        return false
      }
    },
    [effectiveCompanyId],
  )

  const printOrder = useCallback(
    async (orderId: string, userId?: string, userEmail?: string) => {
      try {
        await addItem(COLLECTIONS.salesOrderActivities, {
          salesOrderId: orderId,
          companyId: effectiveCompanyId,
          timestamp: serverTimestamp(),
          userId: userId || "",
          userName: userEmail || "Unknown",
          action: "printed",
          description: "Orden impresa",
        })

        toast.success("Orden lista para imprimir")
        return true
      } catch (error) {
        console.error("[v0] useSalesData - Error printing order:", error)
        toast.error("Error al imprimir la orden")
        return false
      }
    },
    [effectiveCompanyId],
  )

  const fulfillSalesOrder = useCallback(
    async (orderId: string, almacenId: string, almacenNombre: string) => {
      try {
        const order = salesOrders.find((o) => o.id === orderId)
        if (!order) {
          throw new Error("Order not found")
        }

        if (order.status !== "confirmed") {
          throw new Error("Solo se pueden entregar órdenes confirmadas")
        }

        if (!almacenId || almacenId.trim() === "") {
          throw new Error("Debe seleccionar un almacén para surtir la venta. El inventario por almacén es obligatorio.")
        }

        console.log("[v0] Fulfilling sales order:", orderId, "from warehouse:", almacenId)

        // Validate stock availability for ALL items before creating any movements
        for (const item of order.lines.filter((l) => l.type === "product")) {
          if (!item.productId) continue

          const lotesDisponibles = selectLotsForFulfillment(almacenId, item.productId, item.quantity || 0)
          const totalDisponible = lotesDisponibles.reduce((sum, l) => sum + l.cantidad, 0)

          if (totalDisponible < (item.quantity || 0)) {
            throw new Error(
              `Inventario insuficiente para ${item.productName}: Disponible ${totalDisponible}, Requerido ${item.quantity}`,
            )
          }
        }

        console.log("[v0] Stock validation passed, creating delivery and movements")

        // Create delivery document
        const delivery = await addItem(COLLECTIONS.deliveries, {
          folio: `REM-${Date.now()}`,
          ordenVentaId: orderId,
          ordenVentaFolio: order.orderNumber,
          clienteId: order.customerId,
          clienteNombre: order.customerName,
          estado: "preparando",
          items: order.lines
            .filter((l) => l.type === "product")
            .map((item) => ({
              productoId: item.productId || "",
              sku: "",
              nombre: item.productName || item.description,
              cantidad: item.quantity || 0,
              unidad: item.unit || "PZA",
            })),
          direccionEntrega: order.shippingAddress || "",
          fechaEntrega: new Date().toISOString(),
          almacenId,
          almacenNombre,
          companyId: effectiveCompanyId,
        })

        let lotesAsignados: any[] = [] // Declare the variable here

        for (const item of order.lines.filter((l) => l.type === "product" && l.productId)) {
          const lotsAssigned = selectLotsForFulfillment(almacenId, item.productId!, item.quantity || 0)

          console.log("[v0] Creating movements for", item.productName, "lots:", lotsAssigned.length)

          for (const lotAssigned of lotsAssigned) {
            await createMovement({
              folio: `VENTA-${orderId.slice(0, 8)}-${item.productId!.slice(0, 8)}-${lotAssigned.lote || "SL"}`,
              almacenId,
              almacenNombre,
              productoId: item.productId!,
              productoNombre: item.productName || item.description,
              sku: "",
              unidadBase: item.unit || "PZA",
              tipo: "venta",
              cantidad: lotAssigned.cantidad,
              cantidadAnterior: 0,
              cantidadNueva: 0,
              costoUnitario: lotAssigned.costoUnitario,
              costoTotal: lotAssigned.cantidad * lotAssigned.costoUnitario,
              fecha: new Date().toISOString(),
              motivo: `Venta - Orden ${order.orderNumber}`,
              referencia: order.orderNumber,
              clienteId: order.customerId,
              clienteNombre: order.customerName,
              ordenVentaId: orderId,
              ordenVentaFolio: order.orderNumber,
              remisionId: delivery.id,
              remisionFolio: delivery.folio,
              lote: lotAssigned.lote,
              fechaCaducidad: lotAssigned.fechaCaducidad || null,
            })
          }
          lotesAsignados = lotesAsignados.concat(lotsAssigned) // Update the variable here
        }

        // Update order status to delivered
        const db = getFirebaseDb()
        await updateDoc(doc(db, COLLECTIONS.salesOrders, orderId), {
          status: "delivered",
          warehouseId: almacenId,
          warehouseName: almacenNombre,
          remisionId: delivery.id,
          remisionFolio: delivery.folio,
          deliveredDate: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        // Log activity
        await addItem(COLLECTIONS.salesOrderActivities, {
          salesOrderId: orderId,
          companyId: effectiveCompanyId,
          timestamp: serverTimestamp(),
          userId: userId || "",
          userName: "Usuario",
          action: "delivered",
          description: `Orden entregada desde almacén ${almacenNombre}. Remisión: ${delivery.folio}. Inventario descontado con ${lotesAsignados.some((l) => l.fechaCaducidad) ? "FEFO (First Expired First Out)" : "FIFO"}.`,
        })

        toast.success(`Orden entregada e inventario actualizado desde ${almacenNombre}`)
        return delivery
      } catch (error) {
        console.error("[v0] Error fulfilling order:", error)
        toast.error(error instanceof Error ? error.message : "Error al entregar la orden")
        throw error
      }
    },
    [salesOrders, selectLotsForFulfillment, createMovement, effectiveCompanyId, userId],
  )

  // Calculate KPIs
  const stats = {
    totalOrders: salesOrders.length,
    confirmedOrders: salesOrders.filter(
      (o) =>
        o.status === "confirmed" ||
        o.status === "in_progress" ||
        o.status === "delivered" ||
        o.status === "invoiced_partial",
    ).length,
    quotations: salesOrders.filter((o) => o.type === "quotation" && o.status === "draft").length,
    totalRevenue: salesOrders
      .filter(
        (o) =>
          o.status === "confirmed" ||
          o.status === "delivered" ||
          o.status === "invoiced" ||
          o.status === "invoiced_partial",
      )
      .reduce((sum, order) => sum + (order.total || 0), 0),
    pendingDeliveries: deliveries.filter((d) => d.status === "ready" || d.status === "in_transit").length,
    unpaidInvoices: invoices.filter((i) => i.paymentStatus === "unpaid" || i.paymentStatus === "partial").length,
    unpaidAmount: invoices
      .filter((i) => i.paymentStatus === "unpaid" || i.paymentStatus === "partial")
      .reduce((sum, inv) => sum + (inv.total - inv.amountPaid), 0),
  }

  return {
    salesOrders,
    deliveries,
    invoices,
    stats,
    loading,
    error,
    updateOrderStatus,
    sendOrderByEmail,
    printOrder,
    fulfillSalesOrder,
  }
}
