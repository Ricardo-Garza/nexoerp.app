# Seguridad, auditoría y resiliencia

## Amenazas principales

- fuga entre organizaciones/sucursales;
- IDOR en documentos, archivos y folios;
- escalamiento de rol;
- modificación directa de precio/stock;
- duplicación por reintentos;
- carrera en reservas y POS;
- exposición de fórmulas/costos;
- archivos maliciosos;
- secretos en cliente/logs;
- acciones de IA sin autorización.

## Controles

- autorización backend y RLS;
- políticas deny-by-default;
- validación y normalización en frontera;
- CSP y protección XSS/CSRF acorde al framework;
- signed URLs y antivirus/validación de archivos cuando se incorpore upload externo;
- rate limits y protección de endpoints públicos;
- idempotency keys y unique constraints;
- transacciones y locking apropiado;
- audit log append-only;
- backups, PITR según plan y restore drills;
- ambientes separados dev/staging/prod;
- migrations con revisión y preview deployments.

## Audit event mínimo

- organization_id;
- actor/user/service;
- action;
- entity_type/entity_id;
- timestamp UTC;
- correlation_id/request_id;
- reason;
- before/after redactado o diff;
- source channel/device/IP/user-agent cuando aplique;
- approval reference;
- hash/metadata para archivos críticos.

## Retención y privacidad

Definir políticas formales antes de producción. Evitar almacenar datos innecesarios. Exportaciones y borrados de maestros deben respetar obligaciones fiscales y de auditoría; transacciones se anonimizan o restringen, no se eliminan arbitrariamente.
