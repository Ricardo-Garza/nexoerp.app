"use client"

import { useState, useMemo } from "react"
import { useAttributesData } from "@/hooks/use-attributes-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Settings, Tag, Package, Search, Plus, Edit, Trash2 } from "lucide-react"
import { AttributeFormDialog } from "@/components/attributes/attribute-form-dialog"
import { CategoryFormDialog } from "@/components/attributes/category-form-dialog"
import { AssignmentTab } from "@/components/attributes/assignment-tab"
import { RegisteredAttributesTab } from "@/components/attributes/registered-attributes-tab"
import { AnalyticsTab } from "@/components/attributes/analytics-tab"
import type { ProductAttribute, ProductCategory } from "@/lib/types"

export default function AttributesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("attributes")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [isAttributeDialogOpen, setIsAttributeDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [editingAttribute, setEditingAttribute] = useState<ProductAttribute | null>(null)
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null)

  const {
    attributes,
    categories,
    stats,
    loading,
    createAttribute,
    updateAttribute,
    removeAttribute,
    createCategory,
    updateCategory,
    removeCategory,
  } = useAttributesData()

  const tabs = [
    { id: "attributes", label: "Atributos" },
    { id: "assignment", label: "Asignación a Productos" },
    { id: "registered", label: "Registros" },
    { id: "analytics", label: "Analítica" }, // Added analytics tab
  ]

  // Filter attributes
  const filteredAttributes = useMemo(() => {
    return attributes.filter((attr) => {
      const matchesSearch = attr.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "all" || attr.categoriaId === selectedCategory
      const matchesType = selectedType === "all" || attr.tipo === selectedType
      return matchesSearch && matchesCategory && matchesType
    })
  }, [attributes, searchTerm, selectedCategory, selectedType])

  const handleSaveAttribute = async (data: any) => {
    try {
      if (editingAttribute) {
        await updateAttribute(editingAttribute.id, data)
      } else {
        await createAttribute({
          ...data,
          activo: true,
          productosConAtributo: 0,
        })
      }
      setIsAttributeDialogOpen(false)
      setEditingAttribute(null)
    } catch (error) {
      console.error("[Attributes] Error saving attribute:", error)
      alert("Error al guardar el atributo")
    }
  }

  const handleDeleteAttribute = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este atributo?")) return
    try {
      await removeAttribute(id)
    } catch (error) {
      console.error("[Attributes] Error deleting attribute:", error)
      alert("Error al eliminar el atributo")
    }
  }

  const handleSaveCategory = async (data: any) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, data)
      } else {
        await createCategory({
          ...data,
          activo: true,
        })
      }
      setIsCategoryDialogOpen(false)
      setEditingCategory(null)
    } catch (error) {
      console.error("[Attributes] Error saving category:", error)
      alert("Error al guardar la categoría")
    }
  }

  const statsCards = [
    { name: "Atributos Activos", value: stats.activeAttributes, icon: Tag, color: "text-blue-600" },
    {
      name: "Productos con Atributos",
      value: stats.productsWithAttributes,
      icon: Package,
      color: "text-green-600",
    },
    { name: "Variantes Generadas", value: stats.totalVariants, icon: Settings, color: "text-purple-600" },
    { name: "Categorías", value: stats.activeCategories, icon: Tag, color: "text-orange-600" },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Atributos de Productos</h1>
          <p className="text-muted-foreground mt-2">
            Configure características personalizables para sus productos (color, talla, material, etc.)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setEditingCategory(null)
              setIsCategoryDialogOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Categoría
          </Button>
          <Button
            onClick={() => {
              setEditingAttribute(null)
              setIsAttributeDialogOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Atributo
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">{stat.name}</p>
                <p className="text-2xl font-bold mt-1">{stat.value.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 border-b overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "attributes" && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle>Catálogo de Atributos</CardTitle>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar atributos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="seleccion">Selección</option>
                  <option value="numerico">Numérico</option>
                  <option value="texto">Texto</option>
                  <option value="booleano">Booleano</option>
                  <option value="color">Color</option>
                </select>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">Todas las categorías</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredAttributes.length === 0 ? (
              <div className="text-center py-12">
                <Tag className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-2">No hay atributos</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Crea tu primer atributo para comenzar a configurar variantes de productos
                </p>
                <Button onClick={() => setIsAttributeDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Atributo
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAttributes.map((attr) => (
                  <div key={attr.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Tag className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{attr.nombre}</h4>
                            <Badge variant={attr.activo ? "default" : "secondary"}>
                              {attr.activo ? "Activo" : "Inactivo"}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {attr.tipo}
                            </Badge>
                            {attr.categoriaNombre && (
                              <Badge variant="outline" className="text-xs">
                                {attr.categoriaNombre}
                              </Badge>
                            )}
                          </div>
                          {attr.descripcion && <p className="text-sm text-muted-foreground mb-2">{attr.descripcion}</p>}
                          {attr.valores && attr.valores.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap mt-2">
                              {attr.valores.slice(0, 5).map((value, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {value.valor}
                                </Badge>
                              ))}
                              {attr.valores.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{attr.valores.length - 5} más
                                </Badge>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Usado en {attr.productosConAtributo || 0} productos • ID: {attr.id}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingAttribute(attr)
                            setIsAttributeDialogOpen(true)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteAttribute(attr.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "assignment" && <AssignmentTab />}

      {activeTab === "registered" && <RegisteredAttributesTab />}

      {activeTab === "analytics" && <AnalyticsTab />}

      <AttributeFormDialog
        open={isAttributeDialogOpen}
        onOpenChange={setIsAttributeDialogOpen}
        attribute={editingAttribute}
        categories={categories}
        onSave={handleSaveAttribute}
      />

      <CategoryFormDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        category={editingCategory}
        onSave={handleSaveCategory}
      />
    </div>
  )
}
