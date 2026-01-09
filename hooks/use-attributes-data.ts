"use client"

import { useMemo, useCallback } from "react"
import { useFirestore } from "@/hooks/use-firestore"
import { useAuth } from "@/lib/auth-context"
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
      } as ProductAttribute)
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
      } as ProductCategory)
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
      } as ProductAttributeAssignment)
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
      } as ProductVariant)
    },
    [createVariantBase, companyId, userId],
  )

  // Calculate KPIs
  const stats = useMemo(() => {
    const activeAttributes = attributes.filter((attr) => attr.activo).length
    const productsWithAttributes = new Set(assignments.map((a) => a.productoId)).size
    const totalVariants = variants.length
    const activeCategories = categories.filter((cat) => cat.activo).length

    return {
      activeAttributes: activeAttributes || 0,
      productsWithAttributes: productsWithAttributes || 0,
      totalVariants: totalVariants || 0,
      activeCategories: activeCategories || 0,
    }
  }, [attributes, assignments, variants, categories])

  const analytics = useMemo(() => {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Products expiring soon (from stockMovements with lote/caducidad)
    const expiringProducts = stockMovements
      .filter((movement) => {
        if (!movement.lote || !movement.fechaCaducidad) return false
        const expDate =
          movement.fechaCaducidad instanceof Timestamp
            ? movement.fechaCaducidad.toDate()
            : new Date(movement.fechaCaducidad)
        return expDate <= thirtyDaysFromNow && expDate > now
      })
      .map((movement) => ({
        productId: movement.productoId,
        productName: movement.productoNombre,
        lote: movement.lote,
        fechaCaducidad: movement.fechaCaducidad,
        quantity: movement.cantidad,
        warehouseId: movement.almacenId,
      }))

    // Top sales by category/attribute/variant (from salesOrders)
    const salesByProduct: Record<
      string,
      { productId: string; productName: string; quantity: number; revenue: number; variantId?: string }
    > = {}

    salesOrders
      .filter((order) => order.estado !== "cancelada")
      .forEach((order) => {
        order.items.forEach((item) => {
          const key = item.variantId || item.productId
          if (!salesByProduct[key]) {
            salesByProduct[key] = {
              productId: item.productId,
              productName: item.productName,
              quantity: 0,
              revenue: 0,
              variantId: item.variantId,
            }
          }
          salesByProduct[key].quantity += item.quantity
          salesByProduct[key].revenue += item.total
        })
      })

    const topSales = Object.values(salesByProduct)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Stock movements summary (entries/exits from stockMovements)
    const movementsSummary = stockMovements.reduce(
      (acc, movement) => {
        if (movement.tipo === "entrada" || movement.tipo === "compra" || movement.tipo === "produccion") {
          acc.entries += movement.cantidad
        } else if (movement.tipo === "salida" || movement.tipo === "venta" || movement.tipo === "consumo") {
          acc.exits += movement.cantidad
        }
        return acc
      },
      { entries: 0, exits: 0 },
    )

    // Returns linked to tickets (from serviceTickets)
    const returns = serviceTickets
      .filter(
        (ticket) =>
          (ticket.categoria === "devolucion" || ticket.categoria === "producto_danado") &&
          ticket.lineasDevolucion &&
          ticket.lineasDevolucion.length > 0,
      )
      .map((ticket) => ({
        ticketId: ticket.id,
        ticketNumber: ticket.numero,
        salesOrderId: ticket.ordenVentaId,
        items: ticket.lineasDevolucion || [],
        status: ticket.estadoDevolucion,
        createdAt: ticket.fechaCreacion,
      }))

    // Maintenance by product (from workOrders if equipment references products)
    const maintenanceByProduct: Record<string, number> = {}
    workOrders
      .filter((wo) => wo.estado === "completada")
      .forEach((wo) => {
        // Count maintenance orders (assuming equipmentId could map to productId)
        const key = wo.equipoId
        maintenanceByProduct[key] = (maintenanceByProduct[key] || 0) + 1
      })

    return {
      expiringProducts,
      topSales,
      movementsSummary,
      returns,
      maintenanceByProduct,
    }
  }, [stockMovements, salesOrders, serviceTickets, workOrders])

  // Utility: Generate variants for a product
  const generateVariants = useCallback(
    async (productId: string) => {
      const productAssignments = assignments.filter(
        (a) => a.productoId === productId && a.generarVariantes && a.valoresSeleccionados.length > 0,
      )

      if (productAssignments.length === 0) {
        return []
      }

      const product = products.find((p) => p.id === productId)
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

        for (const value of attr.valoresSeleccionados) {
          const newCurrent = { ...current, [attr.atributoNombre]: value }
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
        const exists = variants.some(
          (v) => v.productoId === productId && JSON.stringify(v.combinacionAtributos) === JSON.stringify(combo),
        )

        if (!exists) {
          const variant = await createVariant({
            productoId: productId,
            productoNombre: product.name,
            sku,
            nombre: variantName,
            combinacionAtributos: combo,
            precio: product.price,
            costo: product.cost,
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
    attributes,
    categories,
    assignments,
    variants,
    products,
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
