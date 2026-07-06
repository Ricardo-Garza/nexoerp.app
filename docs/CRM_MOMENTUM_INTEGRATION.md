# Integracion CRM Momentum

## Estado actual

CRM Momentum esta configurado como integracion por tenant con URL base `https://crm-momentum.vercel.app`. El repo contiene:

- `lib/integrations/crm/types.ts`;
- `lib/integrations/crm/mock-adapter.ts`;
- `lib/integrations/crm/http-adapter.ts`;
- `lib/integrations/crm/sync.ts`;
- `lib/integrations/crm/entity-mapping.ts`;
- pantalla `/dashboard/crm`;
- embed `/dashboard/crm/embed`;
- configuracion en `/admin/tenants/:tenantId`.

## Lo que funciona

- Activacion por tenant.
- Modo sandbox.
- Sync mock visible.
- Historial local de sync.
- Apertura embebida y regreso a Nexo.

## Lo que no debe fingirse

- No hay evidencia de sync production probado contra `auto-crm`.
- No hay webhooks productivos.
- No hay resolucion de conflictos real.
- No hay secreto/API key server-side para CRM.

## Modelo objetivo

- Fuente maestra por entidad: Nexo o CRM.
- Mapeo de IDs externo/interno.
- Idempotency key por sync.
- Prevencion de duplicados por correo/RFC/telefono/externalId.
- Conflictos con diff y decision humana.
- Reintentos con backoff.
- Logs por tenant.
- Sandbox sin datos reales.

## Entidades

- clientes;
- contactos;
- prospectos;
- oportunidades;
- actividades;
- cotizaciones;
- pedidos;
- estatus comerciales.

