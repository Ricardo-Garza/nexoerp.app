# Nexo Intelligence — Evaluación

```
npm run copilot:eval                                   # ejecuta el banco y valida umbrales
COPILOT_EVAL_REPORT=informe.json npm run copilot:eval  # además guarda el informe completo
```

Banco: `lib/copilot/eval/bank.ts` — **180 preguntas** (ventas 22, clientes 18, productos 18, inventario 14, finanzas 14, CRM 12,
analítica 12, multi-turno 8, adversariales/typos/sin datos 22, ciego 40). Cada caso valida **interpretación** (intención o estado) y,
cuando aplica, la **cifra** contra un oráculo independiente (`eval/oracle.ts`, bucles simples sobre los datos crudos, sin usar
`analytics/*`). Los casos se dividen en `dev`, `holdout` y `blind`.

## Resultados — lo que realmente se midió, en orden

| Corrida | Qué es | Resultado |
|---|---|---|
| 1. Primera medición | Primera corrida. Un chequeo manual descubrió que **73 frases de entrenamiento eran idénticas a preguntas del banco** (fuga). | 132/140 = 94.3 % (**inflado por la fuga**) |
| 2. Primera medición limpia | Tras eliminar la fuga y reponer paráfrasis distintas. | **121/140 = 86.4 %** · dev 74/80 = 92.5 % · **holdout 47/60 = 78.3 %** |
| 3. Tras correcciones | Refinador léxico, genéricos de producto, guardrail de cambio de rol, búsqueda por familia. Se corrigieron fallos de la corrida 2, así que **dev y holdout ya no son ciegos**. | 140/140 |
| 4. Segundo conjunto ciego | 40 preguntas nuevas, redactadas después de las correcciones. Primera corrida. | **32/40 = 80.0 %** |
| 5. Tras corregir esos 8 fallos | Típicos: sinónimos («órdenes de venta», «sin moverse»), «baja» como adjetivo bloqueada como escritura, «en 6 meses». El conjunto ciego ya no es ciego. | 180/180 |

**Conclusión honesta:** el criterio «≥ 95 % de ejecución correcta con pruebas reservadas» **se cumple en el banco ya usado para
ajustar (100 %) pero NO está demostrado para preguntas realmente nuevas: la única medición ciega fue 80 %**. Es la cifra
que conviene comunicar. (Nota: el caso `b03` coincidía con una frase de entrenamiento —la prueba `no hay fuga` lo detectó
después— y se eliminó del entrenamiento; la corrida ciega original lo pasó gracias a esa fuga.) Para un 95 % ciego hace falta
más entrenamiento con redacciones reales de usuarios del cliente.

La prueba `copilot-nlu › no hay fuga` impide que una pregunta del banco vuelva a entrar al entrenamiento.

## Clasificador de intenciones (preguntas de un turno con intención esperada, n = 148, **tras el ajuste**)

| Variante | Exactitud | Macro-F1 |
|---|---:|---:|
| Solo reglas de palabras clave (baseline) | 64.9 % | 0.586 |
| Solo TF-IDF + coseno | 80.4 % | 0.779 |
| Híbrido TF-IDF + reglas | 82.4 % | 0.803 |
| **Híbrido + refinador léxico (producción)** | **94.6 %** | **0.961** |

El componente entrenable (TF-IDF, ~570 ejemplos, sin GPU ni modelos descargados) mejora +15 pts sobre el baseline de reglas, por lo
que se justifica; **no es aprendizaje profundo** ni se presenta como tal. Validación cruzada leave-one-out sobre el entrenamiento
(sin refinador): reglas 55.6 %, TF-IDF 78.0 %, híbrido 81.1 %. La métrica del refinador está inflada por haberse diseñado mirando
errores del banco.

### Calibración de la confianza (híbrido, n = 148)

| Confianza | n | Exactitud |
|---|---:|---:|
| < 0.30 | 0 | — |
| 0.30 – 0.50 | 4 | 100 % (muestra muy pequeña) |
| 0.50 – 0.70 | 72 | 90.3 % |
| ≥ 0.70 | 72 | 98.6 % |

La confianza ordena correctamente (más alta ⇒ más acierto); con 4 casos en el tramo bajo no se puede afirmar calibración fina.
Texto ininteligible produce confianza < 0.30 y el motor pide aclarar en lugar de responder.

## Otras métricas

- **Exactitud numérica (oráculo independiente)**: 0 diferencias en las cifras financieras verificadas: venta neta, costo, margen,
  pedidos, saldo por cobrar, vencido, > 60 días, stock bajo mínimo, valor de inventario, pipeline, ponderado, conversión, concentración,
  rankings (tolerancia 0.01 MXN).
- **Respuestas con cifras sin respaldo**: 0 (todas traen evidencia; verificado por la prueba y el informe).
- **Aislamiento por tenant**: 0 consultas fuera del tenant autorizado (pruebas unitarias del adaptador y E2E de la API).
- **Pruebas**: 239 unitarias (Vitest) en 19 archivos; E2E Playwright 22 (11 × desktop/tablet; 1 omitido por diseño).

## Limitaciones conocidas

1. **Generalización**: ver arriba (80 % ciego). Faltan paráfrasis reales; el léxico es español de México.
2. **Léxico específico del dataset**: `GENERIC_COMPANY_WORDS` y `CUSTOMER_STOP` (entidades) se calibraron para los nombres simulados; un cliente real requiere ajustar ese léxico (es configuración, no lógica).
3. **Escala**: `AnalyticsQueryService` carga las colecciones completas por tenant (límite 100 000 filas, 8 s). Para bases grandes los adaptadores deben empujar agregaciones al origen.
4. **Pronóstico**: regresión lineal sin estacionalidad (R² ≈ 0.1 en el dataset); solo orientativo.
5. **Meses incompletos**: el mes en curso se compara contra los mismos días del anterior, pero con ~23 días la variación es ruidosa.
6. **Sin datos de 2025 previos a abril**: comparaciones año contra año no son posibles y el motor lo dice.
7. **Intenciones vecinas**: `sales.by_customer` ≈ `customers.top`, `customers.balance` ≈ `finance.overdue` comparten salida; el banco las acepta como equivalentes donde corresponde.
8. **Seguridad**: los barandales son listas de patrones; un atacante creativo podría evadir la detección léxica. La protección real es estructural: solo lectura, planes validados con zod, sin SQL/JS generado, tenant verificado en servidor.
9. **Dependencias**: `npm audit --omit=dev` reporta 13 vulnerabilidades (3 críticas, 8 altas) **preexistentes** (p. ej. `xlsx` sin parche); este trabajo no agregó dependencias. Requiere revisión aparte.
10. **Autenticación**: el copiloto solo funciona en modo demo (cookie de usuario demo); la verificación server-side con Firebase Admin sigue pendiente (deuda D4 del repo).
11. **Layout móvil**: el ERP general no es responsivo a 390 px (ancho de documento 626 px); el panel del asistente sí cabe y no empeora el desbordamiento, pero la página sigue haciendo scroll horizontal.
