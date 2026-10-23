# Diccionario de datos DEMO — Soleil Wire

**Todo es simulado** salvo las familias y nombres base de producto (catálogo ya presente en el repo). Generador determinista:
`lib/copilot/data/generator.ts` (semilla `soleilwire-demo-v1`, fecha de referencia **2026-10-23**, historia 2025-04-01 → 2026-10-23).

```
npm run copilot:dataset            # imprime conteos y SHA-256; falla si no coincide con dataset-manifest.json
npm run copilot:dataset -- --write # actualiza el manifiesto (solo si el cambio es intencional)
```

## Volúmenes generados (manifiesto versionado)

| Entidad | Registros | Objetivo |
|---|---:|---|
| Clientes | 120 | 100–150 |
| Productos (SKU = producto base × calibre) | 199 | 150–250 |
| Proveedores | 20 | 15–30 |
| Almacenes | 3 (MTY, CDMX, GDL) | 2–4 |
| Pedidos de venta | 1,348 | 1,000–1,500 |
| Líneas de pedido | 4,017 | 2,500–5,000 |
| Cotizaciones | 398 | 200–400 |
| Oportunidades CRM | 150 | 100–200 |
| Facturas | 1,199 | 700–1,200 |
| Pagos | 1,111 | 500–1,000 (excede el rango orientativo: hay pagos parciales) |
| Notas de crédito | 54 | — |
| Órdenes de compra | 1,140 | — |
| Movimientos de inventario | 5,669 | 2,000–4,000 (excede el rango: una salida por línea de pedido) |

## Relaciones

Cliente → Cotización → Pedido → Factura → Pago / Nota de crédito · Oportunidad → Cliente → Cotización · Proveedor → Orden de compra
→ Recepción → Movimiento · Producto → Movimiento de inventario por almacén. Verificado en `tests/unit/copilot-dataset.test.ts`.

## Reglas de negocio

- `importeLinea = cantidad × precioUnitario − descuento` (en la moneda del documento, sin IVA; IVA 16 % en factura).
- Moneda: MXN (TC = 1) o USD con tipo de cambio por documento (≈ 16.3–18.1); los costos siempre en MXN.
- Unidades: `m`, `rollo` (= 100 m) y `pza` (conectores MC4). Nunca se suman metros con piezas: las cantidades se reportan por unidad; «metros equivalentes» incluye rollos y excluye piezas.
- Pedidos `Cancelado`: no son venta, no se facturan y no mueven inventario. Estados: Confirmado, Surtido, Facturado, Cancelado.
- Pagos: el total pagado + notas de crédito nunca excede la factura. Perfiles de pago: puntual, lento, moroso.
- Inventario: saldo = Σ movimientos; nunca negativo al cierre de ningún día (reabasto por OC con lead time del proveedor; recepciones puntuales de urgencia).
- Estacionalidad (mes), tendencia (+1.5 % mensual), productos en crecimiento/caída, productos sin ventas (7 %), SKUs críticos (12 %), márgenes bajos (< 8 %), clientes por arquetipo: estratégico, recurrente, creciente, ocasional, nuevo, inactivo.

## Indicadores

| Indicador | Definición |
|---|---|
| Venta bruta | Σ cantidad × precio (MXN). |
| Venta neta | Σ(cantidad × precio − descuento) de pedidos no cancelados − notas de crédito del periodo (MXN). |
| Costo de ventas | Σ cantidad × costo unitario MXN − costo revertido en devoluciones físicas. |
| Margen bruto / % | Venta neta − costo de ventas; margen ÷ venta neta × 100. |
| Ticket promedio | Venta de pedidos (sin notas de crédito) ÷ pedidos distintos. |
| Saldo de factura | Total con IVA − pagos − notas de crédito (moneda del documento), × TC de la factura. |
| Vencida / antigüedad | Fecha de corte > vencimiento; cubetas: por vencer, 1-30, 31-60, 61-90, > 90 días. |
| % facturas vencidas | Facturas vencidas ÷ facturas con saldo abierto (también se informa el % en monto). |
| Stock crítico | Existencia total (todos los almacenes) < stock mínimo del SKU. |
| Rotación | Unidades vendidas en 12 meses ÷ inventario promedio de 12 cortes. |
| Sin movimiento | Existencia > 0 y sin movimientos distintos de la apertura en N días (180 por omisión). |
| Pipeline / ponderado | Σ monto de oportunidades abiertas; Σ monto × probabilidad de etapa. |
| Conversión | Oportunidades ganadas ÷ (ganadas + perdidas); cotizaciones ganadas ÷ (ganadas + perdidas + vencidas). |
| Pronóstico | Regresión lineal sobre ≤ 12 meses completos, banda ±1.28 σ de residuos (no es ML). |

## Para sustituir por datos reales

Mantén los mismos tipos de `lib/copilot/types.ts` en el adaptador (ver `CLIENT_API_INTEGRATION_GUIDE.md`).
