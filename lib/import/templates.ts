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
      { key: "whatsapp", label: "WhatsApp", level: "optional", type: "string", example: "8181234567", aliases: ["wa"] },
      { key: "contacto", label: "Contacto", level: "optional", type: "string", example: "María López", aliases: ["contacto principal", "nombre contacto", "atencion"] },
      { key: "ciudad", label: "Ciudad", level: "optional", type: "string", example: "Monterrey", aliases: ["municipio", "localidad"] },
      { key: "estado", label: "Estado / región", level: "optional", type: "string", example: "Nuevo León", aliases: ["region", "entidad"] },
      { key: "industria", label: "Industria / giro", level: "optional", type: "string", example: "Minería", aliases: ["giro", "sector"] },
      { key: "limiteCredito", label: "Límite de crédito", level: "optional", type: "number", example: "50000", aliases: ["limite credito", "credito", "limite"] },
      { key: "diasCredito", label: "Días de crédito", level: "optional", type: "number", example: "30", aliases: ["dias credito", "plazo"] },
      { key: "estatus", label: "Estatus comercial", level: "optional", type: "enum", example: "activo", enumValues: ["activo", "inactivo", "prospecto"], aliases: ["status", "estado comercial", "situacion"] },
      { key: "origen", label: "Origen", level: "optional", type: "string", example: "Referencia", aliases: ["fuente", "canal origen"] },
      { key: "notas", label: "Notas", level: "optional", type: "string", example: "Cliente con convenio anual", aliases: ["comentarios", "observaciones"] },
    ],
  },
  {
    entity: "contactos",
    label: "Contactos",
    description: "Contactos por cliente o prospecto para el CRM.",
    collection: "contacts",
    fields: [
      { key: "nombre", label: "Nombre del contacto", level: "required", type: "string", example: "María López", unique: true, aliases: ["contacto", "nombre completo"] },
      { key: "cliente", label: "Cliente / Empresa", level: "recommended", type: "string", example: "Cliente ejemplo Minería", aliases: ["empresa", "razon social", "cuenta"] },
      { key: "puesto", label: "Puesto", level: "optional", type: "string", example: "Compras", aliases: ["cargo", "rol"] },
      { key: "email", label: "Correo", level: "recommended", type: "email", example: "compras@cliente.mx", aliases: ["correo", "mail"] },
      { key: "telefono", label: "Teléfono", level: "optional", type: "string", example: "8181234567", aliases: ["tel", "celular"] },
      { key: "whatsapp", label: "WhatsApp", level: "optional", type: "string", example: "8181234567", aliases: ["wa"] },
      { key: "notas", label: "Notas", level: "optional", type: "string", example: "Decide compras técnicas", aliases: ["comentarios", "observaciones"] },
    ],
  },
  {
    entity: "prospectos",
    label: "Prospectos",
    description: "Prospectos comerciales aún sin convertir en clientes.",
    collection: "prospects",
    fields: [
      { key: "nombre", label: "Nombre / Empresa", level: "required", type: "string", example: "Constructora del Norte", unique: true, aliases: ["prospecto", "empresa", "razon social"] },
      { key: "contacto", label: "Contacto", level: "optional", type: "string", example: "Ing. Ramírez", aliases: ["contacto principal", "atencion"] },
      { key: "email", label: "Correo", level: "recommended", type: "email", example: "contacto@prospecto.mx", aliases: ["correo", "mail"] },
      { key: "telefono", label: "Teléfono", level: "optional", type: "string", example: "8181234567", aliases: ["tel", "celular"] },
      { key: "ciudad", label: "Ciudad", level: "optional", type: "string", example: "Saltillo", aliases: ["municipio"] },
      { key: "estado", label: "Estado / región", level: "optional", type: "string", example: "Coahuila", aliases: ["region", "entidad"] },
      { key: "industria", label: "Industria / giro", level: "optional", type: "string", example: "Construcción", aliases: ["giro", "sector"] },
      { key: "interes", label: "Interés", level: "optional", type: "string", example: "Cable de media tensión", aliases: ["producto interes", "familia interes"] },
      { key: "origen", label: "Origen", level: "optional", type: "string", example: "Sitio web", aliases: ["fuente", "canal origen"] },
      { key: "notas", label: "Notas", level: "optional", type: "string", example: "Pidió lista de precios", aliases: ["comentarios", "observaciones"] },
    ],
  },
  {
    entity: "oportunidades",
    label: "Oportunidades CRM",
    description: "Oportunidades comerciales con etapa, monto y responsable.",
    collection: "opportunities",
    fields: [
      { key: "oportunidad", label: "Oportunidad / Folio", level: "required", type: "string", example: "OPP-SW-001", unique: true, aliases: ["folio", "id oportunidad", "clave"] },
      { key: "cliente", label: "Cliente / Prospecto", level: "required", type: "string", example: "Cliente ejemplo Minería", aliases: ["empresa", "cuenta", "prospecto"] },
      { key: "contacto", label: "Contacto", level: "optional", type: "string", example: "Compras", aliases: ["contacto principal"] },
      { key: "familiaInteres", label: "Familia de interés", level: "optional", type: "string", example: "Minería", aliases: ["familia interes", "familia"] },
      { key: "productoInteres", label: "Producto de interés", level: "optional", type: "string", example: "Cable tipo SHD-GC", aliases: ["producto interes", "producto"] },
      { key: "cantidadEstimada", label: "Cantidad estimada", level: "optional", type: "number", example: "1500", aliases: ["cantidad estimada", "cantidad"] },
      { key: "unidad", label: "Unidad", level: "optional", type: "string", example: "m", aliases: ["um", "unidad venta"] },
      { key: "montoEstimado", label: "Monto estimado", level: "optional", type: "number", example: "250000", aliases: ["monto estimado", "monto", "importe"] },
      { key: "etapa", label: "Etapa", level: "recommended", type: "string", example: "Nueva", aliases: ["fase", "estatus"] },
      { key: "probabilidad", label: "Probabilidad (%)", level: "optional", type: "number", example: "20", aliases: ["prob"] },
      { key: "fechaCierreEstimada", label: "Cierre estimado", level: "optional", type: "date", example: "2026-09-30", aliases: ["fecha cierre estimada", "fecha cierre", "cierre"] },
      { key: "responsable", label: "Responsable", level: "optional", type: "string", example: "ventas", aliases: ["vendedor", "ejecutivo"] },
      { key: "origen", label: "Origen", level: "optional", type: "string", example: "Demo", aliases: ["fuente"] },
      { key: "notas", label: "Notas", level: "optional", type: "string", example: "Cotización solicitada", aliases: ["comentarios", "observaciones"] },
    ],
  },
  {
    entity: "productos",
    label: "Productos",
    description: "Catálogo de productos / SKUs con ficha técnica, unidad y precio base.",
    collection: "products",
    fields: [
      { key: "sku", label: "SKU / Código", level: "required", type: "string", example: "SW-MV-XLPE-CU-1C", unique: true, aliases: ["codigo", "clave", "articulo"] },
      { key: "nombre", label: "Nombre", level: "required", type: "string", example: "XLPE 1 Conductor Cobre", aliases: ["producto", "descripcion corta"] },
      { key: "categoria", label: "Categoría / Familia", level: "recommended", type: "string", example: "Medio Voltaje", aliases: ["familia", "linea"] },
      { key: "subfamilia", label: "Subfamilia", level: "optional", type: "string", example: "XLPE", aliases: ["sublinea"] },
      { key: "descripcion", label: "Descripción comercial", level: "optional", type: "string", example: "Cable de media tensión para distribución.", aliases: ["descripcion comercial", "detalle"] },
      { key: "usoAplicacion", label: "Uso / Aplicación", level: "optional", type: "string", example: "Distribución eléctrica industrial.", aliases: ["uso aplicacion", "aplicacion", "uso"] },
      { key: "voltaje", label: "Voltaje", level: "optional", type: "string", example: "5/15/25/35 kV", aliases: ["tension"] },
      { key: "material", label: "Material", level: "optional", type: "string", example: "Cobre", aliases: ["conductor material"] },
      { key: "aislamiento", label: "Aislamiento", level: "optional", type: "string", example: "XLPE", aliases: [] },
      { key: "norma", label: "Norma", level: "optional", type: "string", example: "IEC / UL", aliases: ["normativa", "estandar"] },
      { key: "unidad", label: "Unidad de venta", level: "recommended", type: "string", example: "m", aliases: ["unidad venta", "um", "unidad medida"] },
      { key: "moneda", label: "Moneda", level: "optional", type: "string", example: "MXN", aliases: ["divisa"] },
      { key: "precio", label: "Precio base", level: "recommended", type: "number", example: "250.00", aliases: ["precio base", "precio venta", "pvp"] },
      { key: "precioMayoreo", label: "Precio mayoreo", level: "optional", type: "number", example: "230.00", aliases: ["precio mayoreo", "mayoreo"] },
      { key: "costo", label: "Costo estimado", level: "optional", type: "number", example: "180.00", aliases: ["costo estimado", "costo unitario"] },
      { key: "stockMinimo", label: "Stock mínimo", level: "optional", type: "number", example: "50", aliases: ["stock minimo", "minimo", "reorden"] },
      { key: "tiempoEntregaDias", label: "Tiempo de entrega (días)", level: "optional", type: "number", example: "15", aliases: ["tiempo entrega dias", "tiempo entrega", "lead time"] },
      { key: "proveedor", label: "Proveedor", level: "optional", type: "string", example: "Fabricante Norte", aliases: ["fabricante"] },
      { key: "imagenId", label: "Imagen (id)", level: "optional", type: "string", example: "SW-CAT-MEDIO-VOLTAJE", aliases: ["imagen id", "imagen"] },
      { key: "activo", label: "Activo", level: "optional", type: "boolean", example: "SI", aliases: ["habilitado", "vigente"] },
      { key: "notas", label: "Notas internas", level: "optional", type: "string", example: "Validar calibre con proveedor", aliases: ["comentarios", "observaciones"] },
    ],
  },
  {
    entity: "precios",
    label: "Listas de precios",
    description: "Precios por SKU y lista comercial (base, menudeo, mayoreo…).",
    collection: "priceEntries",
    fields: [
      { key: "sku", label: "SKU", level: "required", type: "string", example: "SW-MV-XLPE-CU-1C", aliases: ["codigo", "clave"] },
      { key: "lista", label: "Lista", level: "required", type: "string", example: "SOLEIL-BASE-2027", aliases: ["lista precio", "lista de precios", "tipo precio"] },
      { key: "canal", label: "Canal", level: "optional", type: "string", example: "General", aliases: ["segmento"] },
      { key: "moneda", label: "Moneda", level: "optional", type: "string", example: "MXN", aliases: ["divisa"] },
      { key: "precioUnitario", label: "Precio unitario", level: "required", type: "number", example: "255.50", aliases: ["precio unitario", "precio", "unitario"] },
      { key: "unidad", label: "Unidad", level: "optional", type: "string", example: "m", aliases: ["um", "unidad venta"] },
      { key: "precioMayoreo", label: "Precio mayoreo", level: "optional", type: "number", example: "230.00", aliases: ["precio mayoreo", "mayoreo"] },
      { key: "cantidadMinMayoreo", label: "Cantidad mínima mayoreo", level: "optional", type: "number", example: "500", aliases: ["cantidad min mayoreo", "minimo mayoreo"] },
      { key: "vigenciaDesde", label: "Vigente desde", level: "optional", type: "date", example: "2026-01-01", aliases: ["vigencia inicio", "desde", "inicio"] },
      { key: "vigenciaFin", label: "Vigente hasta", level: "optional", type: "date", example: "2026-12-31", aliases: ["vigencia fin", "hasta", "fin"] },
      { key: "activo", label: "Activo", level: "optional", type: "boolean", example: "SI", aliases: ["vigente"] },
      { key: "notas", label: "Notas", level: "optional", type: "string", example: "Precio sujeto a cotización", aliases: ["comentarios", "observaciones"] },
    ],
  },
  {
    entity: "inventario-inicial",
    label: "Inventario inicial",
    description: "Existencias iniciales por SKU, almacén y bobina/rollo/serie.",
    collection: "inventoryStock",
    fields: [
      { key: "sku", label: "SKU", level: "required", type: "string", example: "SW-MV-XLPE-CU-1C", aliases: ["codigo", "clave"] },
      { key: "almacen", label: "Almacén", level: "required", type: "string", example: "Principal", aliases: ["bodega", "warehouse"] },
      { key: "ubicacion", label: "Ubicación", level: "optional", type: "string", example: "A-01", aliases: ["rack", "posicion"] },
      { key: "cantidad", label: "Cantidad", level: "required", type: "number", example: "1200", aliases: ["cantidad disponible", "existencia", "stock", "qty"] },
      { key: "unidad", label: "Unidad", level: "optional", type: "string", example: "m", aliases: ["um", "unidad venta"] },
      { key: "lote", label: "Bobina / Lote / Serie", level: "optional", type: "string", example: "BOB-0001", aliases: ["lote serie", "bobina", "serie", "rollo", "batch"] },
      { key: "estado", label: "Estado", level: "optional", type: "string", example: "Disponible", aliases: ["situacion"] },
      { key: "fechaEntrada", label: "Fecha de entrada", level: "optional", type: "date", example: "2026-07-01", aliases: ["fecha entrada", "recepcion"] },
      { key: "caducidad", label: "Caducidad (si aplica)", level: "optional", type: "date", example: "2027-03-31", aliases: ["fecha caducidad", "expira", "vence", "expiry"] },
      { key: "proveedor", label: "Proveedor", level: "optional", type: "string", example: "Fabricante Norte", aliases: ["fabricante"] },
      { key: "costoUnitario", label: "Costo unitario", level: "optional", type: "number", example: "180.00", aliases: ["costo unitario", "costo"] },
      { key: "notas", label: "Notas", level: "optional", type: "string", example: "Inventario inicial", aliases: ["comentarios", "observaciones"] },
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
    entity: "movimientos-bancarios",
    label: "Movimientos bancarios",
    description: "Estado de cuenta: cargos, abonos y saldos para conciliación.",
    collection: "bankMovements",
    fields: [
      { key: "fecha", label: "Fecha", level: "required", type: "date", example: "2026-07-01", aliases: ["fecha operacion", "fecha movimiento"] },
      { key: "concepto", label: "Concepto", level: "required", type: "string", example: "Transferencia SPEI recibida", aliases: ["descripcion", "detalle"] },
      { key: "cargo", label: "Cargo", level: "optional", type: "number", example: "0.00", aliases: ["retiro", "egreso", "debito"] },
      { key: "abono", label: "Abono", level: "optional", type: "number", example: "15000.00", aliases: ["deposito", "ingreso", "credito"] },
      { key: "saldo", label: "Saldo", level: "optional", type: "number", example: "125000.00", aliases: ["balance"] },
      { key: "cuenta", label: "Cuenta", level: "optional", type: "string", example: "012-3456789", aliases: ["numero cuenta", "clabe"] },
      { key: "banco", label: "Banco", level: "optional", type: "string", example: "BBVA", aliases: ["institucion"] },
      { key: "referencia", label: "Referencia", level: "optional", type: "string", example: "REF-000123", aliases: ["folio", "rastreo"] },
      { key: "notas", label: "Notas", level: "optional", type: "string", example: "Pago de cliente", aliases: ["comentarios", "observaciones"] },
    ],
  },
  {
    entity: "catalogo-contable",
    label: "Catálogo contable",
    description: "Catálogo de cuentas para contabilidad (código, nombre, naturaleza).",
    collection: "chartOfAccounts",
    fields: [
      { key: "cuenta", label: "Cuenta (código)", level: "required", type: "string", example: "102-01", unique: true, aliases: ["codigo", "numero cuenta", "codigo agrupador"] },
      { key: "nombre", label: "Nombre de la cuenta", level: "required", type: "string", example: "Bancos nacionales", aliases: ["descripcion", "cuenta nombre"] },
      { key: "tipo", label: "Tipo", level: "recommended", type: "string", example: "Activo", aliases: ["clasificacion", "rubro"] },
      { key: "naturaleza", label: "Naturaleza", level: "optional", type: "enum", example: "deudora", enumValues: ["deudora", "acreedora"], aliases: [] },
      { key: "nivel", label: "Nivel", level: "optional", type: "number", example: "2", aliases: [] },
      { key: "cuentaPadre", label: "Cuenta padre", level: "optional", type: "string", example: "102", aliases: ["cuenta padre", "padre"] },
      { key: "notas", label: "Notas", level: "optional", type: "string", example: "Cuenta de bancos MXN", aliases: ["comentarios", "observaciones"] },
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
