# Migración y despliegue

## Estrategia de datos

1. Inventariar fuentes: prototipo, hojas, Odoo/ALPHA, PDFs, catálogos, POS y archivos contables.
2. Definir data dictionary y reglas de identidad.
3. Staging tables por fuente.
4. Normalización y detección de duplicados.
5. Validación de UOM/empaques, precios, lotes y saldos.
6. Dry run con reportes de discrepancias.
7. Cutover con ventana, snapshot y rollback.
8. Reconciliar stock, cartera, proveedores, clientes y documentos abiertos.

No migrar historial innecesario sin estrategia. Puede mantenerse archivo de consulta read-only.

## Entornos

- Local: datos sintéticos.
- Preview por PR: DB aislada o schema/branch cuando el proveedor lo permita.
- Staging: integración y UAT.
- Production: acceso restringido, backups y observabilidad.

## Vercel

- Conservar el proyecto actual solo después de identificar repo/team correctos.
- Preview deployments por PR.
- Variables por ambiente.
- Functions con límites conocidos; procesos largos van a jobs/background worker.
- Health/readiness endpoints sin datos sensibles.
- Rollback documentado.

## Supabase/PostgreSQL

- Migraciones en repo.
- RLS y tests.
- Storage privado.
- Backups/PITR según criticidad.
- Jobs programados con patrón idempotente.
- Nunca usar service role desde componentes cliente.

## Integraciones

Toda integración usa:

- adapter interface;
- credentials por ambiente;
- idempotency/external IDs;
- retries con backoff;
- dead-letter/reconciliation queue;
- webhooks firmados;
- logs redactados.
