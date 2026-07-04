# Integración CRM Momentum — sandbox

Fuente analizada: repositorio real `Hainrixz/auto-crm` (clonado y leído este ciclo; Next.js 16 + Drizzle + SQLite; app pública `https://crm-momentum.vercel.app/`).

## Modelo real verificado (src/db/schema.ts)

- `contacts`: name, email, phone, company, source, temperature (cold/warm/hot), score, notes.
- `pipeline_stages`: name, order, color, isWon/isLost.
- `deals`: title, value, stageId, contactId, expectedClose, probability, notes.
- `activities`: type, description, contactId, dealId?, scheduledAt, completedAt.
- API REST verificada: `GET/POST /api/contacts`, `PATCH /api/contacts/[id]`, `GET /api/deals`, `POST /api/activities`, `/api/pipeline`, `/api/webhook`.

## Arquitectura implementada (puertos/adaptadores)

```
lib/integrations/crm/
  types.ts         → tipos espejo del esquema real + ExternalIdMapping + CrmOutboxEvent
  port.ts          → CrmSyncPort (health, listContacts, createContact, updateContact, listDeals, recordActivity)
  mock-adapter.ts  → MockMomentumAdapter (sandbox default, datos sintéticos)
  http-adapter.ts  → HttpMomentumAdapter (endpoints reales; activo solo con MOMENTUM_BASE_URL)
  sync.ts          → pull contactos→borradores de cliente con dedupe (email→tel→nombre),
                     idempotencia por ID externo, outbox con reintentos y dead-letter
```

## Garantías (probadas en tests/unit/crm-sync.test.ts)

- Pull idempotente: contactos ya mapeados no se recrean (mapeo por `externalId`).
- Deduplicación por clave normalizada; conflictos quedan para revisión humana, sin auto-merge.
- Outbox: un evento `sent` no se reenvía; fallas reintentan hasta `maxAttempts` y pasan a `dead_letter` con el último error.
- Contrato HTTP: URLs y códigos de error verificados con fetch simulado.

## Activación real (pendiente de aprobación)

1. Configurar `MOMENTUM_BASE_URL` (server-side) hacia la instancia aprobada.
2. `resolveCrmAdapter()` cambia a HTTP automáticamente.
3. Ejecutar primero contra un entorno de staging del CRM; nunca contra datos reales sin aprobación del propietario.
4. Pendientes para producción: webhooks firmados de entrada, replay, fuente-de-verdad configurable por entidad, UI de conflictos.
