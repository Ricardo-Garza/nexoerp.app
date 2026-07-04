# Estado de implementación — DELAR Foods ERP

Actualizado: 2026-07-03 · Rama: `claude/nexo-erp-production-release`

## Hecho — Ciclo de producción (prompt production-final)

- [x] Restauración visual Nexo: tema oscuro navy/cian por defecto (`next-themes`, toggle en header), plataforma madre **Nexo ERP** con tenant DELAR Foods (white-label por env).
- [x] Menú objetivo §6: 4 grupos (Principales/Operaciones/Administración/Analítica), Centro de Soporte, Configuración hospeda calidad de datos + módulos auxiliares; Field Services/E-Procurement/Atributos fuera del menú principal; sin botones falsos.
- [x] CRM Momentum sandbox: repo real `Hainrixz/auto-crm` clonado y analizado; puerto `CrmSyncPort` + adaptadores mock/HTTP (endpoints reales) + sync con dedupe/idempotencia/outbox/dead-letter + 5 pruebas de contrato.
- [x] Deuda TS legacy: 153 → 41 errores (−73 %); bugs reales de runtime corregidos (API namespaced de Firestore en remisiones, alias addItem/updateItem/deleteItem inexistentes, Field sin "date").
- [x] Docs de producción: KNOWN_GAPS, PRODUCTION_RUNBOOK, ROLLBACK_PLAN, MULTITENANCY_ARCHITECTURE, IMPLEMENTATION_ROADMAP, CRM_MOMENTUM_INTEGRATION, PLUGIN_AND_SKILL_USAGE, `.env.example`.

## Hecho — Fase A + Fase B (primer vertical slice)

- [x] Contexto canónico instalado en `project-context/delar-erp/` (PR #1, checksums 94/94 OK) + conversiones MarkItDown.
- [x] Fase A: auditoría real (`CURRENT_STATE_AUDIT.md`) con comandos ejecutados y resultados.
- [x] ADRs 0001 (fundación) y 0002 (datos/tenencia, con bloqueo Supabase registrado).
- [x] Saneamiento: init Firebase perezoso → **build de producción verde sin secretos**; ESLint 10 flat config (0 errores); target TS ES2020; duplicados estructurales de `lib/types.ts` corregidos (168→153 errores legacy, 0 en código nuevo).
- [x] Rebranding configurable white-label (`lib/config/company.ts`, default `DELAR Foods ERP`); 0 referencias de floristería en la app.
- [x] Dominio puro `lib/domain/`: decimal fixed-point (BigInt escala 6), UOM y conversiones exactas, catálogo marca→familia→SKU/empaque (EAN/DUN, null sin inventar), precios con vigencia/canal/derivación caja + override, regla Mayoreo MXN 40,000 **configurable**, ledger append-only con idempotencia, proyección de stock, FEFO con bloqueo de lotes no utilizables, transiciones de calidad, RBAC 13 roles, auditoría con motivo y correlation ID.
- [x] Seed idempotente desde CSV canónicos: 7 marcas, 57 SKUs, 2 listas (112 precios históricos marcados), reglas comerciales parametrizadas, 7 issues de calidad de datos; lotes demo sintéticos `LOT-TEST-*`.
- [x] Persistencia por puerto (`DomainStore`) con adaptador in-memory (ADR 0002); server actions con validación Zod + RBAC server-side (recepción de lote, cambio de calidad).
- [x] Modo demo acotado para dev/CI/E2E sin credenciales (`lib/config/auth-mode.ts`, 7 usuarios demo por rol).
- [x] UI: Catálogo (búsqueda/filtros/57 SKUs), Detalle de SKU (empaque, precios explicados, lotes FEFO), Listas de Precios (aviso histórico), Inventario por Lote (KPIs, recepción, liberación/rechazo con motivo), Calidad de Datos (matriz + reglas comerciales).
- [x] Pruebas: **39 unitarias vitest verdes** (decimal, UOM, precios, regla 40k, ledger, FEFO, calidad, RBAC, seed 2× sin duplicar) + **14 E2E Playwright verdes** en desktop/tablet (login demo, Ranch multi-presentación, listas históricas, cuarentena/vencido no asignables, recepción idempotente, segregación almacén/calidad, responsive sin overflow, consola limpia).

## Comandos y resultados (última corrida)

| Comando | Resultado |
| --- | --- |
| `pnpm test` | ✅ 44/44 (incluye 5 contratos CRM) |
| `pnpm lint` | ✅ 0 errores (warnings legacy documentados) |
| `pnpm typecheck` | ⚠ 41 errores, todos legacy en 20 archivos (era 153; ver KNOWN_GAPS); 0 en código nuevo |
| `pnpm build` | ✅ verde sin secretos |
| `pnpm test:e2e` | ✅ 14 passed, 2 skipped (mutaciones solo desktop) |

## Registro de herramientas externas (regla §2.6)

| Herramienta | Propósito | Resultado | Limitación | Siguiente acción |
| --- | --- | --- | --- | --- |
| GitHub MCP | PR #1, PR de implementación, checks | OK | — | mantener PRs en borrador |
| Supabase MCP | descubrimiento read-only | 1 proyecto ajeno (`SenorFlores-Ecommerce`) | crear proyecto = gasto → bloqueado | esperar autorización del usuario |
| Vercel MCP | identificar proyecto/deploys | parcial (`list_projects` falló); ids vía bot Vercel | teamId no resoluble por MCP | usar deployment status de GitHub |
| Vercel preview smoke | verificar preview del PR #2 | bloqueado: proxy de red 403 + `web_fetch_vercel_url` sin acceso al team | protección de deployment | evidencia alterna: status GitHub "Deployment has completed" (success) + E2E local sobre el mismo build |
| Playwright MCP | inspección visual | no conectado en sesión | — | `@playwright/test` local (Chromium preinstalado) |
| MarkItDown (CLI) | conversiones de contexto | 14 archivos OK | charset manual en 1 JSON | — |

## Deuda registrada

| # | Deuda | Severidad | Plan |
| --- | --- | --- | --- |
| D1 | 41 errores TS legacy restantes (de 168) bajo `ignoreBuildErrors` | media | reducir por capas; nuevo código estricto |
| D2 | Firestore Rules no versionadas (legacy client-side) | alta | versionar o migrar módulos |
| D3 | Persistencia in-memory efímera en serverless para dominio nuevo | alta | adaptador Supabase (bloqueado por ADR 0002) o Firestore |
| D4 | Sesión server-side verificable (hoy demo-mode para dev/E2E) | alta | Firebase Admin/cookies firmadas o Supabase Auth |
| D5 | `xlsx 0.18.5` vulnerabilidades conocidas | media | evaluar reemplazo en hardening |
| D6 | EAN/DUN faltantes en catálogo fuente | media | marcados `pending_validation`; validar contra etiqueta |
| D7 | Precios 2025 históricos sin lista vigente aprobada | alta (negocio) | flujo de aprobación de listas en Fase C |

## Decisiones pendientes del usuario

1. Autorizar creación de proyecto Supabase DELAR (o designar uno) — bloquea RLS real y persistencia durable del dominio nuevo.
2. Nombre comercial definitivo (hoy configurable, default plataforma `Nexo ERP` / tenant DELAR Foods).
3. Copiar los 3 videos a `project-context/delar-erp/reference/videos/` para análisis.
