# Nexo Intelligence — Arquitectura

```
Navegador (components/assistant + components/copilot)
   │  POST /api/copilot/query  { question, tenantId, memory }
   ▼
app/api/copilot/query/route.ts   sesión · tenant · rol · zod · rate limit · no-store
   ▼
AnalyticsQueryService (lib/copilot/service.ts)  límites de filas/tiempo · caché corta por tenant
   ▼
DataSourceAdapter (lib/copilot/adapters)   mock Soleil │ REST del cliente (esqueleto)   ← SOLO LECTURA
   ▼
DataView (analytics/view.ts)  filas de venta normalizadas a MXN, notas de crédito como ajustes
   ▼
runCopilot (lib/copilot/engine)
   guardrails → comandos de conversación → NLU → planificador → handler analítico → resultado + evidencia
```

La base de datos **nunca** llega al navegador: el cliente solo recibe resultados agregados, tablas acotadas (≤ 25 filas),
15 registros de respaldo y una memoria de sesión de pocos KB.

## Pipeline de consulta

| Etapa | Implementación |
|---|---|
| Normalización | `nlu/normalize.ts`: minúsculas, sin diacríticos, slang («ke», «q», «lana»), canonicalización de raíces del dominio, stemming ligero, Levenshtein acotado. |
| Intención | `nlu/classifier.ts`: TF-IDF (unigramas + bigramas + trigramas de caracteres, tolera typos) con coseno al mejor ejemplo y al centroide, mezclado con reglas de palabras clave ponderadas; + `nlu/refine.ts`, reglas léxicas que separan intenciones vecinas (cartera vencida / % vencido / saldo por cliente). 44 intenciones, ~570 ejemplos de entrenamiento. |
| Entidades | `nlu/entities.ts`: periodos (hoy, ayer, mes pasado, «oct», «últimos seis meses», trimestres, años), top N, familia, industria, cliente (difuso, ambiguo, inexistente), SKU/calibre/nombre de producto, almacén, umbrales de días, tipo de gráfica, horizonte. |
| Contexto | `engine/index.ts` + `engine/planner.ts`: detecta fragmentos de seguimiento y hereda de `SessionMemory` (última consulta, periodos, cliente, familias). |
| Plan tipado | `schema.ts` (`AnalyticalQuery`, zod `.strict()`): listas blancas de intención, dimensión, filtros, límites (1–50). Sin `eval`, sin SQL ni JS generado del texto. |
| Permisos | Guardrails previos (`engine/guardrails.ts`) + autorización de tenant/rol en la ruta + adaptador por tenant. |
| Analítica | `analytics/*`: funciones puras sobre registros estructurados. Nada de textos precalculados. |
| Resultado | `result.ts`: KPIs, gráfica, tabla, evidencia (cálculo + fuente + registros), supuestos, avisos, sugerencias. Las gráficas y tablas salen del **mismo** arreglo de grupos que los KPIs. |

## Definiciones de indicadores (resumen)

`docs/MOCK_DATA_DICTIONARY.md` contiene el detalle. En corto: venta neta = Σ(cantidad × precio − descuento) de pedidos no
cancelados en MXN (TC del documento) − notas de crédito; margen bruto = venta neta − costo de ventas; saldo de factura = total − pagos − notas de crédito; stock crítico = existencia total < mínimo.

## Intención vs. entidad vs. métrica

`intent` decide el handler; las entidades llenan `filters`, `period`, `comparison`, `limit`, `sort`; la visualización es un campo
aparte (`auto`, `chart`, `bar`, `line`, `area`, `donut`, `table`, `kpi`, `none`) que `finalizeViz` aplica sin cambiar las cifras.

## Confianza y ambigüedad

`confidence` = puntaje híbrido del clasificador (calibración en `COPILOT_EVALUATION.md`). Umbrales en `CONFIDENCE`:
< 0.30 → «no estoy seguro», con opciones; margen < 0.03 entre dos intenciones de datos y confianza < 0.50 → pregunta cuál;
clientes con nombre similar → lista de opciones; cliente/periodo inexistente → `no_data` explícito.

## Memoria de sesión

Solo en el navegador (no se persiste, no entrena nada). Se limpia con «Limpiar» o «limpia la conversación», y el servidor la
**revalida** en cada petición: `memorySchema` estricto, y los IDs de cliente/SKU/familia/almacén se verifican contra el tenant;
lo desconocido se descarta (ver prueba de memoria manipulada).

## Componentes

- **Nuevos**: `lib/copilot/**`, `components/copilot/**`, `app/api/copilot/query`, `app/dashboard/nexo-intelligence`, `scripts/generate-copilot-dataset.mjs`.
- **Modificados**: `components/assistant/floating-assistant.tsx` (un solo asistente: modo copiloto o guía), módulo `intelligence` en `lib/platform/*` (solo empresas de distribución), `app/globals.css` (animaciones con `prefers-reduced-motion`), icono del sidebar.
- **Reutilizados**: `lib/assistant/nexo-assistant.ts` (ayuda y navegación, vía `status: "delegate"`), Recharts, zod, contexto de plataforma, sesión demo.

## Qué NO hace

No escribe datos; no ejecuta código del usuario; no llama a servicios externos; no predice con ML (el pronóstico es una regresión
lineal declarada como tal).
