# Seguridad de Firestore Rules — aislamiento por tenant

Fecha: 2026-07-06. Archivo: `firestore.rules` (versionado en el repo).

## Objetivo

- Aislar tenants: ningún usuario de un tenant lee/escribe datos de otro.
- Proteger la plataforma: solo `operaciones@nexo.com` (o `platformAdmin` claim)
  administra tenants y colecciones de plataforma.
- Validar roles y evitar escrituras peligrosas sin permisos.

## Funciones clave

```js
function isPlatformAdmin() {
  return isAuthenticated() && (
    request.auth.token.email == "operaciones@nexo.com" ||
    request.auth.token.platformAdmin == true
  );
}

function userTenantId() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companyId;
}

function belongsToTenant(tenantId) {
  return isPlatformAdmin() || (isAuthenticated() && userTenantId() == tenantId);
}
```

## Reglas de tenant (aislamiento real)

```js
match /tenants/{tenantId} {
  allow read: if belongsToTenant(tenantId) || isAuthenticated();
  allow create, update, delete: if isPlatformAdmin();

  match /{sub=**} {
    allow read: if belongsToTenant(tenantId);
    allow create, update, delete: if belongsToTenant(tenantId);
  }
}
```

- El documento raíz `tenants/{id}` es legible por cualquier autenticado (para
  poblar el selector de empresas), pero **solo escribible por plataforma**.
- **Todo** el subárbol de datos (`/{sub=**}`) exige `belongsToTenant`: un usuario
  del tenant A recibe *permission denied* al leer `tenants/B/customers`.

## Plataforma

```js
match /platform_support/{ticketId} {
  allow create: if isAuthenticated();      // cualquier tenant abre ticket
  allow read, update, delete: if isPlatformAdmin();
}
match /platform_meta/{docId} {
  allow read: if isAuthenticated();
  allow write: if isPlatformAdmin();
}
```

## Colecciones legacy

Las colecciones raíz existentes (`customers`, `products`, `salesOrders`, …)
conservan su regla de propiedad por `userId` para no romper los módulos actuales
mientras migran al modelo por tenant. El catch-all final sigue exigiendo
`resource.data.userId == request.auth.uid` para escrituras.

## Despliegue

Las reglas viven en el repo y se despliegan con Firebase CLI:

```bash
firebase deploy --only firestore:rules --project nexoerp-88c6e
```

> Antes de este ciclo las reglas productivas vivían solo en la consola Firebase
> (ver `docs/PRODUCTION_REALITY_AUDIT.md` §9). Ahora están versionadas.

## Pruebas de reglas

`tests/unit/firestore-rules.test.ts` valida estructuralmente que el archivo
contiene las cláusulas de aislamiento (aislamiento por tenant, admin de
plataforma, negación por defecto). Para pruebas de comportamiento completas se
recomienda el emulador de Firestore:

```bash
firebase emulators:exec --only firestore "vitest run tests/rules"
```

El emulador no está disponible en el entorno de CI actual; la prueba estructural
es la verificación versionada mientras se habilita el emulador (limitación
documentada en `docs/KNOWN_LIMITATIONS_AFTER_FIX.md`).
