# Tablas profesionales estilo SAP/ALV

Fecha: 2026-07-06. Componente: `components/ui/data-table-pro.tsx` (`DataTablePro`).

## Capacidades

| Función | Estado |
| --- | --- |
| Búsqueda global | ✅ |
| Ordenamiento por columna (asc/desc/off) | ✅ |
| Filtros rápidos (chips) | ✅ (configurable por tabla) |
| Selector de columnas (mostrar/ocultar) | ✅ |
| Densidad (compacta/media/cómoda) | ✅ |
| Sumas / subtotales en el pie | ✅ (columnas numéricas) |
| Conteo de filas | ✅ |
| Exportar Excel (.xlsx) y CSV | ✅ |
| Acciones masivas (selección múltiple) | ✅ (configurable) |
| Acciones por fila | ✅ |
| Variantes por usuario (columnas + densidad) | ✅ (persistidas en localStorage por `tableId`) |

## Uso

```tsx
<DataTablePro
  tableId="admin-tenants"          // id estable para persistir variantes
  columns={columns}                // ProColumn<T>[] con accessor, cell?, numeric?, align?
  rows={rows}
  getRowId={(r) => r.id}
  quickFilters={[...]}             // opcional
  bulkActions={[...]}              // opcional → activa checkboxes
  rowActions={(r) => <...>}        // opcional
/>
```

## Diseño para no estorbar (§8)

- Toolbar compacta con menús "Columnas", "Densidad" y "Exportar" (no satura).
- Las variantes se recuerdan por usuario y por tabla.
- El pie con Σ solo aparece si hay columnas numéricas.

## Dónde se aplica hoy

- Control Plane: empresas (`/admin/tenants`), módulos, auditoría global,
  importaciones, soporte.
- Es reutilizable en cualquier módulo del ERP (clientes, ventas, productos,
  inventario…) pasando sus columnas.

## Prueba E2E

`tests/e2e/nexo-control-plane.spec.ts` verifica búsqueda, selector de columnas y
exportación en el listado de empresas.
