# Matriz de roles y permisos

## Roles objetivo

- `platform_admin`
- `tenant_admin`
- `operaciones`
- `ventas`
- `facturacion`
- `almacen`
- `compras`
- `contabilidad`
- `rrhh`
- `mantenimiento`
- `solo_lectura`
- `auditor`

## Permisos por modulo

Cada modulo debe soportar:

- ver;
- crear;
- editar;
- eliminar/cancelar;
- aprobar;
- imprimir;
- exportar;
- importar;
- configurar;
- ver costos;
- ver margenes;
- ver auditoria;
- administrar usuarios.

## Estado actual

Existe RBAC de dominio en `lib/domain/rbac/roles.ts`, pero usa nombres orientados a DELAR (`sales_manager`, `warehouse_manager`, etc.) y no esta unido a Admin UI, Firestore Rules ni todos los botones.

## UI requerida

- `/admin/roles`: matriz modulo vs permiso.
- `/admin/users`: usuarios por tenant y plataforma.
- Plantillas de rol.
- Copiar rol.
- Probar como rol.
- Ver permisos efectivos.
- Explicar por que un usuario no puede hacer una accion.

## Regla de producto

Ocultar accion sin permiso. Si el usuario ve una accion bloqueada, debe haber una razon operativa clara: estado del documento, falta de aprobacion, lote bloqueado, credito excedido o permiso insuficiente.

