# Patrones SAP/ERP aplicados sin copiar SAP

## Que se toma como patron

- Acciones contextuales por pantalla y por registro.
- Estado visible del documento/objeto.
- Pestañas por tipo de informacion.
- Navegacion a datos relacionados.
- Historial de cambios y auditoria por objeto.
- Separacion entre crear, modificar, visualizar, grabar, imprimir, cancelar, liberar y bloquear.
- Objetos maestros conectados: sociedad/tenant, almacen, centro de costo, ubicacion, cliente/proveedor, lote y documento origen/destino.

## Como se traduce a Nexo

- Barra moderna de acciones en cada modulo, con permisos efectivos.
- Detalle de registro con pestañas: resumen, control, relacionados, movimientos, auditoria y archivos.
- Status chips claros: borrador, confirmado, liberado, bloqueado, cancelado, vencido, pagado, en cuarentena.
- Acciones de proceso: liberar lote, bloquear lote, cancelar documento, generar remision, generar factura, registrar pago.
- Navegacion relacionada desde producto, cliente, almacen, lote, pedido, factura y pago.

## Lo que no se copia

- No se copian menus visuales antiguos ni nomenclatura rigida de SAP.
- No se llena pantalla con acciones irrelevantes.
- No se agregan modulos solo para parecer grande.
- No se ocultan errores detras de codigos tecnicos.

## Aplicacion prioritaria

1. Admin Ultra: tabs de modulos, fiscal, CRM, IA, auditoria.
2. Clientes: saldo, ventas, pedidos, facturas, pagos, CRM y auditoria.
3. Productos/lotes: stock, almacenes, lotes, caducidad, movimientos, documentos.
4. Ventas: cliente, credito, disponibilidad, margen, remision, factura, pago.
5. Facturacion: folio, serie, estado, pagos, saldo, documentos relacionados.

