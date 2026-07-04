# Flujos operativos

## Cotización a cobro

1. Seleccionar cliente/canal.
2. Resolver lista de precios y reglas vigentes.
3. Capturar SKU, cantidad y UOM; convertir a base.
4. Verificar disponibilidad y fecha prometida.
5. Calcular subtotal, descuento, impuesto, flete y margen.
6. Aprobar excepciones.
7. Enviar PDF/link y registrar evidencia.
8. Aceptar y convertir a pedido con snapshot.
9. Reservar FEFO; crear backorder si falta.
10. Pick/pack/ship o pickup.
11. Emitir documento fiscal mediante adaptador cuando esté configurado.
12. Registrar pago/cartera y cerrar.

## POS

1. Abrir sesión con fondo.
2. Escanear/buscar SKU y elegir presentación.
3. Seleccionar cliente opcional.
4. Aplicar precio autorizado.
5. Confirmar lote FEFO o asignación automática.
6. Cobrar efectivo/tarjeta/cuenta/mixto.
7. Confirmar transacción atómica: venta + inventario + pago + asiento.
8. Imprimir/enviar ticket con QR.
9. Devolución referenciada al ticket y disposición de inventario.
10. Cierre con conteo, diferencias y aprobación.

## Compra a disponibilidad

1. Sugerencia o solicitud de compra.
2. RFQ/comparación y aprobación.
3. PO con empaque/UOM/lead time.
4. Recepción parcial o total.
5. Captura de lote proveedor, caducidad y documentos.
6. Entrada a cuarentena.
7. Inspección y liberación/rechazo.
8. Disponibilidad o devolución.
9. Match con factura y pago.

## Producción por lote

1. Seleccionar fórmula/version liberada.
2. Definir cantidad objetivo y fecha.
3. Explosionar necesidades y reservar materias primas FEFO.
4. Liberar orden con check de materiales/calidad.
5. Emitir lotes a batch; registrar pesadas reales.
6. Registrar controles de proceso.
7. Recibir output, merma, retrabajo y muestras.
8. Crear lote terminado en cuarentena.
9. Inspección y liberación.
10. Calcular rendimiento y costo real.

## Recall

1. Abrir caso y bloquear lote(s).
2. Trazar ingredientes/proveedores hacia atrás.
3. Trazar clientes, pedidos, POS y envíos hacia adelante.
4. Cuantificar producido, en stock, vendido, devuelto y perdido.
5. Generar lista de contactos/acciones.
6. Registrar comunicaciones, recuperación y cierre.
