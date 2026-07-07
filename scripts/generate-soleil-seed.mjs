/**
 * Genera lib/domain/soleilwire/soleil-seed.json desde project-context/soleilwire/data.
 *
 * Determinista: mismo CSV → mismo JSON. No inventa datos: campos vacíos quedan null.
 * Uso: npm run seed:soleil
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const DATA = join(ROOT, "project-context", "soleilwire", "data")
const OUT = join(ROOT, "lib", "domain", "soleilwire", "soleil-seed.json")

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ""
  let inQuotes = false
  const src = text.replace(/^﻿/, "")
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ",") {
      row.push(field)
      field = ""
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++
      row.push(field)
      field = ""
      if (row.length > 1 || row[0] !== "") rows.push(row)
      row = []
    } else {
      field += ch
    }
  }
  if (field !== "" || row.length) {
    row.push(field)
    if (row.length > 1 || row[0] !== "") rows.push(row)
  }
  const [header, ...body] = rows
  return body.map((cells) => Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""])))
}

const readCsv = (name) => parseCsv(readFileSync(join(DATA, name), "utf8"))
const clean = (v) => {
  const s = (v ?? "").trim()
  return s === "" ? null : s
}
const num = (v) => {
  const s = clean(v)
  if (s === null) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

const catalogRows = readCsv("Catalogo_Cables.csv")
const priceRows = readCsv("Lista_Precios.csv")
const clientRows = readCsv("Clientes_CRM.csv")
const oppRows = readCsv("Oportunidades_CRM.csv")
const invRows = readCsv("Inventario_Inicial.csv")
const manifestRows = readCsv("manifest_imagenes.csv")

const familiesOrder = []
const familyImages = new Map()
const products = catalogRows.map((r) => {
  const familia = clean(r.familia)
  if (familia && !familiesOrder.includes(familia)) familiesOrder.push(familia)
  const imagenId = clean(r.imagen_id)
  if (familia && imagenId && !familyImages.has(familia)) familyImages.set(familia, imagenId)
  return {
    sku: clean(r.sku),
    familia,
    subfamilia: clean(r.subfamilia),
    producto: clean(r.producto),
    descripcion: clean(r.descripcion),
    voltaje: clean(r.voltaje),
    conductores: num(r.conductores),
    material: clean(r.material),
    aislamiento: clean(r.aislamiento),
    chaquetaArmadura: clean(r.chaqueta_armadura),
    norma: clean(r.norma),
    usoAplicacion: clean(r.uso_aplicacion),
    unidadVenta: clean(r.unidad_venta) ?? "m",
    moneda: clean(r.moneda) ?? "MXN",
    precioBase: num(r.precio_base),
    precioMayoreo: num(r.precio_mayoreo),
    costoEstimado: num(r.costo_estimado),
    stockInicial: num(r.stock_inicial),
    stockMinimo: num(r.stock_minimo),
    tiempoEntregaDias: num(r.tiempo_entrega_dias),
    proveedor: clean(r.proveedor),
    imagenId,
    activo: (clean(r.activo) ?? "SI").toUpperCase() === "SI",
    notas: clean(r.notas),
  }
})

const familias = familiesOrder.map((nombre) => ({
  nombre,
  imagenId: familyImages.get(nombre) ?? null,
  productos: products.filter((p) => p.familia === nombre).length,
}))

const priceListIds = []
const preciosEntradas = priceRows.map((r) => {
  const lista = clean(r.lista_precio) ?? "SOLEIL-BASE-2027"
  if (!priceListIds.includes(lista)) priceListIds.push(lista)
  return {
    sku: clean(r.sku),
    lista,
    canal: clean(r.canal),
    moneda: clean(r.moneda) ?? "MXN",
    precioUnitario: num(r.precio_unitario),
    unidad: clean(r.unidad) ?? "m",
    precioMayoreo: num(r.precio_mayoreo),
    cantidadMinMayoreo: num(r.cantidad_min_mayoreo),
    vigenciaInicio: clean(r.vigencia_inicio),
    vigenciaFin: clean(r.vigencia_fin),
    activo: (clean(r.activo) ?? "SI").toUpperCase() === "SI",
    notas: clean(r.notas),
  }
})

const clientesDemo = clientRows.map((r) => ({
  tipo: clean(r.tipo),
  razonSocial: clean(r.razon_social),
  nombreComercial: clean(r.nombre_comercial),
  rfc: clean(r.rfc),
  contactoPrincipal: clean(r.contacto_principal),
  correo: clean(r.correo),
  telefono: clean(r.telefono),
  whatsapp: clean(r.whatsapp),
  ciudad: clean(r.ciudad),
  estado: clean(r.estado),
  industria: clean(r.industria),
  estatus: clean(r.estatus),
  limiteCredito: num(r.limite_credito),
  diasCredito: num(r.dias_credito),
  origen: clean(r.origen),
  notas: clean(r.notas),
}))

const oportunidadesDemo = oppRows.map((r) => ({
  oportunidad: clean(r.oportunidad),
  cliente: clean(r.cliente),
  contacto: clean(r.contacto),
  familiaInteres: clean(r.familia_interes),
  productoInteres: clean(r.producto_interes),
  cantidadEstimada: num(r.cantidad_estimada),
  unidad: clean(r.unidad),
  montoEstimado: num(r.monto_estimado),
  etapa: clean(r.etapa),
  probabilidad: num(r.probabilidad),
  fechaCierreEstimada: clean(r.fecha_cierre_estimada),
  responsable: clean(r.responsable),
  origen: clean(r.origen),
  notas: clean(r.notas),
}))

const inventarioInicial = invRows.map((r) => ({
  sku: clean(r.sku),
  almacen: clean(r.almacen) ?? "Principal",
  ubicacion: clean(r.ubicacion),
  loteSerie: clean(r.lote_serie),
  cantidadDisponible: num(r.cantidad_disponible),
  unidad: clean(r.unidad) ?? "m",
  estado: clean(r.estado) ?? "Disponible",
  fechaEntrada: clean(r.fecha_entrada),
  fechaCaducidad: clean(r.fecha_caducidad),
  proveedor: clean(r.proveedor),
  costoUnitario: num(r.costo_unitario),
  notas: clean(r.notas),
}))

const imagenesReferencia = manifestRows.map((r) => ({
  id: clean(r.id),
  file: clean(r.file),
  slug: clean(r.slug),
  descripcion: clean(r.descripcion),
}))

const seedJson = {
  empresa: "Soleil Wire",
  listaPrecios: {
    id: priceListIds[0] ?? "SOLEIL-BASE-2027",
    nombre: "Lista base Soleil Wire 2027",
    moneda: "MXN",
    estado: "pendiente_precios",
  },
  familias,
  productos: products,
  preciosEntradas,
  clientesDemo,
  oportunidadesDemo,
  inventarioInicial,
  imagenesReferencia,
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(seedJson, null, 2) + "\n", "utf8")

const conPrecio = products.filter((p) => p.precioBase !== null).length
console.log(
  `productos=${products.length} familias=${familias.length} precios_capturados=${conPrecio} entradas_precio=${preciosEntradas.length} clientes_demo=${clientesDemo.length}`,
)
console.log(`OUT=${OUT}`)
