# CRM Momentum — integración, embed y sincronización

Fecha: 2026-07-06. CRM: https://crm-momentum.vercel.app · repo https://github.com/Hainrixz/auto-crm

## Qué se implementó (no solo un link)

1. **Configuración por tenant** (Control Plane → detalle de empresa → pestaña
   CRM): habilitar/deshabilitar, URL base, modo sandbox/producción, fuente
   maestra (Nexo o CRM).
2. **Módulo CRM en el ERP** (`/dashboard/crm`): estado, modo, mapeo de entidades
   y sincronización sandbox.
3. **Abrir el CRM desde Nexo** — vista embebida (`/dashboard/crm/embed`) con
   barra superior y botón claro **"Regresar a Nexo"**; si el CRM bloquea el
   iframe (X-Frame-Options), ofrece abrir en pestaña nueva sin dejar al usuario
   atrapado.
4. **Sincronización sandbox** — corre contra `MockMomentumAdapter` (mismo
   contrato que el adaptador HTTP real de auto-crm) y registra historial con
   resumen (traídos / creados / duplicados).
5. **Mapeo de entidades** (`lib/integrations/crm/entity-mapping.ts`):
   clientes↔contacts, contactos↔contacts, prospectos↔leads,
   oportunidades↔deals, actividades↔activities, cotizaciones/pedidos↔deals.

## Arquitectura

- Puerto `CrmSyncPort` (`lib/integrations/crm/port.ts`) — el ERP no conoce al
  proveedor.
- Adaptadores: `MockMomentumAdapter` (sandbox, default) y `HttpMomentumAdapter`
  (endpoints reales de auto-crm; requiere `MOMENTUM_BASE_URL`).
- Dedupe / idempotencia / outbox / dead-letter definidos en `types.ts`.

## Estado honesto

- La sincronización productiva contra la instancia real de auto-crm requiere
  `MOMENTUM_BASE_URL` y credenciales aprobadas. Mientras tanto, el modo sandbox
  es real (adaptador mock con contrato verde) pero **no apunta a datos
  productivos** — así se declara en la UI (badge "sandbox").
- El SSO / handoff seguro embebido queda pendiente de credenciales del CRM; el
  regreso a Nexo sí funciona hoy.

## Pruebas

- Unitarias: `tests/unit/crm-sync.test.ts` (contratos del adaptador).
- E2E: `tests/e2e/nexo-control-plane.spec.ts` — config visible, sync sandbox,
  abrir embed y regresar a Nexo.
