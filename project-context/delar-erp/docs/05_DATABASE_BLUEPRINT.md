# Blueprint de base de datos

El archivo `database/000_domain_blueprint.sql` es un mapa de entidades, no debe aplicarse ciegamente. Claude debe adaptarlo al stack y producir migraciones pequeñas, reversibles y probadas.

## Convenciones

- PK internas UUID.
- `organization_id` obligatorio en datos de negocio.
- `created_at`, `updated_at`, `created_by`, `updated_by` donde corresponda.
- `version` para optimistic locking en documentos.
- `numeric(20,6)` para cantidades; `numeric(20,4)` o política central para dinero.
- Códigos y folios de negocio con secuencias por organización/tipo.
- Soft delete solo en maestros; transacciones nunca se borran.
- JSONB únicamente para extensiones o snapshots, no para reemplazar relaciones centrales.

## Índices mínimos

- organización + estado + fecha en documentos.
- SKU/código/barcode normalizado.
- lote por SKU, expiración y calidad.
- ledger por SKU/lote/ubicación/fecha.
- búsqueda de cliente/proveedor por RFC, nombre y contacto.
- documentos por folio y external ID.
- auditoría por entidad/actor/fecha/correlation ID.

## RLS

- La sesión obtiene organizaciones permitidas desde membresías, no desde un `organization_id` enviado libremente por cliente.
- Usuario de almacén se restringe a ubicaciones asignadas cuando aplique.
- Fórmulas, costos y finanzas tienen políticas adicionales por permiso.
- Service-role solo en backend confiable y jobs; jamás en navegador.

## Funciones transaccionales prioritarias

- `post_inventory_movement`
- `reserve_stock_fefo`
- `release_reservation`
- `confirm_goods_receipt`
- `confirm_pos_sale`
- `reverse_pos_sale`
- `issue_production_materials`
- `receive_production_output`
- `change_lot_disposition`
- `post_journal_entry`

Cada función debe aceptar idempotency key, validar estado/permisos y devolver un resultado tipado.
