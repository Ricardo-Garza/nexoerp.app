/**
 * Plantillas de importación masiva. Cada entidad declara sus columnas con nivel
 * (obligatoria/recomendada/opcional), tipo, ejemplo y alias para la detección
 * automática de encabezados. El motor (engine.ts) usa esto para generar la
 * plantilla, auto-mapear, validar y detectar duplicados.
 */

export type FieldLevel = "required" | "recommended" | "optional"
export type FieldType = "string" | "number" | "email" | "date" | "enum" | "boolean"

export interface FieldDef {
  key: string
  label: string
  level: FieldLevel
  type: FieldType
  example: string
  help?: string
  enumValues?: string[]
  /** Nombres alternativos de encabezado para auto-detección (normalizados) */
  aliases?: string[]
  /** Si es clave natural para detectar duplicados */
  unique?: boolean
}

export interface EntityTemplate {
  entity: string
  label: string
  description: string
  /** Colección Firestore destino (por tenant) al confirmar la importación */
  collection: string
  fields: FieldDef[]
}

export const IMPORT_TEMPLATES: EntityTemplate[] = [
  {
    entity: "clientes",
    label: "Clientes",
    description: "Cartera de clientes con datos fiscales y de contacto.",
    collection: "customers",
    fields: [
      { key: "nombre", label: "Nombre / Razón social", level: "required", type: "string", example: "Restaurante El Fogón SA de CV", unique: true, aliases: ["cliente", "razon social", "nombre comercial", "empresa"] },
      { key: "rfc", label: "RFC", level: "recommended", type: "string", example: "FOG850101AB1", unique: true, aliases: ["rfc"] },
      { key: "email", label: "Correo", level: "recommended", type: "email", example: "compras@elfogon.mx", aliases: ["correo", "e-mail", "mail"] },
      { key: "telefono", label: "Teléfono", level: "optional", type: "string", example: "8181234567", aliases: ["tel", "celular", "movil"] },
      { key: "contacto", label: "Contacto", level: "optional", type: "string", example: "María López", aliases: ["nombre contacto", "atencion"] },
      { key: "limiteCredito", label: "Límite de crédito", level: "optional", type: "number", example: "50000", aliases: ["credito", "limite"] },
      { key: "estado", label: "Estado", level: "optional", type: "enum", example: "activo", enumValues: ["activo", "inactivo", "prospecto"], aliases: ["status"] },
    ],
  },
  {
    entity: "productos",
    label: "Productos",
    description: "Catálogo de productos / SKUs con unidad y precio base.",
    collection: "products",
    fields: [
      { key: "sku", label: "SKU / Código", level: "required", type: "string", example: "CC-RANCH-3.4KG", unique: true, aliases: ["codigo", "clave", "articulo"] },
      { key: "nombre", label: "Nombre", level: "required", type: "string", example: "Aderezo Ranch Galón 3.4 kg", aliases: ["descripcion", "producto"] },
      { key: "categoria", label: "Categoría", level: "recommended", type: "string", example: "Aderezos", aliases: ["familia", "linea"] },
      { key: "unidad", label: "Unidad", level: "recommended", type: "string", example: "Pieza", aliases: ["um", "unidad medida"] },
      { key: "precio", label: "Precio", level: "recommended", type: "number", example: "250.00", aliases: ["precio venta", "pvp"] },
      { key: "costo", label: "Costo", level: "optional", type: "number", example: "180.00", aliases: ["costo unitario"] },
      { key: "stockMinimo", label: "Stock mínimo", level: "optional", type: "number", example: "50", aliases: ["minimo", "reorden"] },
    ],
  },
  {
    entity: "precios",
    label: "Listas de precios",
    description: "Precios por SKU y lista comercial (menudeo/mayoreo).",
    collection: "priceEntries",
    fields: [
      { key: "sku", label: "SKU", level: "required", type: "string", example: "CC-RANCH-3.4KG", aliases: ["codigo", "clave"] },
      { key: "lista", label: "Lista", level: "required", type: "enum", example: "menudeo", enumValues: ["menudeo", "mayoreo"], aliases: ["canal", "tipo precio"] },
      { key: "precioUnitario", label: "Precio unitario", level: "required", type: "number", example: "255.50", aliases: ["precio", "unitario"] },
      { key: "vigenciaDesde", label: "Vigente desde", level: "optional", type: "date", example: "2026-01-01", aliases: ["desde", "inicio"] },
    ],
  },
  {
    entity: "inventario-inicial",
    label: "Inventario inicial",
    description: "Existencias iniciales por SKU, almacén y lote.",
    collection: "inventoryStock",
    fields: [
      { key: "sku", label: "SKU", level: "required", type: "string", example: "CC-RANCH-3.4KG", aliases: ["codigo", "clave"] },
      { key: "almacen", label: "Almacén", level: "required", type: "string", example: "Almacén Central", aliases: ["bodega", "warehouse"] },
      { key: "cantidad", label: "Cantidad", level: "required", type: "number", example: "120", aliases: ["existencia", "stock", "qty"] },
      { key: "lote", label: "Lote", level: "optional", type: "string", example: "L-2026-04", aliases: ["batch"] },
      { key: "caducidad", label: "Caducidad", level: "optional", type: "date", example: "2027-03-31", aliases: ["expira", "vence", "expiry"] },
    ],
  },
  {
    entity: "proveedores",
    label: "Proveedores",
    description: "Padrón de proveedores.",
    collection: "suppliers",
    fields: [
      { key: "nombre", label: "Nombre / Razón social", level: "required", type: "string", example: "Insumos del Norte SA", unique: true, aliases: ["proveedor", "razon social"] },
      { key: "rfc", label: "RFC", level: "recommended", type: "string", example: "IDN900101XY2", unique: true, aliases: ["rfc"] },
      { key: "email", label: "Correo", level: "optional", type: "email", example: "ventas@insumos.mx", aliases: ["correo", "mail"] },
      { key: "telefono", label: "Teléfono", level: "optional", type: "string", example: "8187654321", aliases: ["tel"] },
      { key: "diasCredito", label: "Días de crédito", level: "optional", type: "number", example: "30", aliases: ["credito"] },
    ],
  },
  {
    entity: "empleados",
    label: "Empleados",
    description: "Plantilla de personal para RRHH.",
    collection: "employees",
    fields: [
      { key: "nombre", label: "Nombre completo", level: "required", type: "string", example: "Juan Pérez García", unique: true, aliases: ["empleado", "colaborador"] },
      { key: "puesto", label: "Puesto", level: "recommended", type: "string", example: "Chofer", aliases: ["cargo"] },
      { key: "departamento", label: "Departamento", level: "optional", type: "string", example: "Logística", aliases: ["area"] },
      { key: "email", label: "Correo", level: "optional", type: "email", example: "juan.perez@delar.mx", aliases: ["correo", "mail"] },
      { key: "salarioDiario", label: "Salario diario", level: "optional", type: "number", example: "450.00", aliases: ["sueldo", "salario"] },
      { key: "fechaIngreso", label: "Fecha de ingreso", level: "optional", type: "date", example: "2024-05-01", aliases: ["ingreso", "alta"] },
    ],
  },
]

export function getTemplate(entity: string): EntityTemplate | undefined {
  return IMPORT_TEMPLATES.find((t) => t.entity === entity)
}

/** Normaliza un encabezado para comparación (minúsculas, sin acentos ni signos). */
export function normalizeHeader(h: string): string {
  return h
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}
