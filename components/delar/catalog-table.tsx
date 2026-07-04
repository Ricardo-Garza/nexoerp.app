"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { dec } from "@/lib/domain/shared/decimal"

export interface CatalogTableRow {
  sku: string
  name: string
  brandName: string
  familyName: string
  category: string
  presentationType: string
  netContent: string | null
  netUnit: string
  unitsPerCase: number
  ean: string | null
  dun: string | null
  retailUnit: string | null
  wholesaleUnit: string | null
  requiresValidation: boolean
  availablePieces: string
}

export function CatalogTable({ rows, categories, brands }: { rows: CatalogTableRow[]; categories: string[]; brands: string[] }) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [brand, setBrand] = useState("all")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (category !== "all" && r.category !== category) return false
      if (brand !== "all" && r.brandName !== brand) return false
      if (!q) return true
      return `${r.sku} ${r.name} ${r.familyName} ${r.brandName} ${r.presentationType}`.toLowerCase().includes(q)
    })
  }, [rows, search, category, brand])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
          <Input
            aria-label="Buscar en el catálogo"
            placeholder="Buscar por SKU, nombre, familia o marca (p. ej. Ranch)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Filtrar por categoría">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={brand} onValueChange={setBrand}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Filtrar por marca">
            <SelectValue placeholder="Marca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las marcas</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground" data-testid="catalog-count">
        {filtered.length} de {rows.length} presentaciones
      </p>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Marca / Familia</TableHead>
                <TableHead>Presentación</TableHead>
                <TableHead className="text-right">Pzas/Caja</TableHead>
                <TableHead className="text-right">Menudeo (pza)</TableHead>
                <TableHead className="text-right">Mayoreo (pza)</TableHead>
                <TableHead className="text-right">Disponible</TableHead>
                <TableHead>Datos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                    Sin resultados para los filtros actuales.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((r) => (
                <TableRow key={r.sku} data-testid={`catalog-row-${r.sku}`}>
                  <TableCell>
                    <Link href={`/dashboard/catalogo/${encodeURIComponent(r.sku)}`} className="font-mono text-sm text-primary hover:underline">
                      {r.sku}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-64">
                    <span className="block truncate" title={r.name}>
                      {r.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="block text-sm">{r.brandName}</span>
                    <span className="block text-xs text-muted-foreground">{r.familyName}</span>
                  </TableCell>
                  <TableCell>
                    <span className="block text-sm">{r.presentationType}</span>
                    <span className="block text-xs text-muted-foreground">
                      {r.netContent ? `${r.netContent} ${r.netUnit}` : "contenido por validar"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{r.unitsPerCase}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {r.retailUnit ? dec.formatMoney(r.retailUnit) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {r.wholesaleUnit ? dec.formatMoney(r.wholesaleUnit) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{dec.toNumber(r.availablePieces)}</TableCell>
                  <TableCell>
                    {r.requiresValidation ? (
                      <Badge variant="outline" className="text-amber-700 border-amber-300 dark:text-amber-300">
                        Histórico 2025
                      </Badge>
                    ) : (
                      <Badge variant="outline">Validado</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
