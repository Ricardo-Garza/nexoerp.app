# Auditoría visible por registro

Fecha: 2026-07-06. Componente: `components/audit/record-audit-sheet.tsx`.

## Qué muestra

Un panel lateral (Sheet) que se abre desde un botón "Historial" en cualquier
registro importante y muestra, estilo SAP:

- quién creó y quién modificó (actor + correo);
- qué cambió (antes → después, cuando el evento trae `before`/`after`);
- cuándo (fecha/hora local);
- desde dónde (origen: ui / import / integration / seed / system);
- la acción (`tenant.create`, `import.commit`, `tenant.modules.update`, …).

## Uso

```tsx
<RecordAuditSheet entityId={tenant.id} entityType="Tenant" />
```

Filtra los eventos de `tenants/{tenantId}/auditEvents` por `entityId` (o por
`entityType`) del tenant activo.

## Fuentes de eventos

Los eventos se generan automáticamente en:

- creación/edición de tenants y sus módulos/branding/fiscal/CRM (Control Plane);
- importaciones masivas (`import.commit`);
- seed inicial (`tenant.seed`).

El detalle de tenant (`/admin/tenants/:id`) incluye una pestaña "Auditoría"
embebida además del panel por registro. La auditoría global vive en
`/admin/audit`.

## Inmutabilidad

Los eventos se escriben con id único y no se editan. En Firestore, las reglas
del subárbol del tenant permiten `create` a miembros del tenant; una política de
solo-append más estricta (denegar `update`/`delete` de `auditEvents`) queda
recomendada para hardening (ver `docs/KNOWN_LIMITATIONS_AFTER_FIX.md`).
