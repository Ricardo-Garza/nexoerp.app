# Autenticación real, claims y aislamiento multiempresa

## Causa raíz del «Modo demostración» en Vercel

`lib/config/auth-mode.ts` decidía así: si `NEXT_PUBLIC_AUTH_MODE=demo` **o si faltaba alguna** de las variables
`NEXT_PUBLIC_FIREBASE_*`, el modo era `demo` (comentario original: «situación imposible en los deployments reales»).
El proyecto Vercel `nexoerp-app` es nuevo y **no tiene esas variables** (el `.env.local` local solo contiene
`VERCEL_OIDC_TOKEN`), así que el build caía en silencio a autenticación ficticia: mostraba el aviso de demostración y
solo aceptaba los usuarios demo, por lo que `operaciones@nexo.com` de Firebase era rechazado.

> No pude leer la configuración de ese proyecto en Vercel: el conector disponible en esta sesión está autenticado en
> otra cuenta/equipo (no ve `ricardoantoniogarza-2303s-projects`). La causa se confirma por el código y por el
> `.env.local`; falta que el propietario verifique las variables en Vercel (ver «Pasos del propietario»).

## Qué cambió

| Tema | Antes | Ahora |
|---|---|---|
| Modo | Caía a demo si faltaban variables | `firebase` · `demo` · `misconfigured`. Producción sin configuración ⇒ **error controlado en la pantalla de acceso**, nunca demo. |
| Demo | Activable con una variable, en cualquier entorno | Solo desarrollo local, o entorno aislado explícito (`NEXT_PUBLIC_AUTH_MODE=demo` **y** `NEXT_PUBLIC_DEMO_ISOLATED=true`); **jamás** con `VERCEL_ENV=production`. |
| Proyecto Firebase | Cualquiera | Debe ser `nexoerp-88c6e` (o `demo-*` de emulador). Otro ⇒ `misconfigured`. |
| Administrador global | Por correo `operaciones@nexo.com` en frontend **y en las reglas** | Solo por custom claim firmado `platformAdmin: true`. El correo no concede nada. |
| Empresa del usuario | `localStorage` + perfil editable | Claim `companyId`/`tenantId` (o perfil no editable por el usuario). Para quien no es plataforma, `localStorage` se ignora y se purga. |
| `/api/copilot/query` | Cookie demo / correo | ID token de Firebase **verificado en el servidor** (firma RS256 de Google, emisor, audiencia, vigencia, `auth_time`) + autorización por tenant. |
| Firestore Rules | Cualquier autenticado leía casi todo; el usuario podía auto-asignarse rol/empresa | Aislamiento por empresa, perfil sin escalamiento, auditoría de solo agregado (ver abajo). |
| Errores | Parcialmente en español, revelaban si la cuenta existe | Todos en español; credenciales incorrectas y «cuenta inexistente» producen el mismo mensaje; el reset no revela cuentas. |

Archivos principales: `lib/config/auth-mode.ts`, `lib/auth.ts`, `lib/auth-errors.ts`, `lib/firebase.ts`,
`contexts/auth-context.tsx`, `contexts/platform-context.tsx`, `lib/platform/platform-admin.ts`,
`lib/server/firebase-token.ts`, `lib/server/request-auth.ts`, `app/api/copilot/query/route.ts`,
`app/login/page.tsx`, `components/layout/tenant-indicator.tsx`, `firestore.rules`,
`scripts/platform-admin-claim.mjs`.

## Roles

- **Platform Admin**: claim `platformAdmin === true`. Administra todas las empresas (Control Plane, selector, soporte).
- **Platform Support**: claim `platformSupport === true`. Solo lectura de empresas y tickets.
- **Tenant Admin**: claims `companyId` + `tenantRole: "admin"`. Administra *solo* su empresa (apariencia, miembros).
- **Tenant User**: claims `companyId` (+ `tenantRole: "user"`). Opera datos de su empresa.

El cambio de empresa en el frontend (`setActiveTenant`) solo funciona para plataforma, **y no autoriza nada**: las reglas de
Firestore y el servidor revalidan con el token en cada operación.

## Asignar el claim de administrador (procedimiento seguro)

Requiere Firebase Admin SDK con una identidad autorizada **del propietario** (nunca en Git):

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\ruta\fuera-del-repo\service-account.json"   # o gcloud auth application-default login
# 1. Copia el UID de operaciones@nexo.com en Firebase Console > Authentication
npm run platform:claims -- show  --email operaciones@nexo.com --expected-uid <UID> --project nexoerp-88c6e
# 2. Ensayo (no escribe)
npm run platform:claims -- grant --email operaciones@nexo.com --expected-uid <UID> --project nexoerp-88c6e
# 3. Aplicar
npm run platform:claims -- grant --email operaciones@nexo.com --expected-uid <UID> --project nexoerp-88c6e --apply
```

Salvaguardas (probadas con el emulador): solo correos de la lista autorizada; `ventas@nexo.com` jamás; el UID real debe
coincidir con `--expected-uid`; no crea cuentas; ensayo por omisión; conserva otros claims; revoca los refresh tokens; deja
una entrada en `platform_audit`. **Después, la persona debe cerrar sesión y volver a entrar** (o el ID token se refresca
en ≤ 1 h). No existe ningún endpoint público para conceder claims. Revocar: `... -- revoke ... --apply`.
Claims de empresa: `... -- tenant --email <correo> --expected-uid <UID> --tenant org-soleilwire --role admin|user --apply`.

## Firestore Rules

Colecciones que dejaban leer a cualquier autenticado y quedaron aisladas por `companyId`/`userId`: `customers`, `products`,
`salesOrders`, `salesInvoices`, `accountsReceivable`, `inventoryStock` y **todas** las demás de negocio (se eliminó el
comodín `/{collection}/{document}`). `/users` ya no permite editar rol ni empresa a uno mismo; `/tenants` solo lo lee su empresa o
plataforma; `demo_requests` ya no la lee cualquier admin de empresa; `isPlatformAdmin()` ya no acepta el correo.

Pruebas con el emulador (`npm run test:rules`, 33 pruebas): sin sesión, empresa A/B, administrador de empresa, administrador de
plataforma, impostor con el correo `operaciones@nexo.com` sin claim, escalamiento por perfil, roles globales, consultas por
`companyId`/`userId`, cuentas unipersonales, tickets, y el procedimiento de claims. **Control negativo:** las mismas pruebas
contra las reglas anteriores fallan 18 de 24.

**NO se publicaron.** Antes de `firebase deploy --only firestore:rules` el propietario debe validar contra datos reales:
1. Los documentos legados necesitan `companyId` y/o `userId`; los que no tengan ninguno solo los verá plataforma.
2. Los usuarios existentes necesitan `companyId` en su perfil **o** el claim, o seguirán operando solo sobre lo que crearon.
3. El perfil de un usuario ya no es editable por él: la asignación de empresa/rol pasa a `platform:claims` o a un administrador.
4. Probar un ciclo con una cuenta de cada empresa en un proyecto de staging antes de producción.

Índices: el repo no tenía `firestore.indexes.json`; se agregó vacío (`indexes: []`). Las consultas actuales usan igualdad
(`companyId`, `userId`) y `orderBy` de un solo campo, que no requieren índices compuestos. Verifica en la consola si algún
módulo registra «The query requires an index».

## Servidor y copiloto

`POST /api/copilot/query` exige `Authorization: Bearer <ID token>` y valida: firma/emisor/audiencia/vigencia, `uid`,
`auth_time`, y que `tenantId` sea el del origen de datos **y** el principal sea plataforma o pertenezca a ese tenant por claim
firmado. El origen de datos es un **mock** simulado de Soleil Wire, sin conexión a Firestore: no puede exponer datos reales.
Límite conocido: sin Admin SDK no se consulta la revocación; un token robado vale hasta 1 h. Para revocación inmediata,
migrar la verificación a `firebase-admin` (`checkRevoked`) cuando se configure una cuenta de servicio en Vercel.
Las server actions del dominio legado siguen denegadas fuera del modo demo (deuda D4, sin cambios).

## Pasos del propietario (Vercel / Firebase)

Yo no tengo acceso a tu cuenta de Vercel ni credenciales de Firebase Admin; esto lo debes hacer tú:

1. **Vercel → `nexoerp-app` → Settings → Environment Variables** (Production **y** Preview), con los valores de Firebase Console
   (Project settings → Your apps → Web app), proyecto `nexoerp-88c6e`:
   `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`,
   `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`.
   **No** definas `NEXT_PUBLIC_AUTH_MODE` ni `NEXT_PUBLIC_DEMO_ISOLATED`. (`NEXT_PUBLIC_*` se incrustan al compilar: hay que
   redesplegar después de cambiarlas.)
2. **Firebase Console → Authentication → Sign-in method**: Email/Password habilitado. **Settings → Authorized domains**:
   `nexoerp-app.vercel.app` (y el dominio propio si lo hay); evita comodines o dominios temporales sin control.
3. Asigna el claim con `npm run platform:claims` (arriba) y vuelve a iniciar sesión.
4. Despliega un **Preview** y prueba: login real, ausencia del aviso de demostración, `/admin`, selector de empresas, Soleil Wire
   y Nexo Intelligence. Solo entonces promueve a producción.
5. Publica las reglas únicamente tras la validación descrita arriba.
6. (Opcional) `COPILOT_DEMO_DISABLED=true` apaga el copiloto de demostración en un entorno.

## Cómo se prueba

```bash
npm run typecheck && npm run lint && npm run test      # unitarias (incluye modo de auth y verificación de tokens)
npm run test:rules                                      # reglas + claims con emuladores de Firestore y Auth
npm run test:e2e:firebase                               # login real contra el emulador de Auth, sin modo demo
NEXT_PUBLIC_AUTH_MODE=demo NEXT_PUBLIC_DEMO_ISOLATED=true npm run build && npm run test:e2e   # suite demo aislada
```

Las contraseñas de las pruebas se generan al azar en memoria; no hay credenciales reales en fixtures, capturas ni logs.
