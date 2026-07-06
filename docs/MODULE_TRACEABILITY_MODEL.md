# Modelo de trazabilidad por modulo

## Evento de auditoria minimo

Todo cambio relevante debe registrar:

- `tenantId`.
- `actorId` y `actorEmail`.
- `actorRole`.
- `action`.
- `entityType` y `entityId`.
- `fieldChanges`: campo, anterior, nuevo.
- `reason` cuando aplique.
- `sourceModule`.
- `documentId` relacionado.
- `importRunId` relacionado.
- `integrationRunId` relacionado.
- `correlationId`.
- `createdAt`.

## Relaciones transversales

- Cliente -> contactos, direcciones, cotizaciones, pedidos, facturas, pagos, actividades CRM, documentos, auditoria.
- Producto -> proveedor principal, precios, stock por almacen, lotes, ventas, compras, movimientos, documentos, auditoria.
- Lote -> producto, almacen, ubicacion, caducidad, status, entradas, salidas, documentos origen/destino, liberaciones/bloqueos.
- Venta -> cliente, credito, almacen, disponibilidad, precios, margen, impuestos, remisiones, facturas, pagos, auditoria.
- Factura -> pedido/remision, cliente, pagos, saldo, PDF, folio/serie, PAC/mock, auditoria.
- Tenant -> modulos, usuarios, roles, branding, fiscal, CRM, IA, importaciones, auditoria.

## Implementacion incremental

1. Crear componente `RecordTraceabilityPanel`.
2. Normalizar `AuditRecord` para diff campo-a-campo.
3. Hacer que cada mutacion use un `correlationId`.
4. Cargar relacionados por pestaña con lazy loading.
5. Bloquear acciones criticas sin motivo cuando la politica lo exige.

## Criterio de aceptacion

Un auditor debe poder abrir cualquier cliente, producto, lote, pedido, factura o tenant y responder: quien lo creo, quien lo cambio, que cambio, cuando, desde que modulo, por que y que documentos se afectaron.

