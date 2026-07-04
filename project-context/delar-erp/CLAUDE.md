# Reglas permanentes del proyecto DELAR ERP

## Misión

Construir un ERP food-service industrial, mantenible y auditable sobre el repositorio actual. El producto debe servir a distribución, punto de venta, comercio B2B, inventarios por lote, producción de condimentos, calidad, compras, finanzas operativas y automatización asistida por IA.

## Forma de trabajo obligatoria

1. Inspecciona antes de editar.
2. Conserva lo que esté correcto; refactoriza por capas, no mediante reescritura impulsiva.
3. Antes de cada fase, documenta alcance, riesgos, archivos afectados y criterios de aceptación.
4. Implementa vertical slices completos: UI + dominio + persistencia + permisos + auditoría + pruebas.
5. Ejecuta lint, typecheck, unit tests, integration tests y build en cada hito.
6. No declares éxito con mocks visuales, botones sin acción, datos hardcodeados o tablas sin políticas.
7. No introduzcas secretos al repositorio.
8. No ejecutes cambios destructivos en producción.
9. Cuando falte un dato de negocio, conviértelo en configuración o registra una decisión pendiente; no inventes cifras silenciosamente.
10. Mantén un `docs/IMPLEMENTATION_STATUS.md` actualizado con hecho, pendiente, riesgos y evidencia.

## Estándares técnicos

- TypeScript estricto; evitar `any` y casts no justificados.
- Validación de entrada en frontera con esquemas tipados.
- Separación explícita entre UI, aplicación, dominio e infraestructura.
- Server-side authorization en cada operación; ocultar botones no sustituye permisos.
- RLS en tablas multiempresa y sensibles.
- UUID/ULID para identificadores internos; folios de negocio separados y legibles.
- Timestamps UTC; conversión a `America/Monterrey` en presentación/reglas de calendario.
- Cantidades y dinero con precisión decimal configurable.
- Movimientos de inventario y asientos contables son append-only; reversas mediante movimientos compensatorios.
- Toda transición de estado debe validar precondiciones.
- Operaciones externas con idempotency keys, retry seguro y outbox/event log.
- Archivos en storage privado con URLs firmadas y metadatos de auditoría.
- Accesibilidad por teclado, foco visible, contraste y etiquetas.

## Definition of Done

Una función está terminada solo si:

- satisface el flujo y criterios de aceptación;
- respeta permisos y RLS;
- genera auditoría;
- maneja errores y estados vacíos;
- tiene pruebas pertinentes;
- no rompe build ni pruebas existentes;
- está documentada;
- funciona con datos reales sembrados, no solo con placeholders.

## Prohibiciones

- No copiar la interfaz de Odoo.
- No usar una tabla genérica JSON para todo el dominio.
- No calcular existencias a partir de campos manualmente editables.
- No permitir stock negativo salvo política explícita y permiso especial.
- No permitir vender lotes bloqueados, vencidos o no liberados.
- No acoplar CFDI a un PAC específico; usar adaptador.
- No exponer service-role keys al cliente.
- No afirmar cumplimiento fiscal, sanitario o contable sin validación profesional.
