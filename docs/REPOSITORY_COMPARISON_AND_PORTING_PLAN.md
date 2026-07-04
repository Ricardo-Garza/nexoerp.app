# Comparación de repositorios y plan de porteo

Fecha: 2026-07-03 · Oficial: `Ricardo-Garza/nexoerp.app` (main @ `a699ba6`) · Donante: `Ricardo-Garza/v0-flower-shop-erp-ricky` (rama `claude/nexo-erp-production-release` @ `c37e551`, preservada con PRs #1/#2 abiertos)

## Comparación técnica

| Aspecto | Oficial (nexoerp.app) | Donante (v0-flower-shop…) | Decisión |
| --- | --- | --- | --- |
| Stack | Next 16.0.10 / React 19.2 / Firebase 11 / Tailwind 4 | idéntico | conservar |
| Package manager | **npm** (package-lock vigente; pnpm-lock obsoleto sin fullcalendar) | pnpm | npm; eliminar pnpm-lock.yaml obsoleto (causa documentada: desincronizado, rompe `pnpm install --frozen-lockfile` y la detección de Vercel) |
| Módulos | MÁS completos: + Facturación, Punto de Venta, Admin, Settings, Calendar, BI x2, órdenes de venta rediseñadas | menos módulos; mismos legacy | conservar oficial |
| firestore.rules | ✅ versionadas con scoping por companyId | ❌ no versionadas | conservar oficial (cierra la brecha D2 del donante) |
| Dominio food-service (catálogo/precios/lotes/FEFO/RBAC/auditoría) | ❌ no existe | ✅ `lib/domain/**` puro + tests | **portar** |
| Módulos DELAR UI (Catálogo, Listas, Inventario por Lote, Configuración) | ❌ | ✅ | **portar** (DELAR = tenant/blueprint demo, no la identidad de la plataforma) |
| Integración CRM Momentum | ❌ | ✅ puerto+adaptadores+contratos | **portar** |
| Modo demo sin credenciales / build sin secretos | ❌ (init eager) | ✅ | **portar** |
| Tema | claro genérico v0 | ✅ navy/cian §5 con toggle | **portar** |
| Menú | 21 items planos con módulos auxiliares mezclados | ✅ menú objetivo §6 agrupado | **portar adaptado** (incluye Facturación y Punto de Venta reales del oficial) |
| Tests | ❌ ninguno | ✅ 44 unit + 16 E2E + configs | **portar** |
| Contexto canónico `project-context/delar-erp/` | ❌ | ✅ (94/94 checksums) | **portar** (commit identificado) |
| Docs producción/ADR/auditoría | ❌ | ✅ 15+ docs | **portar y adaptar** |
| TypeScript | **426 errores** bajo `ignoreBuildErrors`, target ES6 | 41 tras saneo | sanear el oficial con las mismas correcciones sistémicas |
| lib/types.ts | 1716 líneas pero le FALTAN ≥10 interfaces que sus propios hooks importan (Warehouse, StockMovement, ServiceTicket, Supplier…) y `SalesOrder` rediseñado convive con componentes de la era anterior (120 errores) | 1368 líneas con esas interfaces | **fusionar**: superset (interfaces faltantes del donante + campos opcionales era-anterior en SalesOrder; Firestore es schemaless) |
| ESLint | `eslint .` sin flat config (roto con ESLint 10) | ✅ flat config | **portar** |

## Matriz conservar / portar / refactorizar / descartar

- **Conservar del oficial**: todos sus módulos (incl. Facturación/POS/Admin/Settings/Calendar), firestore.rules, package-lock/npm, su modelo SalesOrder rediseñado (como forma canónica), contexts/.
- **Portar del donante**: `project-context/`, `lib/domain/**`, `lib/server/**`, `lib/config/**`, `lib/integrations/crm/**`, `lib/auth-demo.ts`, `components/delar/**`, rutas DELAR, `tests/**` + vitest/playwright configs, `eslint.config.mjs`, docs, `.env.example`, `scripts/generate-domain-seed.mjs`, paleta dark + ThemeProvider, menú §6, parches de saneo (firebase lazy, auth demo dispatch, aliases de hooks, form-dialog, tipos superset).
- **Refactorizar en oficial**: `lib/types.ts` (fusión superset), sidebar (menú objetivo con módulos reales del oficial), `tsconfig` target ES2020, `next.config.mjs` (eliminar `ignoreBuildErrors` al llegar a 0 errores).
- **Descartar**: `pnpm-lock.yaml` obsoleto del oficial; NADA del donante se sobrescribe encima de una implementación mejor del oficial (regla §1.9); los strings de floristería del donante ya no aplican (verificar oficial).
- **No mezclar historias Git**: el porteo es por copia controlada de archivos en commits limpios e identificados; sin merges entre remotos ni cherry-picks incompatibles.

## Riesgos

1. Divergencia de componentes compartidos (sales dialogs, hooks) → se portan parches, no archivos completos, verificando cada uno contra la versión oficial.
2. Superset de tipos puede ocultar inconsistencias reales de datos → documentado; los campos era-anterior quedan opcionales y comentados.
3. Vercel del proyecto oficial: verificar qué deployment sirve producción antes del merge.

## Pruebas requeridas post-porteo

Suite completa del donante (44 unit + E2E) + typecheck 0 + lint 0 + build sin secretos + smoke de rutas oficiales (ventas, facturación, POS) para confirmar no-regresión.
