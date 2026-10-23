# Guía — conectar Nexo Intelligence a la API/BD real del cliente

> Estado: **no existe ninguna conexión real**. Solo hay un adaptador mock (`adapters/mock-soleil.ts`) y un esqueleto REST
> (`adapters/rest-adapter.ts`) sin endpoints, sin URL por omisión y que falla explícitamente (`not_configured`) si falta configuración.

## Contrato (`lib/copilot/adapters/types.ts`)

`DataSourceAdapter` expone repositorios **de solo lectura** (`list(ctx, { cursor, limit, from, to }) → { items, nextCursor }`):
`customers`, `products`, `sales{orders,quotes,opportunities}`, `receivables{invoices,payments,creditNotes}`,
`inventory{warehouses,movements}`, `purchases{suppliers,purchaseOrders}`, más `meta(ctx)` y `describe()`.
Los tipos de entidad están en `lib/copilot/types.ts` (monedas explícitas, `fx` por documento, unidades `m|rollo|pza`).
`AnalyticsQueryService` es el único consumidor: pagina, aplica límites y construye la vista analítica.

## Pasos de integración

1. **Mapear** las tablas/endpoints del cliente a los tipos (normalización: fechas ISO `YYYY-MM-DD`, moneda ISO, importes sin IVA en líneas, unidades, estados de pedido).
2. **Implementar** `DataSourceAdapter` (o configurar `createRestAdapter` con `collections: { customers: { path, schema }, … }`; cada `schema` es un zod que valida la respuesta antes de entrar al motor).
3. **Registrar** el servicio en la ruta (`getDemoService()` → servicio por tenant). La ruta debe resolver el tenant desde la **sesión**, nunca del cuerpo.
4. **Calibrar léxico** (`GENERIC_COMPANY_WORDS`, sinónimos de familias en `entities.ts`) y añadir frases reales al entrenamiento (`nlu/training.ts`); re-medir con `npm run copilot:eval`.
5. **Probar** con un banco de preguntas del cliente y un oráculo propio (`eval/oracle.ts`).

## Autenticación y permisos

- La API del cliente se llama **siempre desde el servidor** con un token de servicio o con el token del usuario (`getAccessToken(ctx)`); el navegador nunca ve credenciales ni la API.
- Autorización en dos niveles: (a) la ruta verifica sesión, tenant y rol/permiso del usuario (hoy: administrador de plataforma + tenant DEMO; hay que sustituirlo por RBAC real y Firebase Admin); (b) la API del cliente debe filtrar por usuario/tenant.
- Principio de mínimo privilegio: credencial de **solo lectura** sobre las vistas necesarias.

## Paginación, versionado, errores, tiempos

- Paginación por cursor; tamaño de página ≤ 1000 en el esqueleto REST (`DEFAULT_LIMITS.pageSize` 2000 en memoria).
- Versionado: incluir `/v1/` en las rutas del cliente y versionar los esquemas zod; cambios incompatibles ⇒ nuevo adaptador.
- Errores tipados `CopilotDataError { forbidden | timeout | too_large | not_configured | upstream }`; la ruta responde con mensajes genéricos (sin detalles internos): 403, 504, 413, 502.
- Timeout por petición (8 s) y por consulta (`timeoutMs`); tope de filas por colección (`maxRowsPerCollection` 100 000) ⇒ `too_large`.
- **Consultas costosas**: hoy el servicio carga colecciones completas y las cachea 60 s. Para bases grandes, empuja agregaciones al origen (endpoints de agregados por periodo/dimensión) en lugar de listar documentos.

## Multi-tenant y read-only

Cada repositorio recibe `TenantContext` y debe rechazar tenants distintos al del adaptador (ver pruebas). El chatbot no puede editar
clientes, emitir facturas, borrar registros ni generar pagos: el contrato no define escrituras, los barandales rechazan verbos
de escritura y el plan analítico es una estructura cerrada.

## Lista de verificación antes de producción

- [ ] Autenticación server-side real y RBAC por rol (no solo cookie demo).
- [ ] Credencial de solo lectura; secretos en variables de entorno del servidor, nunca en Git.
- [ ] Rate limit distribuido (el actual es en memoria por proceso).
- [ ] Registro de auditoría de consultas (usuario, pregunta, intención, tenant) sin datos personales innecesarios.
- [ ] Revisión de exportaciones CSV (solo exportan lo visible; neutralizan fórmulas).
- [ ] Pruebas con datos reales y banco de preguntas del cliente; umbral de aceptación acordado.
