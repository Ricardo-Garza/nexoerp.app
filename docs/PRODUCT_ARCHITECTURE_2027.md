# Arquitectura de producto — Nexo ERP 2027

## Capas (visión §4)

1. **Nexo Control Plane** (portal operador): alta de tenants, blueprints, módulos/feature flags, planes, dominios, salud, migraciones, soporte con acceso temporal auditado. **Estado: diseño; no implementado.** Ver `docs/NEXO_CONTROL_PLANE.md`.
2. **Catálogo de blueprints** por industria (DELAR Foods = blueprint/tenant demo de referencia, no la identidad rígida de la plataforma).
3. **Universo privado por cliente**: `organizationId`/`tenant_id` obligatorio, RLS, branding, módulos, datos y auditoría aislados. Aislamiento hoy a nivel aplicación; RLS real pendiente de Supabase.
4. **Canales/versiones**: prototipo→demo→sandbox→staging→producción con feature flags y rollback.

## Estado real de este release

- **Plataforma madre Nexo ERP** con tenant inicial DELAR Foods (white-label por `lib/config/company.ts`).
- **Dominio food-service** puro y estricto (`lib/domain/`): catálogo/precios/lotes/FEFO/RBAC/auditoría, 57 SKUs seed.
- **Módulos oficiales** conservados: ventas, facturación, punto de venta, compras, inventario, almacén, producción, mantenimiento, soporte, contabilidad, nómina, BI.
- **CRM Momentum**: integración sandbox por puerto/adaptadores con contratos.
- **Calidad**: 0 errores TS (sin `ignoreBuildErrors`), lint 0 errores, 44 unitarias + 14 E2E verdes, build de producción verde.

## Pendiente (roadmap, no implementado — honestidad §21)

Control Plane, wizard de aprovisionamiento (§5), Import Center (§6), IA BYOK (§15), CFDI/PAC real, RLS Supabase. Documentados como diseño en `docs/` y en `KNOWN_GAPS.md`.
