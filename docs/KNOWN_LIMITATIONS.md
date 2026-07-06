# Limitaciones conocidas

Fecha: 2026-07-06.

## No declarar como completo todavia

- ERP empresarial completo.
- Aislamiento multi-tenant total.
- Auditoria campo-a-campo universal.
- CFDI/timbrado real.
- CRM Momentum production sync.
- IA BYOK con secretos server-side reales.
- BI predictivo.
- Importacion masiva con rollback.
- Permisos efectivos aplicados a todos los botones.

## Riesgos principales

- Colecciones raiz legacy con reglas amplias.
- CRUD generico no tenant-aware en `lib/firestore.ts`.
- Fallback de `companyId` a `uid` en Firebase real.
- Acciones futuras expuestas como toasts.
- Documentacion previa puede sonar mas completa que la realidad ejecutable.

## Validacion pendiente

- Login real con `operaciones@nexo.com` en Firebase.
- Admin con sesion real.
- Entrar a tenant real y crear/editar cliente persistiendo en Firestore.
- Importar archivo demo en tenant real.
- Crear producto, venta y ver auditoria real.
- Intento cross-tenant bloqueado por reglas desplegadas.
- CRM abre/regresa y sync production solo cuando endpoints reales esten configurados.

