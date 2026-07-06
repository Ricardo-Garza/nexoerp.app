# Limitaciones conocidas después del rescate

Fecha: 2026-07-06. Registro honesto (§19): lo que quedó realmente listo y lo que
sigue pendiente. Nada aquí se presenta como terminado si solo es doc, mock, o no
se ve con usuario real.

## Listo y verificado en este ciclo

- Nexo Control Plane (`/admin`) operativo para `operaciones@nexo.com`.
- Persistencia multi-tenant real en Firestore (doble adaptador; demo en E2E).
- `firestore.rules` con aislamiento por tenant + rol de plataforma (versionadas).
- Centro de Importación con plantillas, mapeo, validación, dry-run, errores y auditoría.
- Tablas estilo SAP reutilizables (filtros, sumas, columnas, export, variantes, acciones masivas).
- CRM Momentum: config por tenant, abrir/regresar, sync sandbox con historial.
- Asistente flotante rule-based.
- Auditoría visible por registro + auditoría global.
- IA por cliente (BYOK) con clave server-side (estructura + UI).
- Seed idempotente `npm run seed:firebase` (REST, sin Admin SDK).
- 9 E2E autenticados + 8 E2E DELAR + 45 unitarias + build verde.

## Pendiente (honesto)

| Tema | Estado actual | Qué falta / desbloqueo |
| --- | --- | --- |
| Crear usuario Auth `operaciones@nexo.com` | Script listo; requiere contraseña por env | Ejecutar `SEED_ADMIN_PASSWORD=… npm run seed:firebase` en un entorno con acceso |
| Custom claim `platformAdmin` | Reconocido por email (allowlist) | Setear claim vía Admin SDK/consola para reforzar reglas |
| Mutaciones del dominio DELAR (recepción/calidad) en Firebase | Funcionan en demo; en producción exigen sesión server-side | Firebase Admin SDK o mover a la capa por tenant client-side |
| Sincronización CRM productiva | Sandbox real (mock con contrato) | `MOMENTUM_BASE_URL` + credenciales aprobadas |
| SSO/handoff embebido con CRM | Regreso a Nexo sí; iframe puede bloquearse | Config CORS/headers del CRM o SSO |
| Timbrado CFDI | `MockPacAdapter` | Contratar PAC + credenciales |
| IA: consumo, límites por usuario/módulo, logs, alertas | Config + kill switch listos | Integrar proveedor y medición server-side |
| Auditoría append-only estricta en reglas | Escritura permitida a miembros | Denegar `update`/`delete` de `auditEvents` en reglas |
| Pruebas de reglas con emulador | Prueba estructural versionada | Habilitar Firestore Emulator en CI |
| Migración de módulos legacy al modelo por tenant | Legacy sigue por `userId` | Migrar colección por colección (roadmap) |
| Índices Firestore compuestos | Se crean al primer uso | Versionar `firestore.indexes.json` |
| Vulnerabilidad `xlsx@0.18.5` | Dependencia de importación/exportación | Sustituir en hardening |

## Criterio de cierre de este ciclo

Se declara **listo para operar el Control Plane, la importación masiva, las
tablas profesionales, el CRM en sandbox, el asistente y la auditoría con usuario
real**, sobre Firebase real y con aislamiento por tenant. Las integraciones que
dependen de credenciales externas (PAC, CRM productivo, IA) quedan como
adaptadores claros y configuración lista, sin fingir que están productivas.
