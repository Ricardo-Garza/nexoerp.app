# Prompt para una segunda revisión independiente

Audita críticamente la implementación de DELAR ERP sin asumir que el reporte del implementador es correcto. Lee `project-context/delar-erp/` y el diff completo. Ejecuta lint, typecheck, tests, build y pruebas de RLS. Busca IDOR, permisos solo de UI, floats monetarios, stock editable, carreras, falta de idempotencia, migraciones destructivas, exposición de service keys, estados inválidos y funcionalidades simuladas. Corrige defectos reproducibles, agrega regresiones y entrega evidencia concreta. No reescribas por preferencia estética.
