# Estrategia de asistente y BI

## Asistente

Estado actual: asistente flotante rule-based, sin API key, con ayuda contextual y navegacion. Esto es correcto para operar sin costo y sin exponer secretos.

Evolucion:

1. Respetar tenant activo y permisos efectivos.
2. Explicar que puede hacerse en la pantalla actual.
3. Sugerir filtros y abrir vistas.
4. Iniciar importaciones.
5. Buscar registros.
6. Resumir cliente/producto/lote/pedido con datos autorizados.
7. Delegar a proveedor IA solo cuando el tenant active BYOK.

Regla: IA nunca confirma pagos, ajusta inventario, libera lotes, emite factura, cambia precio ni modifica permisos sin confirmacion determinista y auditoria.

## BYOK

La configuracion debe existir por tenant:

- activo/inactivo;
- proveedor;
- modelo;
- presupuesto mensual;
- limite por usuario;
- modulos permitidos;
- kill switch;
- logs;
- auditoria;
- estado de secreto server-side.

No guardar llaves visibles en Firestore ni exponerlas al frontend.

## BI

BI no debe mostrar graficas vacias. Debe:

- analizar ventas, margen, inventario, rotacion, vencimientos, cobranza y errores;
- mostrar estado vacio util cuando faltan datos;
- sugerir capturar/importar datos especificos;
- abrir listas filtradas para investigar.

Primeras recomendaciones utiles:

- productos por vencer;
- clientes con saldo vencido;
- productos sin stock o bajo minimo;
- pedidos abiertos sin remision;
- importaciones con errores;
- lotes en cuarentena sin decision.

