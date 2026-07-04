# Arquitectura objetivo — DELAR Foods ERP

## Principios (de `project-context/delar-erp/`)

- Monolito modular Next.js por dominios, no microservicios prematuros.
- Toda entidad operativa pertenece a una `organizationId`; preparado para multiempresa/white-label.
- Inventario = ledger append-only de movimientos; los saldos son proyecciones reconstruibles.
- Dinero y cantidades con precisión decimal (fixed-point), nunca float directo.
- Autorización server-side; la UI no es frontera de seguridad.
- Estados de documento explícitos con transiciones validadas.
- Auditoría append-only con actor, acción, entidad, razón y correlation ID.
- Idempotencia en operaciones críticas (idempotency keys + unique constraints).
- Puertos/adaptadores para persistencia, CFDI/PAC, correo, WhatsApp, bancos, IA.

## Capas

```
app/                    → rutas (App Router). Server components para lectura;
                          server actions para mutaciones con chequeo de permisos
components/             → UI por dominio + shadcn/ui
lib/config/             → configuración central de empresa (branding white-label),
                          modo de autenticación, flags
lib/domain/             → NÚCLEO: TypeScript puro, estricto, sin dependencias de
                          framework ni proveedor. Testeable al 100 %.
  shared/  (decimal fixed-point, ids, resultado/errores, audit)
  uom/     (unidades y conversiones exactas)
  catalog/ (marca, familia, producto, SKU, empaque EAN/DUN)
  pricing/ (listas con vigencia, resolución con explicación, regla mayoreo)
  inventory/ (almacén, ubicación, lote, ledger, proyección, FEFO, calidad)
  commercial/ (reglas de entrega/pickup/zonas parametrizadas)
  rbac/    (roles y permisos granulares)
  seed/    (seed idempotente desde project-context/delar-erp/data)
lib/server/             → adaptadores de persistencia detrás de un puerto
                          (in-memory hoy; Firestore/Supabase como adaptadores)
```

## Persistencia — estado y objetivo

- **Objetivo (contexto)**: PostgreSQL/Supabase con RLS real y migraciones versionadas. Bloqueado hoy: no existe proyecto Supabase de DELAR y crear uno es alta de servicio (ver `DECISIONS/0002`).
- **Puente actual**: puerto `DomainStore` con adaptador in-memory sembrado idempotentemente desde los CSV canónicos. El dominio no conoce al proveedor; migrar a Supabase será escribir el adaptador + migraciones desde `database/000_domain_blueprint.sql` sin tocar la lógica.
- Los módulos legacy (CRM, banking, etc.) siguen en Firestore client-side hasta su refactor por rebanadas.

## Identidad y autenticación

- Firebase Auth se conserva para el deployment real.
- **Modo demo** explícito (`NEXT_PUBLIC_AUTH_MODE=demo` o config Firebase ausente) para desarrollo local, CI y E2E sin credenciales: usuarios demo con roles del RBAC. Nunca sustituye al modo real cuando Firebase está configurado; ver `SECURITY_MODEL.md`.

## Módulos DELAR de esta fase (vertical slice)

1. Catálogo normalizado: marca → familia → SKU/presentación, empaques (EAN pieza/DUN caja, piezas por caja), tipo de abastecimiento, estado de validación de datos.
2. Listas de precios Menudeo/Mayoreo históricas con vigencia, derivación pieza↔caja y regla de mayoreo (MXN 40,000) como configuración.
3. Inventario por almacén/ubicación/lote: ledger inmutable, estados de calidad (pendiente/cuarentena/liberado/rechazado/bloqueado), caducidad, FEFO con bloqueo de lotes no vendibles, idempotencia.
4. RBAC granular (11 roles del contexto) + auditoría de eventos de dominio.
5. UI: rebranding configurable, catálogo con búsqueda/filtros, detalle de SKU, listas de precios, inventario por lote.

## Fases siguientes

- C: cotización→pedido, POS, reservas FEFO transaccionales, PDF/email por adaptador.
- D: compras/recepción/cuarentena, fórmulas versionadas, producción por lote, calidad/recall.
- E: finanzas AR/AP, CFDI por adaptador, conciliación.
- IA: copiloto con human-in-the-loop (pedido conversacional, document intelligence) sobre `AiProvider` desacoplado.
