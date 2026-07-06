# Tablas tipo SAP/ALV modernas

## Estado actual

`components/ui/data-table-pro.tsx` ya entrega una base reutilizable:

- busqueda global;
- ordenamiento;
- selector de columnas;
- densidad compacta/media/comoda;
- export CSV/XLSX;
- seleccion y acciones masivas;
- totales numericos;
- variantes locales en `localStorage`.

## Brechas frente al objetivo

- Filtros avanzados.
- Chips de filtros activos.
- Limpiar filtros.
- Reordenar columnas.
- Redimensionar columnas.
- Agrupacion/subtotales.
- Variantes persistidas por usuario en Firestore.
- Variantes compartidas por rol.
- Auditoria rapida por fila.
- Permiso granular para exportar.

## Politica de aplicacion

Aplicar `DataTablePro` primero a:

- tenants;
- auditoria;
- importaciones;
- clientes;
- productos;
- inventario;
- lotes;
- ventas/pedidos;
- facturas/pagos;
- proveedores;
- empleados;
- mantenimiento.

## UX

La barra visible debe quedar simple: buscar, filtros rapidos, opciones, exportar si aplica. Lo avanzado vive en "Opciones" para no saturar operacion diaria.

