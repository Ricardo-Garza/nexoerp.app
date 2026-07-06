# Centro de Importación masiva

Fecha: 2026-07-06. Ruta: `/dashboard/import`. Motor: `lib/import/engine.ts`.

## Flujo (usable por una persona no técnica)

1. **Elegir entidad** — clientes, productos, precios, inventario inicial,
   proveedores, empleados (`lib/import/templates.ts`).
2. **Descargar plantilla** — XLSX con hoja "Datos" (encabezados + ejemplo) y hoja
   "Guía de columnas" (nivel obligatoria/recomendada/opcional, tipo, ayuda).
3. **Subir archivo** — arrastrar y soltar o seleccionar; CSV o XLSX (`xlsx`).
4. **Mapeo automático** — se detectan columnas por nombre y alias; se puede
   remapear manualmente lo que no coincida.
5. **Validación + dry-run** — por tipo (número, correo, fecha, enum), nivel
   (obligatorias), duplicados por clave natural. Resumen: total / válidas /
   errores / duplicados. **Nada se guarda todavía.**
6. **Archivo de errores** — CSV descargable con fila, columna, valor y motivo.
7. **Confirmar e importar** — escribe las filas válidas a la colección del tenant
   (`bulkInsert`), con barra de progreso.
8. **Resultado + auditoría** — registra la corrida (`tenants/{id}/imports`) y un
   evento de auditoría (`import.commit`).

## Entidades incluidas

| Entidad | Colección | Clave de duplicados |
| --- | --- | --- |
| Clientes | `customers` | nombre, rfc |
| Productos | `products` | sku |
| Listas de precios | `priceEntries` | — |
| Inventario inicial | `inventoryStock` | — |
| Proveedores | `suppliers` | nombre, rfc |
| Empleados | `employees` | nombre |

Las plantillas son declarativas: agregar una entidad = agregar un objeto a
`IMPORT_TEMPLATES` (columnas, niveles, tipos, alias, ejemplo).

## Validación implementada

- **number**: acepta separadores de miles, rechaza no numéricos.
- **email**: patrón estándar.
- **date**: normaliza a `AAAA-MM-DD`.
- **enum**: valida contra la lista permitida (case-insensitive).
- **required**: rechaza vacíos en columnas obligatorias.
- **duplicados**: por clave natural, dentro del archivo y contra existentes.

## Persistencia

- **firebase**: `tenants/{tenantId}/{collection}` vía SDK.
- **demo**: `localStorage` (`nexo_data_{tenantId}_{collection}`) para validación E2E.

## Prueba E2E

`tests/e2e/nexo-control-plane.spec.ts` sube un CSV de clientes con una fila
inválida y verifica el dry-run (2 válidas, 1 error) y la confirmación (2 creados).
