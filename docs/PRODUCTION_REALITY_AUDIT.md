# Auditoría de Realidad de Producción — Nexo ERP

Fecha: 2026-07-06. Ciclo: rescate producción real (Firebase, Admin Ultra, CRM).
Método: evidencia directa (API de Vercel, bundle de producción, API REST de Firebase, código fuente), no suposiciones.

## Resumen ejecutivo

Producción **sí** apunta al commit correcto y **sí** corre con Firebase real. El problema no era el deployment:
el código fusionado en el ciclo anterior dejó el dominio nuevo (catálogo, precios, lotes) **solo en memoria** y
**bloqueó sus mutaciones fuera de modo demo**. Además no existía vista de administración de plataforma, ni
usuario maestro, ni aislamiento real por tenant en las reglas versionadas. Este documento registra la evidencia;
el resto del ciclo corrige cada punto.

## Evidencia por pregunta del diagnóstico

### 1. ¿Producción apunta al commit correcto? — SÍ ✅

Vía API de Vercel (proyecto `v0-erp-ricky-8`, team `lolazo2702-5937s-projects`):

- Deployment de producción activo: `dpl_6CkuXbS6rcx3wkZxM6qzQvY7HAv6`, estado `READY`, target `production`.
- Commit: `592949b9df7a17c60ab92b58bcc3cb5e388ff0bc` = HEAD de `main` (merge del PR #2).
- Dominios conectados al proyecto: `nexoerp.vercel.app` (+ aliases del proyecto). **El dominio está bien conectado.**

### 2. ¿El dominio `nexoerp.vercel.app` está en el proyecto Vercel correcto? — SÍ ✅

Confirmado en la respuesta de `get_project`: `domains: ["nexoerp.vercel.app", ...]` sobre el proyecto que
construye desde `Ricardo-Garza/nexoerp.app` rama `main`. No hay problema de cache ni de preview equivocado:
`x-vercel-cache: HIT` sirve el HTML del deployment de producción actual.

### 3. ¿Firebase usa el proyecto correcto? — SÍ ✅ (proyecto `nexoerp-88c6e`)

El bundle de producción (`/_next/static/chunks/894eddd1de49ba83.js`) contiene la configuración inyectada en build:

```text
projectId:        nexoerp-88c6e
authDomain:       nexoerp-88c6e.firebaseapp.com
storageBucket:    nexoerp-88c6e.firebasestorage.app
messagingSenderId: 665450486390
appId:            1:665450486390:web:c8fb97ee0ae60386ae9d57
```

Las 6 variables `NEXT_PUBLIC_FIREBASE_*` están configuradas en Vercel. Por lo tanto `getAuthMode()` en
producción devuelve `"firebase"`: **el login de producción es Firebase Auth real, no demo**. Los usuarios
demo (`admin@delarfoods.mx` / `demo`) NO funcionan en producción — solo cuentas reales de Firebase Auth.

### 4. ¿El sistema usa datos mock/in-memory en lugar de Firebase real? — SÍ, en el dominio nuevo ❌

- `lib/server/store.ts`: el dominio DELAR (catálogo, familias, SKUs, listas de precios, lotes, movimientos,
  auditoría) vive en un `Map` en memoria del proceso (`globalThis.__delarStore`), sembrado por seed.
- En Vercel serverless cada lambda tiene su propia memoria: los datos **se resetean en cada cold start** y
  no se comparten entre invocaciones. Nada de lo capturado persiste.
- Los módulos legacy (clientes, ventas, proveedores, inventario legacy…) sí usan Firestore client-side
  (`hooks/use-firestore.ts`) — esos sí persisten.

### 5. ¿Hay rutas protegidas que no se probaron con sesión real? — SÍ ❌

`tests/e2e/delar-foundation.spec.ts` corre únicamente contra `next start` local con `NEXT_PUBLIC_AUTH_MODE=demo`.
No existía ninguna prueba autenticada contra producción/Firebase real. El smoke de producción del ciclo
anterior validó `/login` (HTTP 200) — insuficiente, como señaló la dirección.

### 6. ¿Por qué "los cambios no se reflejan" dentro del sistema autenticado? — CAUSA RAÍZ ❌

`lib/server/session.ts` (cita literal del código fusionado):

```ts
export async function getSessionUser(): Promise<SessionUser | null> {
  if (getAuthMode() !== "demo") return null   // ← en producción SIEMPRE null
  ...
}
```

Consecuencia: **todas** las server actions del dominio nuevo (`receiveLotAction`, cambios de calidad, etc.)
responden `forbidden` en producción ("deuda D4" en `docs/KNOWN_GAPS.md`). Lo que el usuario final ve con
sesión real de Firebase: páginas nuevas con datos seed de solo lectura y botones de mutación que fallan.
Exactamente el síntoma reportado.

### 7. ¿El usuario `operaciones@nexo.com` existe y tiene rol correcto? — NO EXISTÍA ❌

- No aparece en `lib/config/demo-users.ts` ni en ningún seed del repo.
- Sondeo REST a Firebase Auth del proyecto `nexoerp-88c6e` (`accounts:signInWithPassword` con contraseña
  inválida) responde `INVALID_LOGIN_CREDENTIALS` y `createAuthUri` no reporta métodos: el proyecto tiene
  protección de enumeración activa; no había evidencia de la cuenta y ninguna parte del código le daba
  privilegios. **No existía el concepto de administrador de plataforma en el código.**
- Este ciclo lo crea: rol `platform_admin`, seed `npm run seed:firebase`, y Control Plane en `/admin`.

### 8. ¿Firestore tiene datos, roles, tenants, módulos y feature flags esperados? — NO ❌

No existía modelo de tenants (`tenants/{tenantId}/…`) ni colección `platform/…`. Solo colecciones raíz
legacy (`customers`, `products`, `salesOrders`…) particionadas por `companyId` a nivel aplicación.

### 9. ¿Las reglas de Firestore permiten/impiden lo necesario? — NO ❌

- `docs/KNOWN_GAPS.md` (ciclo anterior): "Firestore Rules no versionadas: la frontera de datos de los
  módulos legacy vive en la consola Firebase" — es decir, las reglas desplegadas eran desconocidas para el repo.
- El `firestore.rules` del repo permitía `allow read: if isAuthenticated()` en prácticamente todas las
  colecciones **más un catch-all final `match /{collection}/{document}`**: cualquier usuario autenticado
  podía leer datos de cualquier empresa. **Sin aislamiento por tenant.**
- Este ciclo reescribe las reglas con aislamiento por tenant + rol de plataforma y deja instrucciones de
  despliegue (`firebase deploy --only firestore:rules`).

### 10. ¿El usuario autenticado entra al tenant correcto? — FRÁGIL ❌

`contexts/auth-context.tsx` hacía fallback silencioso: si el perfil no tiene `companyId`, usa el `uid` como
`companyId`. Resultado: cada usuario sin perfil completo ve un universo vacío propio y "no ve los datos de
la empresa". Este ciclo lo corrige (fallback explícito a tenant por defecto + membresía en Firestore).

### 11. ¿Los botones fallan por falta de handler, permisos, datos o backend? — MEZCLA ❌

Auditoría de botones en §6 del prompt: los botones del dominio nuevo fallaban por el punto 6 (sesión server
nula); varios módulos legacy tienen botones sin handler o con datos mock. El inventario botón-por-botón y su
clasificación (funcional / deshabilitado con aviso / oculto) queda en `docs/REAL_USER_ACCEPTANCE_TESTS.md`
y los cambios de este ciclo.

### 12. ¿CRM Momentum está solo linkeado o realmente integrado? — NI SIQUIERA LINKEADO ❌

Existía el puerto + adaptadores (`lib/integrations/crm/*`: mock y HTTP contra auto-crm) con pruebas de
contrato, pero **ninguna pantalla** lo usaba: sin configuración por tenant, sin botón para abrir el CRM,
sin regreso a Nexo, sin sincronización visible. Este ciclo agrega la integración completa (config por
tenant, apertura, regreso, sync sandbox con historial y errores).

### 13. ¿Hay código nuevo que solo vive en modo demo? — SÍ ❌

Todo el flujo de mutaciones del dominio DELAR (recepción de lotes, calidad) exigía modo demo. Ver punto 6.

### 14. ¿Errores en consola/red/permisos/variables? — Variables OK, permisos rotos ❌

Variables de entorno completas en Vercel (punto 3). Los errores del usuario final provienen de los puntos
6, 9 y 10 (mutaciones negadas, reglas sin aislamiento real, companyId frágil), no de configuración faltante.

### 15. ¿Lo reportado como "implementado" estaba disponible para el usuario final? — PARCIALMENTE ❌

Lo legacy sí; el dominio nuevo solo en lectura seed; Control Plane, importación masiva, CRM integrado,
asistente y auditoría visible NO existían. `KNOWN_GAPS.md` lo decía, pero el mensaje de release no lo
hizo suficientemente visible. Este ciclo corrige el fondo (funcionalidad) y la forma (validación autenticada).

## Decisiones de arquitectura de este ciclo (correcciones)

1. **Firestore como persistencia real por tenant** (`tenants/{tenantId}/…` + `platform/…`), modelo en
   `docs/FIREBASE_DATA_MODEL.md`. El acceso a datos de tenant se hace client-side con el SDK oficial y
   reglas estrictas (mismo patrón que los módulos legacy que ya funcionan en producción), eliminando la
   dependencia del Admin SDK para operar.
2. **Administrador de plataforma**: `operaciones@nexo.com` (lista en `lib/platform/platform-admin.ts` +
   documento `users/{uid}.platformRole == "platform_admin"`), con Control Plane en `/admin`.
3. **Aislamiento por tenant** en `firestore.rules` versionadas (+ pruebas y guía de despliegue).
4. **Seed idempotente** `npm run seed:firebase` (REST, sin Admin SDK): usuario maestro, tenant DELAR,
   módulos, datos ejemplo, config CRM sandbox.
5. **Validación**: Playwright autenticado local (modo demo = mismos componentes) **y** smoke autenticado
   contra producción con credenciales reales vía variables de entorno (nunca en el repo).

## Estado al cierre del ciclo

Ver `docs/KNOWN_LIMITATIONS_AFTER_FIX.md` para la lista honesta de lo que queda pendiente después de este rescate.
