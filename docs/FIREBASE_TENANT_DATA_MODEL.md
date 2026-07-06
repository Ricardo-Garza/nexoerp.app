# Modelo Firebase tenant-aware

## Estado actual

Hay dos modelos conviviendo:

- Nuevo Control Plane: `tenants/{tenantId}` y subcolecciones por tenant.
- Legacy ERP: colecciones raiz como `customers`, `products`, `salesOrders`, `notifications`, filtradas por `userId`/`companyId` desde UI o reglas parciales.

## Modelo objetivo

```text
tenants/{tenantId}
tenants/{tenantId}/users/{uid}
tenants/{tenantId}/roles/{roleId}
tenants/{tenantId}/customers/{id}
tenants/{tenantId}/contacts/{id}
tenants/{tenantId}/products/{id}
tenants/{tenantId}/lots/{id}
tenants/{tenantId}/warehouses/{id}
tenants/{tenantId}/locations/{id}
tenants/{tenantId}/inventoryMovements/{id}
tenants/{tenantId}/salesOrders/{id}
tenants/{tenantId}/deliveries/{id}
tenants/{tenantId}/invoices/{id}
tenants/{tenantId}/payments/{id}
tenants/{tenantId}/imports/{id}
tenants/{tenantId}/auditEvents/{id}
users/{uid}
platform_support/{ticketId}
platform_meta/{docId}
```

## Reglas

- Deny-by-default.
- Platform admin administra metadata y soporte, no bypass silencioso sin auditoria.
- Usuario de tenant solo lee/escribe su tenant.
- Exportar/importar/ver costos/ver auditoria requieren permisos.
- Colecciones raiz legacy deben cerrarse o migrarse con reglas estrictas.

## Accion tecnica prioritaria

Crear una capa `tenantRepository` usada por nuevos vertical slices y migrar modulo por modulo. No hacer una migracion masiva sin pruebas y rollback.

