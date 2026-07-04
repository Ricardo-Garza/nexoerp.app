# Modelo de seguridad

## Estado actual (heredado) y brechas

- Firebase Auth client-side; las Firestore Rules no están versionadas en el repo → la frontera real de datos legacy es inauditable desde código. **Brecha registrada.**
- Sin server actions/API previas: no había superficie server-side que endurecer; ahora que existe, toda mutación nueva pasa por chequeo de permisos en servidor.

## Controles introducidos en esta fase

1. **RBAC granular en dominio** (`lib/domain/rbac`): 11 roles del contexto, permisos como `price.margin.view`, `inventory.receive`, `lot.release`, `fefo.override`, `stock.adjust.approve`. Server actions validan permiso antes de mutar; la UI además oculta lo no permitido (defensa en profundidad, no frontera).
2. **Aislamiento por organización**: todas las lecturas/escrituras del store exigen `organizationId`; el acceso cruzado devuelve not-found (sin filtración de existencia).
3. **Auditoría append-only**: eventos con actor, rol, acción, entidad, razón, correlationId y timestamp UTC; sin datos sensibles en payload.
4. **Ledger inmutable**: los movimientos de inventario no se editan ni borran; reversas por movimiento compensatorio; idempotency key única por operación.
5. **Bloqueos de negocio**: lotes vencidos/cuarentena/rechazados/bloqueados no son asignables; override FEFO exige permiso + motivo y queda auditado.
6. **Modo demo acotado**: activo solo si `NEXT_PUBLIC_AUTH_MODE=demo` o si Firebase no está configurado (imposible en producción, donde las env vars existen). Usuarios demo sin contraseñas reales, documentados, sin datos personales. La sesión demo es una cookie de rol firmable en fase futura; hoy es solo para dev/CI/E2E y no protege datos reales (no hay datos reales en ese modo).
7. **Secretos**: cero secretos en repo; build local funciona sin ellos (init Firebase perezoso). Nunca se imprimen valores de env.
8. **Margen y costos**: visibles solo con `price.margin.view` (Dirección/Finanzas/Admin).

## Pendientes para producción (antes de piloto)

- RLS real en PostgreSQL/Supabase con tests negativos (bloqueado por ADR 0002).
- Versionar Firestore Rules mientras exista el legacy, o completar la migración.
- Sesión server-side verificable (cookies httpOnly firmadas / Firebase Admin) para autorizar server actions con identidad real, no solo rol demo.
- Rate limiting en endpoints sensibles, CSP, backups/restore documentados.
- Revisión de dependencias (`xlsx`) y Dependabot.
