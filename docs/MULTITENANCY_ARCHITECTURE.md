# Arquitectura multi-tenant — Nexo ERP

Estado: **diseño aprobado, implementación por fases** (bloqueo: proyecto Supabase, ADR 0002).

## Modelo

- Plataforma madre **Nexo ERP**; cada empresa (tenant) opera en su universo privado. Tenant inicial: DELAR Foods (`org-delar`).
- `organizationId` (≙ `tenant_id`) es obligatorio HOY en todas las entidades del dominio nuevo (`lib/domain/*`); los helpers del store filtran por organización y el acceso cruzado responde not-found sin filtrar existencia.
- White-label por configuración (`lib/config/company.ts`): nombre, tagline, branding por env vars; extensible a tabla `tenant_settings`.

## Capas de aislamiento (objetivo)

1. **Sesión confiable** → el tenant se deriva de la membresía del usuario autenticado, jamás de un parámetro del cliente.
2. **RLS PostgreSQL** deny-by-default: `USING (organization_id = auth.jwt() ->> 'org')` en toda tabla de negocio; políticas adicionales por permiso para fórmulas/costos/finanzas.
3. **Autorización server-side** (ya activa): RBAC de 13 roles en server actions.
4. **Storage segregado** por prefijo de tenant + URLs firmadas.
5. **Jobs/webhooks/exports** siempre parametrizados por tenant con idempotency keys.
6. **Pruebas negativas cross-tenant** en la suite (criterio 16 del contexto DELAR).

## Control Center Nexo (roadmap fase 7)

Consola para operadores de la plataforma: alta de tenants, branding, módulos/feature flags, planes, dominios, salud, versiones, migraciones, soporte y acceso privilegiado temporal con motivo/vencimiento auditado (impersonación registrada).

## Ruta de implementación

| Paso | Requisito | Entregable |
| --- | --- | --- |
| 1 | Autorización Supabase | Proyecto + migraciones desde `project-context/delar-erp/database/000_domain_blueprint.sql` |
| 2 | — | Adaptador `DomainStore` SQL (mismo puerto, sin tocar dominio) |
| 3 | — | RLS + tests negativos (usuario tenant B no lee/muta registros de A por ID) |
| 4 | — | Auth con claims de tenant (Supabase Auth o Firebase Admin + custom claims) |
| 5 | — | Migración de módulos legacy Firestore por rebanadas |
