# Plan de rollback — Nexo ERP

## Alcance de riesgo de este release (v0.2.0)

- **Sin migraciones de base de datos**: el release no toca esquemas (dominio DELAR es in-memory; Firestore es schemaless y no se alteran colecciones existentes).
- **Sin cambios de datos**: los seeds son en memoria; `scripts/seed-firestore.ts` NO se ejecuta en deploy.
- **Cambios visuales/estructurales**: tema oscuro default, menú reorganizado, rutas nuevas; las rutas legacy siguen vivas (`/dashboard/calidad-datos` redirige a `/dashboard/configuracion`).

## Rollback de aplicación (minutos)

Opción A — Vercel (recomendada):
1. Vercel → proyecto → Deployments → deployment previo verde de `main`.
2. "Promote to Production" (instant rollback, sin rebuild).

Opción B — Git:
```bash
git revert -m 1 <merge_commit_sha>   # revierte el merge en main
git push origin main                  # Vercel redespliega automáticamente
```

## Verificación post-rollback

- `/login` carga y autentica.
- `/dashboard` renderiza con el menú anterior.
- Sin errores en consola ni en logs del deployment.

## Datos

No aplica en este release (sin migraciones). Cuando exista Supabase: toda migración llevará script de reversa + snapshot/backup previo documentado en `BACKUP_RESTORE` antes de aplicar en producción.
