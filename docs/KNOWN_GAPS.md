# Brechas conocidas — Nexo ERP 2027 (repo oficial nexoerp.app)

Actualizado: 2026-07-03. Nada de esta lista se presenta como terminado; es el registro
honesto exigido por `production-final/PROMPT_DEFINITIVO_NEXO_ERP_PRODUCCION_PLUGINS.md` §18.

## Bloqueado por decisión/credenciales del propietario

| Gap | Detalle | Desbloqueo |
| --- | --- | --- |
| Persistencia durable del dominio DELAR | El dominio nuevo (catálogo/precios/lotes) usa el puerto `DomainStore` con adaptador in-memory; en serverless las mutaciones no persisten entre invocaciones. Lectura del seed siempre disponible. | Autorizar proyecto Supabase (ADR 0002) → adaptador SQL + migraciones + RLS |
| RLS real multi-tenant | Diseñada en `MULTITENANCY_ARCHITECTURE.md`; el aislamiento hoy es a nivel aplicación (`organizationId` en el store y auditoría) | Supabase/PostgreSQL |
| Sesión server-side verificable en modo Firebase | Server actions del dominio nuevo exigen modo demo; en producción Firebase las mutaciones DELAR están deshabilitadas con aviso en UI | Firebase Admin SDK o Supabase Auth |
| CFDI/PAC | No implementado; arquitectura de adaptador definida en roadmap. No se presenta timbrado ficticio como real | Credenciales PAC + decisión fiscal |
| CRM Momentum contra instancia real | Puerto + adaptador HTTP contra los endpoints reales de auto-crm + mock sandbox con contratos verdes. No apunta a datos reales | `MOMENTUM_BASE_URL` configurada y aprobada |
| Videos de referencia | `reference/videos/` sigue con placeholder | Copiar los 3 MP4 |

## Deuda técnica visible

| Gap | Estado | Plan |
| --- | --- | --- |
| Errores TypeScript | **0 errores** — `ignoreBuildErrors` ELIMINADO; build compila estricto (eran 153; −73 % este ciclo). Todos en páginas/mocks v0 (field-services, warehouse tabs, sales dialogs legacy, tipos Timestamp/Date). El código de dominio/UI nuevo compila estricto con 0 errores | Reducir por capas; `ignoreBuildErrors` sigue activo SOLO por este residuo (documentado, no oculto) |
| Firestore Rules no versionadas | La frontera de datos de los módulos legacy client-side vive en la consola Firebase | Versionar rules o migrar módulos al dominio server-side |
| Warnings de lint legacy | 50 avisos (react-hooks nuevos, entidades sin escapar) en código v0; 0 errores | Corregir al tocar cada módulo |
| Módulos legacy con datos mock | banking/accounting/production/maintenance/payroll/bi/ecommerce muestran datos demo locales o de Firestore sin flujo end-to-end del dominio nuevo | Roadmap por vertical slices (`IMPLEMENTATION_ROADMAP.md`) |
| Módulos del menú objetivo aún no construidos | Facturación, Cobranza standalone y Punto de Venta no aparecen en el menú (regla: sin botones falsos) | Fases C/E del roadmap |
| Vulnerabilidad conocida en `xlsx@0.18.5` | Dependencia legacy de exportación | Sustituir en hardening |
| Preview de Vercel no accesible desde este entorno | Protección de deployment + proxy de red del contenedor; smoke se hace vía checks de GitHub y E2E local del mismo build | Acceso del equipo Vercel o bypass token |

## Criterio de "listo"

El release v0.2.0 se declara **productivo para lectura/demo del dominio DELAR y operación legacy existente**, con las mutaciones del dominio nuevo en modo demo. No se declara ERP completo: los módulos §10 restantes están mapeados en `IMPLEMENTATION_ROADMAP.md`.
