# ADR 0001 — Fundación técnica

Fecha: 2026-07-03 · Estado: aceptada

## Contexto

El repo es un prototipo v0 (Next.js 16 + Firebase client-side) con 168 errores TS ocultos, lint roto, sin tests y build local imposible sin credenciales. El contexto DELAR exige dominio alimentario (lotes, FEFO, ledger, precios con vigencia) que el modelo actual no puede expresar.

## Decisión

1. **Conservar el stack** Next.js 16/React 19/Tailwind 4/shadcn y pnpm; no reescribir los módulos legacy en esta fase.
2. **Núcleo de dominio puro** en `lib/domain/` (TS estricto, sin framework), con tests unitarios; el resto del app se corrige incrementalmente.
3. **Puerto de persistencia** (`DomainStore`) con adaptador in-memory sembrado desde los CSV canónicos; adaptadores Firestore/Supabase son rebanadas futuras (ver ADR 0002).
4. **Init de Firebase perezoso** para que `pnpm build` funcione sin secretos; los módulos legacy solo tocan Firebase en runtime de cliente.
5. **ESLint flat config** nuevo; los errores TS legacy se registran como deuda y se reducen por capas (se corrigieron los estructurales de `lib/types.ts`); `ignoreBuildErrors` se mantiene temporalmente SOLO por la deuda legacy — el código nuevo compila estricto y hay typecheck en CI local.
6. **Vitest** para unitarias del dominio; **@playwright/test** para E2E (Chromium preinstalado; Playwright MCP no está conectado en esta sesión).
7. **Dinero/cantidades**: fixed-point decimal (BigInt escala 6) en el dominio nuevo.

## Consecuencias

- El valor de negocio (catálogo/precios/inventario DELAR) avanza sin esperar la migración de persistencia.
- Coexisten dos mundos (legacy Firestore client-side y dominio nuevo server-side) hasta completar la migración por rebanadas; el costo se acota con el puerto.
