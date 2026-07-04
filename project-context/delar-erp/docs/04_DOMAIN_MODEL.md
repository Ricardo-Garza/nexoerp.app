# Modelo de dominio

## Identidades principales

### Catálogo

- `ProductFamily`: concepto comercial/sabor, por ejemplo Ranch o Mango Habanero.
- `Product`: producto lógico por marca/familia.
- `SKU`: presentación vendible/comprable concreta.
- `Packaging`: relación pieza/caja/pallet y códigos EAN/DUN.
- `Uom` y `UomConversion`: unidad y conversión exacta con alcance.

### Inventario

- `Warehouse` → `Location`.
- `Lot`: SKU, lote proveedor/interno, fabricación, caducidad y estado de calidad.
- `InventoryMovement`: entrada/salida/transferencia/reserva/liberación/ajuste/producción.
- `StockProjection`: vista reconstruible agrupada por organización, ubicación, SKU, lote y estado.

### Comercial

- `Customer`, `Address`, `Contact`, `CreditProfile`.
- `PriceList`, `PriceRule`, `Promotion`.
- `Quote` → `SalesOrder` → `Allocation` → `Shipment` → `Invoice` → `Payment`.
- `PosSession`, `PosOrder`, `CashMovement`.

### Abasto

- `Vendor`, `VendorSKU`.
- `PurchaseRequest` → `PurchaseOrder` → `GoodsReceipt` → `VendorBill`.

### Manufactura

- `Formula` → `FormulaVersion` → `FormulaComponent`.
- `ProductionOrder` → `ProductionBatch`.
- `BatchConsumption`, `BatchOutput`, `YieldRecord`, `WasteRecord`.

### Calidad

- `QualitySpec`, `QualityPlan`, `QualityInspection`, `QualityResult`.
- `Disposition`: quarantine/released/rejected/conditional.
- `Deviation`, `Capa`, `RecallCase`.

### Finanzas y control

- `JournalEntry`, `JournalLine`.
- `ApprovalRequest`, `AuditEvent`, `OutboxEvent`, `Attachment`.

## Invariantes

1. Un SKU tiene una UOM base única; conversiones vigentes no pueden ser ambiguas.
2. Un movimiento confirmado no se edita ni elimina; se revierte con otro movimiento.
3. La suma del ledger determina stock; no existe “editar existencia”.
4. Un lote de venta obligatoria no puede quedar sin lote.
5. Un lote no liberado no puede asignarse a ventas ni consumo, salvo permiso y flujo de desviación.
6. Cantidad reservada no puede exceder cantidad utilizable.
7. Un documento confirmado conserva snapshot de precio, impuestos, condiciones y UOM.
8. Una fórmula liberada es inmutable; un cambio crea nueva versión.
9. Un batch terminado debe reconciliar consumos, outputs, merma y variación.
10. Un asiento confirmado cuadra débitos y créditos y no se edita.
11. Toda transición crítica registra actor, razón y correlation ID.
12. Todo registro transaccional pertenece a una organización.

## Estados sugeridos

- Quote: draft, sent, accepted, rejected, expired, cancelled.
- SalesOrder: draft, approved, confirmed, allocated, partially_shipped, shipped, closed, cancelled.
- PurchaseOrder: draft, submitted, approved, sent, partially_received, received, closed, cancelled.
- Lot quality: quarantine, pending, released, conditional, rejected, expired, recalled.
- ProductionOrder: draft, planned, released, in_progress, quality_hold, completed, closed, cancelled.
- Invoice: draft, issued, partially_paid, paid, overdue, cancelled.
