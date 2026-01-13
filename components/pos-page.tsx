"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useFirestore } from "@/hooks/use-firestore"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "@/hooks/use-toast"
import { COLLECTIONS } from "@/lib/firestore"
import { calculateLineTotal, formatCurrency } from "@/lib/utils/sales-calculations"
import {
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  XCircle,
  CreditCard,
  Sparkles,
} from "lucide-react"
import { serverTimestamp } from "firebase/firestore"

interface Product {
  id: string
  sku?: string
  name: string
  category?: string
  stock: number
  price: number
  imageUrl?: string
}

interface CartLine {
  id: string
  name: string
  sku?: string
  price: number
  stock: number
  quantity: number
  imageUrl?: string
}

const TAX_RATE = 0.16

export function PosPage() {
  const { user } = useAuth()
  const { items: products, loading, update: updateProduct } = useFirestore<Product>(COLLECTIONS.products, [], true)
  const { create: createSale } = useFirestore<any>(COLLECTIONS.salesOrders, [], true)
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("Todos")
  const [cartLines, setCartLines] = useState<CartLine[]>([])

  const categories = useMemo(() => {
    const unique = new Set<string>()
    products.forEach((product) => {
      if (product?.category) unique.add(product.category)
    })
    return ["Todos", ...Array.from(unique).sort((a, b) => a.localeCompare(b, "es-MX"))]
  }, [products])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product?.name?.toLowerCase().includes(search.toLowerCase()) ||
        product?.sku?.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = activeCategory === "Todos" || product?.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [products, search, activeCategory])

  const subtotal = cartLines.reduce((sum, line) => sum + line.price * line.quantity, 0)
  const taxes = subtotal * TAX_RATE
  const total = subtotal + taxes

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast({ title: "Producto agotado", description: `${product.name} no tiene stock disponible.` })
      return
    }

    setCartLines((prev) => {
      const existing = prev.find((line) => line.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast({ title: "Stock insuficiente", description: "No hay unidades disponibles para agregar." })
          return prev
        }
        return prev.map((line) =>
          line.id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
        )
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          stock: product.stock,
          quantity: 1,
          imageUrl: product.imageUrl,
        },
      ]
    })
  }

  const handleQuantityChange = (productId: string, delta: number) => {
    setCartLines((prev) => {
      return prev
        .map((line) => {
          if (line.id !== productId) return line
          const nextQty = line.quantity + delta
          if (nextQty <= 0) return null
          if (nextQty > line.stock) {
            toast({ title: "Stock insuficiente", description: "No hay unidades disponibles para agregar." })
            return line
          }
          return { ...line, quantity: nextQty }
        })
        .filter(Boolean) as CartLine[]
    })
  }

  const handleRemoveLine = (productId: string) => {
    setCartLines((prev) => prev.filter((line) => line.id !== productId))
  }

  const handleClearCart = () => {
    setCartLines([])
  }

  const handleCheckout = async () => {
    if (cartLines.length === 0) return
    if (!user) {
      toast({ title: "Sesion requerida", description: "Inicia sesion para registrar la venta." })
      return
    }

    const lines = cartLines.map((line, index) =>
      calculateLineTotal({
        id: `${line.id}-${index}`,
        type: "product",
        productId: line.id,
        productName: line.name,
        description: line.name,
        quantity: line.quantity,
        unit: "PZA",
        unitPrice: line.price,
        tax: TAX_RATE * 100,
        discount: 0,
        order: index,
      }),
    )

    const orderNumber = `POS-${Date.now()}`
    const companyId = (user as any).companyId || user.uid

    try {
      await createSale({
        orderNumber,
        type: "order",
        status: "confirmed",
        customerId: "walk-in",
        customerName: "Venta mostrador",
        currency: "MXN",
        exchangeRate: 1,
        lines,
        subtotal,
        taxTotal: taxes,
        discountTotal: 0,
        total,
        paymentTerms: "Contado",
        paymentMethod: "Efectivo",
        orderDate: serverTimestamp(),
        deliveryIds: [],
        invoiceIds: [],
        companyId,
        userId: user.uid,
      })

      await Promise.all(
        cartLines.map((line) =>
          updateProduct(line.id, {
            stock: Math.max(line.stock - line.quantity, 0),
          }),
        ),
      )

      toast({ title: "Venta registrada", description: `Folio ${orderNumber}` })
      setCartLines([])
    } catch (error) {
      console.error("[POS] Error al cobrar venta:", error)
      toast({ title: "Error al cobrar", description: "No se pudo registrar la venta." })
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <Card className="h-full">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Punto de venta</CardTitle>
            <Badge variant="secondary" className="gap-1">
              <ShoppingBag className="w-3 h-3" />
              {cartLines.length} items
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Ticket activo con productos del inventario.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-[360px] pr-4">
            {cartLines.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <ShoppingBag className="w-10 h-10 mb-3" />
                <p className="text-sm">Agrega productos desde el inventario.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cartLines.map((line) => (
                  <div key={line.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="h-12 w-12 overflow-hidden rounded-md bg-muted">
                      <img
                        src={line.imageUrl || "/placeholder.jpg"}
                        alt={line.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{line.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{line.sku || "Sin SKU"}</span>
                        <span>•</span>
                        <span>{formatCurrency(line.price)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => handleQuantityChange(line.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-semibold">{line.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => handleQuantityChange(line.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-sm font-semibold">{formatCurrency(line.price * line.quantity)}</p>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleRemoveLine(line.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Impuestos (16%)</span>
              <span className="font-medium">{formatCurrency(taxes)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-base">
              <span className="font-semibold">Total</span>
              <span className="font-bold">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="grid gap-2">
            <Button size="lg" disabled={cartLines.length === 0} onClick={handleCheckout}>
              <CreditCard className="w-4 h-4 mr-2" />
              Cobrar venta
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" disabled={cartLines.length === 0}>
                <Sparkles className="w-4 h-4 mr-2" />
                Guardar
              </Button>
              <Button variant="ghost" onClick={handleClearCart} disabled={cartLines.length === 0}>
                <XCircle className="w-4 h-4 mr-2" />
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por nombre o SKU..."
                    className="pl-9"
                  />
                </div>
              </div>
              <ScrollArea className="w-full lg:w-[520px]">
                <div className="flex gap-2 pb-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={activeCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveCategory(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Productos</h2>
              <p className="text-sm text-muted-foreground">Selecciona articulos del inventario disponible.</p>
            </div>
            <Badge variant="outline">{filteredProducts.length} resultados</Badge>
          </div>

          {loading ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              Cargando inventario...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No hay productos disponibles con esos filtros.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => {
                const outOfStock = product.stock <= 0
                return (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="h-36 w-full bg-muted">
                      <img
                        src={product.imageUrl || "/placeholder.jpg"}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold leading-snug">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku || "Sin SKU"}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{formatCurrency(product.price)}</span>
                        <Badge variant={outOfStock ? "destructive" : "secondary"}>
                          {outOfStock ? "Agotado" : `${product.stock} uds.`}
                        </Badge>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => handleAddToCart(product)}
                        disabled={outOfStock}
                      >
                        Agregar al ticket
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
