# Modelo de datos Firebase/Firestore — Nexo ERP multi-tenant

Fecha: 2026-07-06. Proyecto Firebase: `nexoerp-88c6e`.

## Principio: cada empresa es su propio universo aislado

Los datos de negocio viven bajo el documento del tenant. Ningún usuario de un
tenant puede leer los datos de otro (ver `docs/FIRESTORE_RULES_SECURITY.md`).

```text
tenants/{tenantId}                         ← metadatos del universo (branding, módulos, fiscal, crm, ai)
tenants/{tenantId}/customers/{id}          ← clientes del tenant
tenants/{tenantId}/products/{id}           ← productos / SKUs
tenants/{tenantId}/priceEntries/{id}       ← precios por lista
tenants/{tenantId}/inventoryStock/{id}     ← existencias
tenants/{tenantId}/suppliers/{id}          ← proveedores
tenants/{tenantId}/employees/{id}          ← empleados
tenants/{tenantId}/salesOrders/{id}        ← ventas
tenants/{tenantId}/invoices/{id}           ← facturas
tenants/{tenantId}/payments/{id}           ← pagos
tenants/{tenantId}/auditEvents/{id}        ← auditoría inmutable del tenant
tenants/{tenantId}/imports/{id}            ← corridas de importación

users/{uid}                                ← perfil: { email, name, role, platformRole?, companyId }
platform_support/{ticketId}                ← tickets de soporte hacia Nexo
platform_meta/{docId}                      ← releases, blueprints, índice global (solo plataforma)
```

## Documento `tenants/{tenantId}`

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `name` | string | Nombre comercial |
| `slug` | string | Identificador corto para URL |
| `status` | enum | `active` / `trial` / `suspended` / `prospect` |
| `version` | string | Versión del universo |
| `branding` | map | `{ logoText, primaryColor, theme }` |
| `modules` | array | `ModuleId[]` activos (ver `lib/platform/modules.ts`) |
| `fiscal` | map | `{ legalName, rfc, regime, address, pac }` |
| `crm` | map | `{ enabled, baseUrl, mode, masterSource, modules }` |
| `ai` | map | `{ enabled, provider, model, monthlyBudgetUsd, hasServerKey }` |
| `seededAt`,`createdAt`,`updatedAt` | timestamp | Metadatos |

## Perfil de usuario `users/{uid}`

| Campo | Descripción |
| --- | --- |
| `email` | Correo (fuente de verdad del rol de plataforma) |
| `role` | `admin` / `user` dentro de su tenant |
| `platformRole` | `platform_admin` / `platform_support` / ausente |
| `companyId` | Tenant al que pertenece (aísla su acceso) |

`operaciones@nexo.com` se reconoce como `platform_admin` por su email
(allowlist en `lib/platform/platform-admin.ts`) y, opcionalmente, por el campo
`platformRole` o el custom claim `platformAdmin`.

## Doble adaptador de persistencia

`lib/platform/tenant-store.ts` expone una sola API con dos adaptadores:

- **firebase** (producción/preview): Firestore real con el SDK client-side. Es
  el mismo patrón que ya persiste en producción para los módulos legacy, por lo
  que **no depende del Admin SDK**.
- **demo** (local/CI/E2E sin credenciales): `localStorage`. Permite validar toda
  la UI con Playwright sin tocar datos reales.

El seed (`ensureTenantsSeeded`, y `npm run seed:firebase`) es idempotente en
ambos modos: correrlo N veces deja el mismo estado (upsert por id determinista).

## Índices recomendados

Para las consultas ordenadas por fecha se requieren índices compuestos en
Firestore (se crean automáticamente al primer error de consulta, o vía
`firestore.indexes.json`):

- `tenants/{tenantId}/auditEvents` — `at desc`
- `tenants/{tenantId}/imports` — `at desc`
- `platform_support` — `at desc`
