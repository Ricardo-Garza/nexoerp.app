# Criterios UX ERP para Nexo

## Principio de producto

Cada elemento en pantalla debe reducir captura, evitar errores, mejorar trazabilidad, ayudar a auditar, mejorar busqueda/navegacion, conectar modulos, controlar permisos, administrar tenants o facilitar operacion diaria. Si no cumple uno de esos criterios, no se agrega.

## Shell y navegacion

- Mantener identidad dark/navy/cian profesional.
- Usar logo NEXO ERP multicolor como marca principal; icono simple solo favicon/avatar/fallback.
- Sidebar por areas operativas, filtrado por modulos activos y permisos efectivos.
- Header con tenant activo, estado de soporte/impersonacion, acciones contextuales y busqueda rapida.
- Evitar dashboards bonitos sin accion: cada KPI debe abrir lista filtrada o tarea concreta.

## Acciones contextuales

- Mostrar acciones por estado y permiso: nuevo, editar, guardar, cancelar, duplicar, imprimir, exportar, historial, documentos, movimientos, auditoria.
- Ocultar acciones sin permiso.
- Deshabilitar solo cuando el usuario debe entender por que no aplica.
- No dejar botones que solo digan "proximamente" dentro de flujos operativos.

## Formularios

- Capturar primero lo minimo para crear borrador valido.
- Resolver defaults por tenant, cliente, almacen, lista de precios y rol.
- Validar errores criticos antes de confirmar; permitir borradores cuando falten datos no criticos.
- Permitir crear relacionados sin salir cuando reduce captura: contacto, direccion, proveedor, lote inicial.
- Mostrar ayuda corta en tooltip o descripcion discreta, no bloques largos.

## Detalles de registro

Todo registro importante debe usar el patron:

- Resumen.
- Detalles.
- Documentos relacionados.
- Movimientos.
- Actividad / historial.
- Auditoria.
- Comentarios / notas.
- Archivos.

Las pestañas deben cargar datos relacionados bajo demanda para evitar queries pesadas.

## Tablas

- Busqueda global visible.
- Filtros rapidos para estados frecuentes.
- Opciones avanzadas agrupadas en menu.
- Variantes guardables por usuario y, despues, por rol.
- Exportacion solo si el usuario tiene permiso.
- Totales y conteos cuando aportan control operativo.

## Estados honestos

- Sandbox, mock, demo, produccion, prototipo y cliente activo deben distinguirse visualmente.
- Un estado vacio debe decir que dato falta y dar una accion real para capturarlo/importarlo.
- Integraciones no configuradas deben mostrarse como "no configuradas", no como fallas.

