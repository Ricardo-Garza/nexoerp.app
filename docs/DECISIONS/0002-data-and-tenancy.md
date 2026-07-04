# ADR 0002 — Datos y multitenencia

Fecha: 2026-07-03 · Estado: aceptada (con bloqueo externo registrado)

## Contexto

El contexto canónico fija PostgreSQL/Supabase con RLS como objetivo. Verificación read-only del MCP de Supabase: la cuenta tiene un único proyecto, `SenorFlores-Ecommerce` (producto distinto). Usarlo violaría aislamiento; crear un proyecto nuevo es un alta de servicio/gasto que el protocolo prohíbe sin autorización expresa.

## Decisión

1. **Tenencia en el modelo desde hoy**: toda entidad de dominio lleva `organizationId` obligatorio (organización semilla `org-delar`). Los helpers del store filtran por organización; la RLS de PostgreSQL replicará esta regla cuando exista el proyecto.
2. **Persistencia por puerto**: `DomainStore` (interfaz) + `InMemoryStore` (adaptador actual, sembrado idempotente). El adaptador Supabase se implementará con migraciones versionadas derivadas de `project-context/delar-erp/database/000_domain_blueprint.sql`.
3. **No se toca el proyecto Supabase existente** ni se crea uno nuevo sin autorización del propietario. **Decisión pendiente del usuario**: autorizar la creación del proyecto Supabase DELAR (plan/costo) o indicar uno existente.
4. Ledger de inventario y auditoría se diseñan append-only desde el dominio para que la migración a SQL preserve semántica (insert-only, reversas compensatorias).
5. Los datos de precios 2025 se marcan `historical_requires_validation` y las discrepancias viven en `data_quality_issues.csv`; no se muestran como vigentes.

## Consecuencias

- En previews serverless el estado in-memory es efímero por invocación (solo lectura práctica); persistencia durable llega con el adaptador Supabase/Firestore. Registrado en IMPLEMENTATION_STATUS como deuda visible.
