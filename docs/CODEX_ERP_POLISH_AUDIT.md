# Auditoria ERP Polish - Nexo ERP

Fecha: 2026-07-06. Repo local: `C:\Users\rgarza\Documents\Proyectos\nexoerp.app`.

## Resumen ejecutivo

Nexo ERP ya no es una demo vacia: existe un shell Next.js, Firebase Auth, Firestore, Control Plane parcial, CRM Momentum sandbox, importacion masiva guiada, asistente flotante rule-based, tablas reutilizables y muchos modulos. Aun asi, todavia no puede declararse "ERP empresarial completo" porque conviven dos modelos de datos, los permisos son inconsistentes entre plataforma y modulos legacy, varias pantallas siguen siendo funcionalidad parcial, y hay acciones/claims de salud que la auditoria no puede probar como produccion real sin credenciales y sesion autenticada.

## Que existe

- Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind/shadcn, Firebase 11, Vitest y Playwright.
- Rutas reales: `/admin`, `/admin/tenants`, `/admin/modules`, `/admin/imports`, `/admin/audit`, `/admin/integrations`, `/admin/support`, `/admin/ai`, `/admin/releases`; no existen aun `/admin/roles`, `/admin/users`, `/admin/branding`, `/admin/documents`, `/admin/fiscal` como rutas separadas.
- Control Plane: lista tenants, crea tenant, configura modulos, branding basico, fiscal basico, CRM y auditoria por tenant.
- Identidad visual: login usa el SVG multicolor en `public/Logo Nexo ERP.svg`; `components/auth/logo.tsx` y sidebar siguen usando icono simple/generico.
- Persistencia Control Plane: `tenants/{tenantId}`, `tenants/{tenantId}/auditEvents`, `tenants/{tenantId}/imports`, `platform_support`.
- Persistencia legacy: muchas pantallas siguen usando colecciones raiz (`customers`, `products`, `salesOrders`, `notifications`, etc.) via `lib/firestore.ts` y hooks.
- Import Center: parse CSV/XLSX, descarga plantilla, automapeo, validacion, duplicados por clave natural, dry-run, confirmacion, auditoria e historial.
- Tabla profesional: `DataTablePro` tiene busqueda, filtros rapidos opcionales, ordenamiento, selector de columnas, densidad, export CSV/XLSX, seleccion y acciones masivas.
- CRM Momentum: pantalla, embed, adaptador mock, adaptador HTTP, tipos y prueba de contrato.
- Asistente: flotante global, rule-based sin API key, navegacion y ayuda contextual basica.
- RBAC dominio: `lib/domain/rbac/roles.ts` define permisos granulares, pero no esta conectado de forma uniforme a toda la UI ni a Firestore Rules legacy.
- Tests: unitarios de RBAC, seed, pricing, inventory, uom, crm-sync, firestore-rules; e2e para Control Plane/import/CRM/asistente.

## Que no existe o esta incompleto

- Rutas Admin pedidas y no implementadas como secciones propias: `/admin/roles`, `/admin/users`, `/admin/branding`, `/admin/documents`, `/admin/fiscal`.
- Matriz visual modulo vs permiso con plantillas de rol, copia de rol, permisos efectivos y probar como rol.
- Auditoria transversal campo-a-campo para todos los maestros/documentos. Hay auditoria administrativa y de importacion, no diff universal.
- Data model unico multi-tenant para todos los modulos. Los modulos legacy no leen/escriben bajo `tenants/{tenantId}/...`.
- Autorizacion server-side real para mutaciones operativas. La mayoria de operaciones cliente dependen de reglas Firestore y UI.
- Importacion masiva para todas las entidades pedidas: faltan contactos, almacenes, ubicaciones, lotes dedicados, ventas historicas, pedidos, remisiones, facturas, pagos, vacaciones, unidades, mantenimiento, formulas.
- Rollback de importaciones. El flujo registra corridas, pero no compensa/elimina filas importadas.
- Tablas ALV completas: faltan filtros avanzados persistidos, variantes compartidas por rol, reordenar/redimensionar columnas y agrupacion.
- Trazabilidad relacionada completa en cliente/producto/lote/venta/factura. Existen componentes puntuales, no un patron universal aplicado.
- CFDI real: debe seguir marcado como mock/adaptador hasta PAC configurado.
- BYOK seguro real: la UI indica llave server-side, pero no hay secret manager ni endpoints de prueba conectados.
- BI basado en datos reales con recomendaciones profundas. Hay pantallas, pero no motor analitico transversal auditable.

## Que esta roto o riesgoso

- `firestore.rules` tiene un bloque deny inicial, pero despues permite lectura autenticada en muchas colecciones raiz y un catch-all. Esto rompe el objetivo de aislamiento multi-tenant para legacy.
- `contexts/auth-context.tsx` aun hace fallback de `companyId` al `uid` si no encuentra perfil/claims. Eso puede crear universos vacios y ocultar errores de configuracion.
- `lib/firestore.ts` no recibe `tenantId`; CRUD generico opera en colecciones raiz y agrega `userId`, no `tenantId`.
- `components/auth/logo.tsx` no usa el logo multicolor correcto.
- `app/admin/page.tsx` muestra salud del sistema como OK de forma estatica; debe degradar segun verificaciones reales.
- `DataTablePro` usa localStorage para variantes; no hay persistencia por usuario/rol en Firestore.
- `ImportWizard` valida duplicados dentro del archivo, pero no consulta claves existentes en Firestore antes de confirmar.
- El repo local tiene `package-lock.json` modificado antes de esta auditoria.

## Botones/acciones a ocultar o etiquetar mejor

- Acciones que solo muestran `toast.message("Proximamente...")` deben ocultarse o deshabilitarse con tooltip honesto hasta existir flujo real.
- Modulos `planned` deben quedar visibles solo como roadmap/configuracion, no como operacion vendible.
- Salud del sistema debe mostrar "no verificado en esta sesion" cuando no se haya probado Firebase/produccion.
- Timbrado, IA BYOK, PAC y sync CRM production deben quedar como adaptadores/configuracion, no como promesas activas.

## Que se debe implementar primero

1. Unificar lectura/escritura operativa bajo `tenants/{tenantId}/...` o introducir una capa de repositorio tenant-aware que migre legacy por vertical slice.
2. Endurecer Firestore Rules: deny-by-default real para colecciones raiz o reglas con `companyId == userTenantId()`.
3. Corregir identidad visual en logo/sidebar/header/admin.
4. Crear matriz de roles y permisos real en `/admin/roles` y `/admin/users`.
5. Crear patron reutilizable de detalle ERP: resumen, detalles, relacionados, movimientos, actividad, auditoria, notas y archivos.
6. Aplicar ese patron primero a Clientes, Productos/Lotes y Ventas.
7. Completar importacion de entidades prioritarias y duplicados contra datos existentes.
8. Cambiar acciones falsas por acciones reales, deshabilitadas u ocultas.

## Que se debe posponer

- CFDI/PAC real hasta elegir proveedor y firmar requerimientos fiscales.
- Produccion avanzada con formulas reales hasta tener datos del negocio.
- BI predictivo y recomendaciones IA reales hasta tener datos suficientes y permisos cerrados.
- Sync CRM production bidireccional hasta confirmar endpoints y modelo real del repo `auto-crm`.
- Mantenimiento industrial avanzado; mantenerlo como unidades/equipos/mantenimientos/costos.

## Mejoras rapidas de alto impacto

- Reemplazar `components/auth/logo.tsx` y marca del sidebar por el SVG multicolor oficial.
- Crear `/admin/roles` con matriz inicial derivada de `ROLE_PERMISSIONS`.
- Hacer `DataTablePro` mostrar chips de filtros activos y boton limpiar.
- Agregar estado "mock/sandbox/no verificado" visible en CRM, Fiscal, IA e Integraciones.
- Corregir `auth-context` para usar tenant default explicito solo en demo, y en firebase mostrar error de perfil incompleto.
- Aplicar `DataTablePro` a auditoria e importaciones con filtros rapidos.

