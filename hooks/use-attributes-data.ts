"use client"

import { useMemo, useCallback } from "react"
import { useFirestore } from "@/hooks/use-firestore"
import { useAuth } from "@/contexts/auth-context"
import { Timestamp, orderBy } from "firebase/firestore"
import { COLLECTIONS } from "@/lib/firestore"
import type {
  ProductAttribute,
  ProductCategory,
  ProductAttributeAssignment,
  ProductVariant,
  Product,
  SalesOrder,
  StockMovement,
  ServiceTicket,
  WorkOrder,
} from "@/lib/types"

export function useAttributesData() {
  const { user } = useAuth()
  const companyId = user?.companyId || user?.uid || ""
  const userId = user?.uid || ""

  const {
    items: attributes,
    loading: attributesLoading,
    create: createAttributeBase,
    update: updateAttribute,
    remove: removeAttribute,
  } = useFirestore<ProductAttribute>(COLLECTIONS.productAttributes, [orderBy("nombre", "asc")], true)

  const {
    items: categories,
    loading: categoriesLoading,
    create: createCategoryBase,
    update: updateCategory,
    remove: removeCategory,
  } = useFirestore<ProductCategory>(COLLECTIONS.categories, [orderBy("nombre", "asc")], true)

  const {
    items: assignments,
    loading: assignmentsLoading,
    create: createAssignmentBase,
    update: updateAssignment,
    remove: removeAssignment,
  } = useFirestore<ProductAttributeAssignment>(
    COLLECTIONS.productAttributeAssignments,
    [orderBy("createdAt", "desc")],
    true,
  )

  const {
    items: variants,
    loading: variantsLoading,
    create: createVariantBase,
    update: updateVariant,
    remove: removeVariant,
  } = useFirestore<ProductVariant>(COLLECTIONS.productVariants, [orderBy("createdAt", "desc")], true)

  const { items: products, loading: productsLoading } = useFirestore<Product>(
    COLLECTIONS.products,
    [orderBy("name", "asc")],
    true,
  )

  const { items: salesOrders } = useFirestore<SalesOrder>(COLLECTIONS.salesOrders, [orderBy("createdAt", "desc")], true)

  const { items: stockMovements } = useFirestore<StockMovement>(
    COLLECTIONS.stockMovements,
    [orderBy("fecha", "desc")],
    true,
  )

  const { items: serviceTickets } = useFirestore<ServiceTicket>(
    COLLECTIONS.serviceTickets,
    [orderBy("fechaCreacion", "desc")],
    true,
  )

  const { items: workOrders } = useFirestore<WorkOrder>(COLLECTIONS.workOrders, [orderBy("createdAt", "desc")], true)

  const loading = attributesLoading || categoriesLoading || assignmentsLoading || variantsLoading || productsLoading

  const createAttribute = useCallback(
    async (data: Omit<ProductAttribute, "id" | "createdAt" | "updatedAt" | "companyId" | "userId">) => {
      const now = Timestamp.now()
      return createAttributeBase({
        ...data,
        companyId,
        userId,
        createdAt: now,
        updatedAt: now,
        activo: data.activo ?? true,
        valores: data.valores || [],
        orden: data.orden ?? 0,
        productosConAtributo: data.productosConAtributo ?? 0,
      } as unknown as ProductAttribute)
    },
    [createAttributeBase, companyId, userId],
  )

  const createCategory = useCallback(
    async (data: Omit<ProductCategory, "id" | "createdAt" | "updatedAt" | "companyId" | "userId">) => {
      const now = Timestamp.now()
      return createCategoryBase({
        ...data,
        companyId,
        userId,
        createdAt: now,
        updatedAt: now,
        activo: data.activo ?? true,
        orden: data.orden ?? 0,
        atributoIds: data.atributoIds || [],
      } as unknown as ProductCategory)
    },
    [createCategoryBase, companyId, userId],
  )

  const createAssignment = useCallback(
    async (data: Omit<ProductAttributeAssignment, "id" | "createdAt" | "updatedAt" | "companyId" | "userId">) => {
      const now = Timestamp.now()
      return createAssignmentBase({
        ...data,
        companyId,
        userId,
        createdAt: now,
        updatedAt: now,
        valoresSeleccionados: data.valoresSeleccionados || [],
        generarVariantes: data.generarVariantes ?? true,
      } as unknown as ProductAttributeAssignment)
    },
    [createAssignmentBase, companyId, userId],
  )

  const createVariant = useCallback(
    async (data: Omit<ProductVariant, "id" | "createdAt" | "updatedAt" | "companyId" | "userId">) => {
      const now = Timestamp.now()
      return createVariantBase({
        ...data,
        companyId,
        userId,
        createdAt: now,
        updatedAt: now,
        activo: data.activo ?? true,
        stock: data.stock ?? 0,
        imagenes: data.imagenes || [],
      } as unknown as ProductVariant)
    },
    [createVariantBase, companyId, userId],
  )

  // Calculate KPIs
  const stats = useMemo(() => {
    const safeAttributes = Array.isArray(attributes) ? attributes : []
    const safeAssignments = Array.isArray(assignments) ? assignments : []
    const safeVariants = Array.isArray(variants) ? variants : []
    const safeCategories = Array.isArray(categories) ? categories : []

    const activeAttributes = safeAttributes.filter((attr) => attr.activo).length
    const productsWithAttributes = new Set(safeAssignments.map((a) => a.productoId)).size
    const totalVariants = safeVariants.length
    const activeCategories = safeCategories.filter((cat) => cat.activo).length

    return {
      activeAttributes: activeAttributes || 0,
      productsWithAttributes: productsWithAttributes || 0,
      totalVariants: totalVariants || 0,
      activeCategories: activeCategories || 0,
    }
  }, [attributes, assignments, variants, categories])

  const analytics = useMemo(() => {
    const safeStockMovements = Array.isArray(stockMovements) ? stockMovements : []
    const safeSalesOrders = Array.isArray(salesOrders) ? salesOrders : []
    const safeServiceTickets = Array.isArray(serviceTickets) ? serviceTickets : []
    const safeWorkOrders = Array.isArray(workOrders) ? workOrders : []

    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Products expiring soon (from stockMovements with lote/caducidad)
    const expiringProducts = safeStockMovements
      .filter((movement) => {
        if (!movement || !movement.lote || !movement.fechaCaducidad) return false
        const expDate =
          movement.fechaCaducidad instanceof Timestamp
            ? movement.fechaCaducidad.toDate()
            : new Date(movement.fechaCaducidad)
        return expDate <= thirtyDaysFromNow && expDate > now
      })
      .map((movement) => ({
        productId: movement.productoId || "",
        productName: movement.productoNombre || "Sin nombre",
        lote: movement.lote || "",
        fechaCaducidad: movement.fechaCaducidad,
        quantity: movement.cantidad || 0,
        warehouseId: movement.almacenId || "",
      }))

    // Top sales by category/attribute/variant (from salesOrders)
    const salesByProduct: Record<
      string,
      { productId: string; productName: string; quantity: number; revenue: number; variantId?: string }
    > = {}

    safeSalesOrders
      .filter((order) => order && order.estado !== "cancelada")
      .forEach((order) => {
        const orderItems = Array.isArray(order.items) ? order.items : []
        orderItems.forEach((item) => {
          if (!item || !item.productId) return
          const key = item.variantId || item.productId
          if (!salesByProduct[key]) {
            salesByProduct[key] = {
              productId: item.productId,
              productName: item.productName || "Sin nombre",
              quantity: 0,
              revenue: 0,
              variantId: item.variantId,
            }
          }
          salesByProduct[key].quantity += item.quantity || 0
          salesByProduct[key].revenue += item.total || 0
        })
      })

    const topSales = Object.values(salesByProduct)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Stock movements summary (entries/exits from stockMovements)
    const movementsSummary = safeStockMovements.reduce(
      (acc, movement) => {
        if (!movement || !movement.tipo) return acc
        if (movement.tipo === "entrada" || movement.tipo === "compra" || movement.tipo === "produccion") {
          acc.entries += movement.cantidad || 0
        } else if (movement.tipo === "salida" || movement.tipo === "venta" || movement.tipo === "consumo") {
          acc.exits += movement.cantidad || 0
        }
        return acc
      },
      { entries: 0, exits: 0 },
    )

    // Returns linked to tickets (from serviceTickets)
    const returns = safeServiceTickets
      .filter(
        (ticket) =>
          ticket &&
          (ticket.categoria === "devolucion" || ticket.categoria === "producto_danado") &&
          Array.isArray(ticket.lineasDevolucion) &&
          ticket.lineasDevolucion.length > 0,
      )
      .map((ticket) => ({
        ticketId: ticket.id || "",
        ticketNumber: ticket.numero || "N/A",
        salesOrderId: ticket.ordenVentaId,
        items: Array.isArray(ticket.lineasDevolucion) ? ticket.lineasDevolucion : [],
        status: ticket.estadoDevolucion,
        createdAt: ticket.fechaCreacion,
      }))

    // Maintenance by product (from workOrders if equipment references products)
    const maintenanceByProduct: Record<string, number> = {}
    safeWorkOrders
      .filter((wo) => wo && wo.estado === "completada")
      .forEach((wo) => {
        // Count maintenance orders (assuming equipmentId could map to productId)
        const key = wo.equipoId || ""
        if (key) {
          maintenanceByProduct[key] = (maintenanceByProduct[key] || 0) + 1
        }
      })

    return {
      expiringProducts: expiringProducts || [],
      topSales: topSales || [],
      movementsSummary: movementsSummary || { entries: 0, exits: 0 },
      returns: returns || [],
      maintenanceByProduct: maintenanceByProduct || {},
    }
  }, [stockMovements, salesOrders, serviceTickets, workOrders])

  // Utility: Generate variants for a product
  const generateVariants = useCallback(
    async (productId: string) => {
      const safeAssignments = Array.isArray(assignments) ? assignments : []
      const safeProducts = Array.isArray(products) ? products : []
      const safeVariants = Array.isArray(variants) ? variants : []

      const productAssignments = safeAssignments.filter(
        (a) =>
          a &&
          a.productoId === productId &&
          a.generarVariantes &&
          Array.isArray(a.valoresSeleccionados) &&
          a.valoresSeleccionados.length > 0,
      )

      if (productAssignments.length === 0) {
        return []
      }

      const product = safeProducts.find((p) => p && p.id === productId)
      if (!product) return []

      // Generate all combinations
      const generateCombinations = (
        attrs: ProductAttributeAssignment[],
        index = 0,
        current: Record<string, string> = {},
      ): Record<string, string>[] => {
        if (index >= attrs.length) {
          return [current]
        }

        const attr = attrs[index]
        const combinations: Record<string, string>[] = []
        const safeValues = Array.isArray(attr.valoresSeleccionados) ? attr.valoresSeleccionados : []

        for (const value of safeValues) {
          const newCurrent = { ...current, [attr.atributoNombre || ""]: value }
          combinations.push(...generateCombinations(attrs, index + 1, newCurrent))
        }

        return combinations
      }

      const combinations = generateCombinations(productAssignments)

      // Create variants
      const newVariants: ProductVariant[] = []
      for (const combo of combinations) {
        const variantName = `${product.name} ${Object.values(combo).join(" ")}`
        const sku = `${product.id}-${Object.values(combo)
          .map((v) => v.substring(0, 2).toUpperCase())
          .join("")}`

        // Check if variant already exists
        const exists = safeVariants.some(
          (v) => v && v.productoId === productId && JSON.stringify(v.combinacionAtributos) === JSON.stringify(combo),
        )

        if (!exists) {
          const variant = await createVariant({
            productoId: productId,
            productoNombre: product.name,
            sku,
            nombre: variantName,
            combinacionAtributos: combo,
            precio: product.price || 0,
            costo: product.cost || 0,
            stock: 0,
            activo: true,
          })

          newVariants.push(variant)
        }
      }

      return newVariants
    },
    [assignments, products, variants, createVariant],
  )

  return {
    attributes: Array.isArray(attributes) ? attributes : [],
    categories: Array.isArray(categories) ? categories : [],
    assignments: Array.isArray(assignments) ? assignments : [],
    variants: Array.isArray(variants) ? variants : [],
    products: Array.isArray(products) ? products : [],
    stats,
    analytics,
    loading,
    // Attribute operations
    createAttribute,
    updateAttribute,
    removeAttribute,
    // Category operations
    createCategory,
    updateCategory,
    removeCategory,
    // Assignment operations
    createAssignment,
    updateAssignment,
    removeAssignment,
    // Variant operations
    createVariant,
    updateVariant,
    removeVariant,
    generateVariants,
  }
}
