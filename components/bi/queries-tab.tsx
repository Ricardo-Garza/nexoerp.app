"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { QueryDialog } from "./query-dialog"
import type { BIQuery } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface QueriesTabProps {
  queries: BIQuery[]
  loading: boolean
  onAddQuery: (query: Omit<BIQuery, "id" | "createdAt" | "updatedAt">) => Promise<void>
  onUpdateQuery: (id: string, query: Partial<BIQuery>) => Promise<void>
  onDeleteQuery: (id: string) => Promise<void>
  getDataSource: (collection: string, filters?: any) => Promise<any[]>
}

export function QueriesTab({
  queries,
  loading,
  onAddQuery,
  onUpdateQuery,
  onDeleteQuery,
  getDataSource,
}: QueriesTabProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [editingQuery, setEditingQuery] = useState<BIQuery | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredQueries = queries.filter((q) => q.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleAdd = () => {
    setEditingQuery(null)
    setShowDialog(true)
  }

  const handleEdit = (query: BIQuery) => {
    setEditingQuery(query)
    setShowDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("¿Eliminar esta consulta?")) {
      await onDeleteQuery(id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar consultas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Consulta
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Cargando consultas...</div>
      ) : filteredQueries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No hay consultas guardadas. Crea tu primera consulta.
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Origen de Datos</TableHead>
                <TableHead>Campos</TableHead>
                <TableHead>Creada</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQueries.map((query) => (
                <TableRow key={query.id}>
                  <TableCell className="font-medium">{query.name}</TableCell>
                  <TableCell className="capitalize">{query.dataSource.replace(/([A-Z])/g, " $1").trim()}</TableCell>
                  <TableCell>{query.fields.length} campos</TableCell>
                  <TableCell>
                    {query.createdAt ? format(query.createdAt.toDate(), "dd MMM yyyy", { locale: es }) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(query)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(query.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {showDialog && (
        <QueryDialog
          query={editingQuery}
          onClose={() => setShowDialog(false)}
          onSave={async (data) => {
            if (editingQuery) {
              await onUpdateQuery(editingQuery.id, data)
            } else {
              await onAddQuery(data as any)
            }
            setShowDialog(false)
          }}
        />
      )}
    </div>
  )
}
