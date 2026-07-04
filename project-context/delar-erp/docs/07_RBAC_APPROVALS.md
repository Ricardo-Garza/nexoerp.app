# Roles, permisos y aprobaciones

## Roles base

- `super_admin`: plataforma; no implica acceso silencioso a datos sensibles.
- `org_admin`: configuración de organización y usuarios.
- `director`: lectura ejecutiva y aprobaciones de alto nivel.
- `sales_manager`, `sales_rep`.
- `cashier`, `pos_supervisor`.
- `purchasing_manager`, `buyer`.
- `warehouse_manager`, `warehouse_operator`.
- `production_manager`, `production_operator`.
- `quality_manager`, `quality_analyst`.
- `finance_manager`, `ar_specialist`, `ap_specialist`.
- `auditor`: lectura y evidencia, sin operación.

## Permisos granulares de ejemplo

- `price.override`, `discount.approve`, `margin.view`.
- `stock.adjust.request`, `stock.adjust.approve`.
- `lot.release`, `lot.reject`, `lot.override_fefo`.
- `purchase.approve`, `vendor.change_terms`.
- `formula.view`, `formula.edit`, `formula.release`.
- `production.issue`, `production.close`.
- `pos.refund`, `pos.cash_difference.approve`.
- `invoice.issue`, `payment.apply`, `journal.post`.
- `audit.export`, `user.manage`.

## Matriz de segregación mínima

- Quien solicita un ajuste no lo aprueba cuando supera umbral.
- Quien captura resultado de calidad no libera su propia desviación crítica.
- Quien crea proveedor/cuenta bancaria no aprueba el primer pago.
- Quien modifica fórmula no libera esa misma versión sin segundo rol.
- Cajero no cambia precio ni anula después de cierre sin supervisor.

## Motor de aprobación

Debe soportar reglas por:

- tipo de documento;
- importe/margen/descuento;
- familia/SKU;
- proveedor/cliente de riesgo;
- almacén/sucursal;
- lote/calidad;
- rol y cadena de reemplazo;
- expiración y escalamiento.
