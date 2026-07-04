# Runbook de producción — Nexo ERP

## Topología

- **App**: Next.js 16 en Vercel — proyecto `v0-flower-shop-erp-ricky` (team `team_VbWg3GzzgxGNEGlyVFZGsM6M`), producción sirve la rama `main` en `https://v0-flower-shop-erp-ricky.vercel.app/`.
- **Datos legacy**: Firebase (Auth + Firestore) vía `NEXT_PUBLIC_FIREBASE_*` configuradas en Vercel.
- **Dominio DELAR**: seed in-memory por invocación (lectura); mutaciones solo en modo demo local (ver KNOWN_GAPS).

## Despliegue

1. Merge a `main` → Vercel construye y publica automáticamente.
2. Verificar en GitHub el commit status `Vercel` = success.
3. Smoke manual: `/login` (branding Nexo, form visible), login real Firebase, `/dashboard/catalogo` (57 SKUs), `/dashboard/listas-precios` (aviso histórico), `/dashboard/inventario-lotes`, `/dashboard/configuracion`.
4. Consola del navegador sin errores críticos.

## Comandos de verificación local (sin secretos)

```bash
pnpm install --frozen-lockfile
pnpm test          # 44 unitarias
pnpm lint          # 0 errores
pnpm build         # verde sin env vars
pnpm test:e2e      # 14+ E2E (modo demo)
```

## Variables de entorno (nombres, nunca valores)

Ver `.env.example`. Producción requiere las 6 `NEXT_PUBLIC_FIREBASE_*`. Opcionales: `NEXT_PUBLIC_APP_NAME/SHORT_NAME/TAGLINE` (white-label), `NEXT_PUBLIC_AUTH_MODE=demo` (JAMÁS en producción), `MOMENTUM_BASE_URL` (CRM sandbox→real).

## Incidentes

| Síntoma | Diagnóstico | Acción |
| --- | --- | --- |
| 500/build rojo en Vercel | Ver logs de build del deployment | Rollback (abajo), corregir, redeploy |
| Login falla | Env vars Firebase ausentes/rotadas | Verificar nombres en Vercel → redeploy |
| Páginas DELAR vacías | Error del seed (JSON) | `pnpm test` reproduce; el seed es determinista |
| Datos legacy no cargan | Firestore rules/red | Consola Firebase → status |

## Monitoreo

- Vercel Analytics activo (`@vercel/analytics`).
- Checks de GitHub por commit (status `Vercel`).
- Pendiente (roadmap): logging estructurado + alertas.

## Rollback

Ver `docs/ROLLBACK_PLAN.md`.
