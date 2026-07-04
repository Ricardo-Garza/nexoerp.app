# Auditoría del estado actual — 2026-07-03

Rama auditada: `claude/delar-erp-foundation-ab` (basada en `claude/delar-erp-context-setup-t9m0k1`, commit `9eecbcb`).

## Stack real verificado

| Aspecto | Evidencia |
| --- | --- |
| Framework | Next.js `16.0.10` (App Router, Turbopack), React `19.2.0` |
| Lenguaje | TypeScript 5, `strict: true` en `tsconfig.json` pero **`ignoreBuildErrors: true` en `next.config.mjs`** |
| Package manager | pnpm (existe `pnpm-lock.yaml`; instalación reproducible OK en 10.2 s) |
| UI | Tailwind CSS 4 + shadcn/ui (Radix), lucide-react, recharts, sonner |
| Datos | Firebase 11 (Firestore + Auth) **100 % client-side** — no existe `app/api/`, no hay server actions |
| Auth | Firebase Auth por email/contraseña (`lib/auth.ts`), guard client-side (`components/auth/auth-guard.tsx`), roles binarios `admin`/`user` guardados en colección `users` de Firestore |
| Storage | `lib/storage.ts` (Firebase Storage) |
| Analytics | `@vercel/analytics` |
| Despliegue | Vercel, proyecto `prj_1q96LSieG6hR0KsSjduyeTTOLag8` (team `team_VbWg3GzzgxGNEGlyVFZGsM6M`); deploys del PR #1 en Ready ⇒ las env vars de Firebase están configuradas en Vercel |

## Variables de entorno referenciadas (sin valores)

`NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` — todas en `lib/firebase.ts` y `scripts/seed-firestore.ts`. No hay `.env*` en el repo (correcto).

## Resultados de comandos base (evidencia real)

| Comando | Resultado |
| --- | --- |
| `pnpm install --frozen-lockfile` | ✅ OK (10.2 s, pnpm 10.33.0) |
| `pnpm lint` | ❌ **Roto**: ESLint 10 exige flat config (`eslint.config.js`) y no existe ninguno |
| `npx tsc --noEmit` | ❌ **168 errores TS** (duplicados de `estado` en `lib/types.ts`, `Timestamp` vs `Date`, casts inseguros en `lib/firestore.ts`, uniones de `Field` incompatibles) — ocultos por `ignoreBuildErrors` |
| `pnpm build` | ❌ **Falla local sin credenciales**: `lib/firebase.ts` inicializa `getAuth()` a nivel de módulo; el prerender de `/dashboard/payroll` lanza `auth/invalid-api-key`. En Vercel compila porque las env vars existen |
| Tests | ❌ **No existe ningún test ni runner** (sin vitest/jest/playwright) |

## Estructura funcional actual

- 22 rutas bajo `/dashboard/*`: banking, clients/CRM, ventas (+órdenes), suppliers, warehouse, accounting, production, maintenance, service, payroll, BI, e-commerce, e-procurement, attributes, field-services, inventory, orders, sales, reports.
- Módulos con persistencia Firestore real vía hooks (`hooks/use-*-data.ts`, `lib/firestore.ts` CRUD genérico): clients, ventas, banking, accounting, attributes, production, suppliers, field-services, etc.
- `scripts/seed-firestore.ts`: datos de ejemplo **de floristería** (SKU `ROSA-ROJA-001`, empresa "Nexo Florería S.A. de C.V.").

## Deuda y riesgos detectados

1. **Sin frontera de servidor**: toda autorización es client-side; las reglas de seguridad reales viven (o no) en Firestore Rules, que no están versionadas en el repo. IDOR/aislamiento no verificables desde el código.
2. **Modelo de inventario prohibido por el contexto**: `Product.stock` es un campo numérico editable (`lib/types.ts`); no hay ledger, ni lotes, ni caducidad, ni FEFO, ni estados de calidad.
3. **Sin multi-organización**: `companyId` opcional y sin enforcement.
4. **Precios**: campo único `price`; no hay listas, vigencias, canales ni reglas.
5. **Roles**: solo `admin`/`user`; sin permisos granulares ni segregación.
6. **Sin auditoría** append-only de ningún tipo.
7. **Branding**: "Nexo ERP" + descripción "para floristerías" en `app/layout.tsx`; referencias de floristería en 13 archivos (login logo, sidebar, seed, mocks de dashboard/inventario/ventas/reportes/proveedores).
8. **Build no reproducible sin secretos** (init eager de Firebase) — bloquea CI y desarrollo local.
9. **`ignoreBuildErrors: true`** esconde 168 errores de tipos.
10. **Dinero con `number`/float** en todos los modelos.
11. Dependencias: React 19/Next 16 recientes (OK); `xlsx 0.18.5` con vulnerabilidades conocidas históricas (evaluar reemplazo o actualización en ciclo de hardening).

## Relación repo ↔ deployment

- El repo despliega `https://v0-flower-shop-erp-ricky.vercel.app/` (título público "Nexo ERP - Sistema de Gestión") — coincide con `app/layout.tsx`. Confirmado que este repositorio es la fuente del deployment.

## Herramientas de sesión verificadas (regla de evidencia §2)

| Herramienta | Estado | Nota |
| --- | --- | --- |
| GitHub MCP | ✅ conectado | PR #1 leído/creado; checks consultados |
| Vercel MCP | ⚠️ parcial | `list_projects` falló con el teamId; ids del proyecto obtenidos del bot de Vercel |
| Supabase MCP | ✅ conectado (read-only) | Único proyecto existente: `SenorFlores-Ecommerce` (otro producto — **no usar**). Crear proyecto DELAR = alta de servicio ⇒ requiere autorización |
| Playwright MCP | ❌ no conectado | Se usa `@playwright/test` del proyecto con Chromium preinstalado (`/opt/pw-browsers`) |
| Skills | dataviz, verify, code-review, security-review disponibles | se usan según pertinencia |
