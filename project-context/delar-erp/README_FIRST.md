# DELAR ERP — paquete de contexto para Claude Code

Este paquete convierte el prototipo actual **Nexo ERP** en una plataforma operativa para una empresa que distribuye y puede fabricar salsas, aderezos, sazonadores, condimentos e ingredientes food-service.

## Objetivo real

No se busca copiar SAP, Oracle u Odoo. Se busca un ERP especializado que sea superior para esta operación concreta: menos clics, trazabilidad total, inventario por lote y caducidad, compras, ventas, POS, producción, calidad, costos, cobranza, entregas y automatización con IA bajo control humano.

## Cómo usarlo

1. Clona o abre en Claude Code el repositorio que despliega `https://v0-flower-shop-erp-ricky.vercel.app/`.
2. Copia esta carpeta completa dentro del repositorio como `project-context/delar-erp/`.
3. Copia también los tres videos originales a `project-context/delar-erp/reference/videos/` si los tienes disponibles localmente.
4. Abre Claude Code en la raíz del repositorio.
5. Selecciona el modelo de programación más capaz disponible y razonamiento alto.
6. Pega el contenido de `MASTER_PROMPT_CLAUDE_CODE.md`.
7. Permite que Claude inspeccione el repositorio antes de modificarlo. No le pidas que “haga todo de una vez” fuera del ciclo de verificación definido en el prompt.

## Orden de lectura obligatorio para Claude

1. `MASTER_PROMPT_CLAUDE_CODE.md`
2. `CLAUDE.md`
3. `docs/01_PRODUCT_VISION.md`
4. `docs/02_BUSINESS_CONTEXT.md`
5. `docs/03_FUNCTIONAL_SCOPE.md`
6. `docs/04_DOMAIN_MODEL.md`
7. `docs/05_DATABASE_BLUEPRINT.md`
8. `docs/06_WORKFLOWS.md`
9. `docs/07_RBAC_APPROVALS.md`
10. `docs/08_AI_AUTOMATION.md`
11. `docs/09_UI_UX.md`
12. `docs/10_SECURITY_AUDIT.md`
13. `docs/11_TESTING_ACCEPTANCE.md`
14. `docs/12_ROADMAP.md`
15. `docs/13_MIGRATION_DEPLOYMENT.md`
16. `docs/14_OPEN_QUESTIONS.md`
17. `docs/15_REFERENCE_EVIDENCE.md`
18. Archivos de `data/`

## Decisiones que ya quedan fijadas

- Idioma inicial: español de México.
- Zona horaria de negocio: `America/Monterrey`.
- Moneda base: MXN.
- Arquitectura web: preservar el stack compatible que ya exista; si el repositorio es Next.js/TypeScript, mantenerlo y endurecerlo.
- Base de datos objetivo preferente: PostgreSQL administrado mediante Supabase, con RLS real y migraciones versionadas.
- Despliegue web: Vercel.
- Modelo de inventario: libro mayor inmutable de movimientos, no un simple campo de existencia editable.
- Trazabilidad: lotes obligatorios para productos configurados, FEFO, caducidad, bloqueo de calidad y rastreo hacia atrás/hacia adelante.
- Dinero: `numeric/decimal`, nunca `float`.
- Operaciones críticas: idempotencia, auditoría y transacciones.
- IA: copiloto con confirmación humana; nunca publica, factura, paga, ajusta inventario o libera calidad sin autorización explícita.

## Importante sobre los datos

Las listas de precios incluidas están fechadas en 2025 y se consideran **datos históricos para sembrado y pruebas**, no precios vigentes. El sistema debe manejar vigencias, versiones y aprobación de listas. Las discrepancias detectadas están documentadas en `data/data_quality_issues.csv`.
