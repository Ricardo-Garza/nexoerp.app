# Estrategia de pruebas

## Pirámide

1. **Unitarias (vitest)** — dominio puro: decimal fixed-point, conversiones UOM, resolución de precios y vigencias, regla mayorista configurable, derivación pieza/caja, FEFO, bloqueo por calidad/caducidad, ledger e idempotencia, proyección de stock, RBAC, seed idempotente (2 ejecuciones sin duplicar).
2. **Integración** — server actions con chequeo de permisos sobre el store sembrado.
3. **E2E (@playwright/test, Chromium preinstalado)** — app real compilada en modo demo (`NEXT_PUBLIC_AUTH_MODE=demo`): login, búsqueda "Ranch" con múltiples presentaciones, listas Menudeo/Mayoreo con aviso histórico, inventario por lote con FEFO, lote en cuarentena marcado no asignable, recepción de lote de prueba, responsive desktop/tablet, sin errores críticos de consola.
4. **Visual** — screenshots Playwright de rutas principales (desktop 1440×900, tablet 834×1112) revisadas antes de cerrar el ciclo; se adjuntan seleccionadas al PR.

## Datos de prueba

- Solo datos del seed canónico (`project-context/delar-erp/data/`) más lotes sintéticos `LOT-TEST-*`. Nunca datos personales ni producción.
- El modo demo jamás se activa cuando Firebase está configurado en el entorno de producción (ver SECURITY_MODEL).

## Comandos

```bash
pnpm test          # unitarias vitest
pnpm typecheck     # tsc --noEmit (código nuevo estricto)
pnpm lint          # eslint flat config
pnpm build         # build de producción (sin secretos)
pnpm test:e2e      # playwright (compila y levanta en modo demo)
```

## Puertas por ciclo

Un ciclo no se cierra sin: unitarias verdes, build verde local sin secretos, E2E verdes, screenshots revisadas y deploy preview Ready con smoke test.
