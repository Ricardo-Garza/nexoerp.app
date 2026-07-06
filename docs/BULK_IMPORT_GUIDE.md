# Guia de importacion masiva

## Estado actual

Existe `ImportWizard` con descarga de plantilla, carga CSV/XLSX, automapeo, validacion, duplicados dentro del archivo, dry-run, confirmacion, escritura por tenant, historial y auditoria.

Plantillas actuales: clientes, productos, precios, inventario inicial, proveedores y empleados.

## Flujo obligatorio

1. Descargar plantilla.
2. Revisar guia de columnas.
3. Subir CSV/XLSX.
4. Detectar columnas.
5. Mapear columnas.
6. Validar tipos y obligatorios.
7. Detectar duplicados.
8. Vista previa/dry-run.
9. Confirmar.
10. Importar.
11. Registrar auditoria.
12. Mostrar resultado.
13. Descargar errores.
14. Permitir rollback cuando aplique.

## Brechas actuales

- No hay rollback.
- No consulta duplicados existentes en Firestore antes de confirmar.
- Faltan plantillas de contactos, almacenes, ubicaciones, lotes dedicados, ventas historicas, pedidos, remisiones, facturas, pagos, vacaciones, unidades, mantenimiento y formulas.
- No hay permisos granulares `import` por modulo.
- No hay vista de reconciliacion despues de importar.

## Reglas de seguridad

- Nunca hacer importaciones silenciosas.
- No mezclar tenants.
- Cada corrida debe guardar `tenantId`, archivo, actor, conteos, errores, duplicados y `correlationId`.
- Las importaciones de saldos, inventario y documentos confirmados deben generar movimientos/auditoria, no editar saldos directos.

