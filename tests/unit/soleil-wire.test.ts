import { describe, expect, it } from "vitest"
import { findSeedTenant, SEED_TENANTS } from "@/lib/platform/seed-tenants"
import { buildTenantMenu, moduleLabel, resolveTenantModules } from "@/lib/platform/menu"
import { ALL_MODULE_IDS, DISTRIBUTION_TENANT_MODULES, getModule } from "@/lib/platform/modules"
import { ASSIGNABLE_VERSIONS, LATEST_STABLE_VERSION, PLATFORM_RELEASES, isKnownVersion } from "@/lib/platform/versions"
import { DASHBOARD_INDICATOR_CATALOG } from "@/lib/platform/indicators"
import { resolvePlatformRole, canAccessControlPlane } from "@/lib/platform/platform-admin"
import { autoMap, validate } from "@/lib/import/engine"
import { getTemplate } from "@/lib/import/templates"
import { buildAssistantReply } from "@/lib/assistant/nexo-assistant"
import {
  buildSoleilIndicatorSummary,
  getSoleilClients,
  getSoleilFamilies,
  getSoleilOpportunities,
  getSoleilPriceEntries,
  getSoleilProducts,
  getSoleilSeed,
  SOLEIL_TENANT_ID,
} from "@/lib/domain/soleilwire"
import { buildStockPositions } from "@/lib/domain/soleilwire/client-data"

// Encabezados reales del paquete project-context/soleilwire/data
const CATALOG_HEADERS = [
  "sku", "familia", "subfamilia", "producto", "descripcion", "voltaje", "conductores", "material",
  "aislamiento", "chaqueta_armadura", "norma", "uso_aplicacion", "unidad_venta", "moneda", "precio_base",
  "precio_mayoreo", "costo_estimado", "stock_inicial", "stock_minimo", "tiempo_entrega_dias", "proveedor",
  "imagen_id", "activo", "notas",
]
const PRICE_HEADERS = [
  "sku", "lista_precio", "canal", "moneda", "precio_unitario", "unidad", "precio_mayoreo",
  "cantidad_min_mayoreo", "vigencia_inicio", "vigencia_fin", "activo", "notas",
]
const CLIENT_HEADERS = [
  "tipo", "razon_social", "nombre_comercial", "rfc", "contacto_principal", "correo", "telefono", "whatsapp",
  "ciudad", "estado", "industria", "estatus", "limite_credito", "dias_credito", "origen", "notas",
]
const OPportunity_HEADERS = [
  "oportunidad", "cliente", "contacto", "familia_interes", "producto_interes", "cantidad_estimada", "unidad",
  "monto_estimado", "etapa", "probabilidad", "fecha_cierre_estimada", "responsable", "origen", "notas",
]
const INVENTORY_HEADERS = [
  "sku", "almacen", "ubicacion", "lote_serie", "cantidad_disponible", "unidad", "estado", "fecha_entrada",
  "fecha_caducidad", "proveedor", "costo_unitario", "notas",
]

describe("Empresa Soleil Wire — configuración base", () => {
  const soleil = findSeedTenant(SOLEIL_TENANT_ID)

  it("existe como empresa sembrada, aislada de DELAR y Demo", () => {
    expect(soleil).toBeDefined()
    expect(SEED_TENANTS.map((t) => t.id)).toContain("org-delar")
    expect(SEED_TENANTS.map((t) => t.id)).toContain("org-soleilwire")
    expect(soleil?.name).toBe("Soleil Wire")
    expect(soleil?.slug).toBe("soleilwire")
    expect(soleil?.status).toBe("active")
  })

  it("usa la última versión estable con historial inicial", () => {
    expect(soleil?.version).toBe(LATEST_STABLE_VERSION)
    expect(soleil?.versionHistory?.length).toBeGreaterThan(0)
    expect(soleil?.versionHistory?.[0].version).toBe(LATEST_STABLE_VERSION)
    expect(soleil?.versionHistory?.[0].actorEmail).toBe("operaciones@nexo.com")
  })

  it("permite versiones distintas por empresa (DELAR no cambia)", () => {
    const delar = findSeedTenant("org-delar")
    expect(delar?.version).toBe("1.0.0")
    expect(delar?.version).not.toBe(soleil?.version)
    expect(isKnownVersion(LATEST_STABLE_VERSION)).toBe(true)
    expect(ASSIGNABLE_VERSIONS[0]).toBe(PLATFORM_RELEASES[0].version)
  })

  it("queda en español, tema oscuro y MXN", () => {
    expect(soleil?.ui?.preferences.language).toBe("es")
    expect(soleil?.ui?.preferences.theme).toBe("dark")
    expect(soleil?.ui?.preferences.currency).toBe("MXN")
    expect(soleil?.branding.theme).toBe("dark")
  })

  it("tiene contacto comercial y giro editable", () => {
    expect(soleil?.contact?.email).toBe("ventas@soleilwire.com")
    expect(soleil?.contact?.phone).toBe("81 1600 9380")
    expect(soleil?.contact?.state).toBe("Nuevo León")
    expect(soleil?.contact?.businessLine).toContain("cables")
    expect(soleil?.template).toBe("distribucion-cables")
  })

  it("activa módulos comerciales y apaga producción, nómina y mantenimiento", () => {
    const modules = soleil?.modules ?? []
    expect(modules).toContain("productsPricing")
    expect(modules).toContain("inventory")
    expect(modules).toContain("crm")
    expect(modules).toContain("imports")
    expect(modules).toContain("accounting")
    expect(modules).not.toContain("production")
    expect(modules).not.toContain("payroll")
    expect(modules).not.toContain("maintenance")
  })

  it("CRM queda en modo de prueba (sandbox) sin credenciales reales", () => {
    expect(soleil?.crm.enabled).toBe(true)
    expect(soleil?.crm.mode).toBe("sandbox")
    expect(soleil?.crm.baseUrl).toBe("https://crm-momentum.vercel.app")
    expect(soleil?.crm.masterSource).toBe("nexo")
    expect(soleil?.crm.modules).toContain("oportunidades")
  })

  it("IA apagada por defecto y lista para BYOK sin claves en el repo", () => {
    expect(soleil?.ai.enabled).toBe(false)
    expect(soleil?.ai.provider).toBe("none")
    expect(soleil?.ai.hasServerKey).toBe(false)
  })

  it("PAC en modo simulado: no hay timbrado real", () => {
    expect(soleil?.fiscal.pac).toBe("mock")
  })

  it("tiene indicadores configurables con valores iniciales", () => {
    const indicators = soleil?.ui?.dashboardIndicators ?? []
    expect(indicators.length).toBeGreaterThan(0)
    expect(indicators).toContain("productosSinPrecio")
    expect(indicators).toContain("stockBajo")
    const catalogIds = new Set(DASHBOARD_INDICATOR_CATALOG.map((d) => d.id))
    for (const id of indicators) expect(catalogIds.has(id)).toBe(true)
  })
})

describe("Menú por empresa y módulos combinados", () => {
  const soleil = findSeedTenant(SOLEIL_TENANT_ID)!
  const delar = findSeedTenant("org-delar")!

  it("los módulos combinados sustituyen a los que cubren en Soleil Wire", () => {
    const effective = resolveTenantModules(soleil)
    expect(effective).toContain("productsPricing")
    expect(effective).toContain("inventory")
    expect(effective).not.toContain("catalog")
    expect(effective).not.toContain("priceLists")
    expect(effective).not.toContain("inventoryStock")
    expect(effective).not.toContain("warehouse")
  })

  it("DELAR conserva su menú clásico sin módulos combinados", () => {
    const effective = resolveTenantModules(delar)
    expect(effective).toContain("catalog")
    expect(effective).toContain("priceLists")
    expect(effective).toContain("lots")
    expect(effective).not.toContain("productsPricing")
    expect(effective).not.toContain("inventoryStock")
    expect(effective).toEqual(ALL_MODULE_IDS)
  })

  it("las etiquetas por empresa aplican sin tocar el catálogo global", () => {
    const invoicing = getModule("invoicing")!
    expect(moduleLabel(soleil, invoicing)).toBe("Facturación y Remisiones")
    expect(moduleLabel(delar, invoicing)).toBe("Facturación")
    const suppliers = getModule("suppliers")!
    expect(moduleLabel(soleil, suppliers)).toBe("Proveedores / Compras")
  })

  it("el menú de Soleil sigue el orden configurado y agrupa secciones", () => {
    const menu = buildTenantMenu(soleil)
    const principal = menu.find((s) => s.title === "MODULOS PRINCIPALES")!
    const names = principal.items.map((i) => i.name)
    expect(names).toEqual([
      "Dashboard",
      "CRM Momentum",
      "Ventas",
      "Facturación y Remisiones",
      "Productos y Precios",
      "Inventario y Almacén",
      "Proveedores / Compras",
      "Bancos / Tesorería",
    ])
    const operaciones = menu.find((s) => s.title === "OPERACIONES")!
    expect(operaciones.items.map((i) => i.name)).toEqual(["Soporte"])
    const analitica = menu.find((s) => s.title === "ANALITICA")!
    expect(analitica.items.map((i) => i.name)).toEqual(["Reportes / BI"])
  })

  it("el fallback sin tenant usa el conjunto clásico (sin combinados)", () => {
    const menu = buildTenantMenu(null)
    const all = menu.flatMap((s) => s.items.map((i) => i.moduleId))
    expect(all).toContain("catalog")
    expect(all).not.toContain("productsPricing")
  })

  it("DISTRIBUTION_TENANT_MODULES coincide con el menú pedido para el giro", () => {
    expect(DISTRIBUTION_TENANT_MODULES).toEqual(soleil.modules)
  })
})

describe("Catálogo Soleil Wire — datos sin inventos", () => {
  it("carga 86 productos en 13 familias", () => {
    expect(getSoleilProducts()).toHaveLength(86)
    expect(getSoleilFamilies()).toHaveLength(13)
    expect(new Set(getSoleilProducts().map((p) => p.sku)).size).toBe(86)
  })

  it("incluye las familias del giro de cables", () => {
    const names = getSoleilFamilies().map((f) => f.nombre)
    for (const fam of [
      "Armados", "Medio Voltaje", "Minería", "Control/Potencia", "Renovable", "Monopolares",
      "Alta Temperatura", "Norma IEC", "Aluminio", "Planos", "Instrumentación", "Flexibles", "Industriales",
    ]) {
      expect(names).toContain(fam)
    }
  })

  it("no inventa precios: todo el catálogo inicia pendiente de precio", () => {
    expect(getSoleilProducts().every((p) => p.precioBase === null && p.precioMayoreo === null)).toBe(true)
    const entries = getSoleilPriceEntries()
    expect(entries).toHaveLength(86)
    expect(entries.every((e) => e.lista === "SOLEIL-BASE-2027")).toBe(true)
    expect(entries.every((e) => e.precioUnitario === null)).toBe(true)
    expect(getSoleilSeed().listaPrecios.estado).toBe("pendiente_precios")
  })

  it("clientes y oportunidades son demo explícito, no datos reales", () => {
    const clients = getSoleilClients()
    expect(clients).toHaveLength(2)
    expect(clients.every((c) => c.origen === "Demo")).toBe(true)
    expect(clients.every((c) => (c.razonSocial ?? "").toLowerCase().includes("ejemplo"))).toBe(true)
    const opps = getSoleilOpportunities()
    expect(opps).toHaveLength(2)
    expect(opps.every((o) => o.origen === "Demo")).toBe(true)
  })

  it("resume indicadores honestos (86 sin precio, sin montos inventados)", () => {
    const summary = buildSoleilIndicatorSummary()
    expect(summary.productosActivos).toBe(86)
    expect(summary.productosSinPrecio).toBe(86)
    expect(summary.familias).toBe(13)
    expect(summary.oportunidadesAbiertas).toBe(2)
    expect(summary.metrosDisponibles).toBe(0)
  })
})

describe("Inventario y Almacén — posiciones por bobina/serie", () => {
  it("aplica entradas, salidas, apartados, liberaciones y transferencias", () => {
    const positions = buildStockPositions(
      [
        {
          sku: "SW-MIN-DLO", almacen: "Principal", ubicacion: "A-01", loteSerie: "BOB-1",
          cantidadDisponible: 1000, unidad: "m", estado: "Disponible", fechaEntrada: null,
          fechaCaducidad: null, proveedor: null, costoUnitario: null, notas: null,
        },
      ],
      [
        { sku: "SW-MIN-DLO", tipo: "salida", cantidad: 200, unidad: "m", almacen: "Principal", loteSerie: "BOB-1", actorEmail: "a@b.c", at: "2026-07-07T10:00:00Z" },
        { sku: "SW-MIN-DLO", tipo: "apartado", cantidad: 300, unidad: "m", almacen: "Principal", loteSerie: "BOB-1", actorEmail: "a@b.c", at: "2026-07-07T11:00:00Z" },
        { sku: "SW-MIN-DLO", tipo: "liberacion", cantidad: 100, unidad: "m", almacen: "Principal", loteSerie: "BOB-1", actorEmail: "a@b.c", at: "2026-07-07T12:00:00Z" },
        { sku: "SW-MIN-DLO", tipo: "transferencia", cantidad: 150, unidad: "m", almacen: "Principal", almacenDestino: "Patio", loteSerie: "BOB-1", actorEmail: "a@b.c", at: "2026-07-07T13:00:00Z" },
      ],
    )
    const principal = positions.find((p) => p.almacen === "Principal" && p.loteSerie === "BOB-1")!
    // 1000 - 200 (salida) - 300 (apartado) + 100 (liberación) - 150 (transferencia) = 450
    expect(principal.disponible).toBe(450)
    expect(principal.apartado).toBe(200)
    const patio = positions.find((p) => p.almacen === "Patio")!
    expect(patio.disponible).toBe(150)
    expect(patio.capturado).toBe(true)
  })

  it("marca como no capturadas las posiciones sin cantidad inicial", () => {
    const positions = buildStockPositions(
      [
        {
          sku: "SW-ARM-CTRL-MC-CHAQ", almacen: "Principal", ubicacion: "A-01", loteSerie: null,
          cantidadDisponible: null, unidad: "m", estado: "Disponible", fechaEntrada: null,
          fechaCaducidad: null, proveedor: null, costoUnitario: null, notas: null,
        },
      ],
      [],
    )
    expect(positions[0].capturado).toBe(false)
    expect(positions[0].disponible).toBe(0)
  })
})

describe("Centro de Importación — plantillas y auto-mapeo con el paquete Soleil", () => {
  it("el catálogo de cables auto-mapea completo (producto ≠ descripción)", () => {
    const template = getTemplate("productos")!
    const mapping = autoMap(template, CATALOG_HEADERS)
    expect(mapping.sku).toBe("sku")
    expect(mapping.nombre).toBe("producto")
    expect(mapping.descripcion).toBe("descripcion")
    expect(mapping.categoria).toBe("familia")
    expect(mapping.unidad).toBe("unidad_venta")
    expect(mapping.precio).toBe("precio_base")
    expect(mapping.precioMayoreo).toBe("precio_mayoreo")
    expect(mapping.costo).toBe("costo_estimado")
    expect(mapping.stockMinimo).toBe("stock_minimo")
    expect(mapping.tiempoEntregaDias).toBe("tiempo_entrega_dias")
    expect(mapping.usoAplicacion).toBe("uso_aplicacion")
    expect(mapping.imagenId).toBe("imagen_id")
    expect(mapping.activo).toBe("activo")
  })

  it("la lista de precios acepta listas propias como SOLEIL-BASE-2027", () => {
    const template = getTemplate("precios")!
    const mapping = autoMap(template, PRICE_HEADERS)
    expect(mapping.lista).toBe("lista_precio")
    expect(mapping.precioUnitario).toBe("precio_unitario")
    expect(mapping.vigenciaDesde).toBe("vigencia_inicio")
    expect(mapping.vigenciaFin).toBe("vigencia_fin")
    const result = validate(
      template,
      [{ sku: "SW-MIN-DLO", lista_precio: "SOLEIL-BASE-2027", precio_unitario: "125.50", canal: "General" } as Record<string, string>],
      mapping,
    )
    expect(result.errors).toHaveLength(0)
    expect(result.validRows[0].lista).toBe("SOLEIL-BASE-2027")
  })

  it("clientes CRM separan estado geográfico y estatus comercial", () => {
    const template = getTemplate("clientes")!
    const mapping = autoMap(template, CLIENT_HEADERS)
    expect(mapping.nombre).toBe("razon_social")
    expect(mapping.estado).toBe("estado")
    expect(mapping.estatus).toBe("estatus")
    expect(mapping.contacto).toBe("contacto_principal")
    expect(mapping.diasCredito).toBe("dias_credito")
    const result = validate(
      template,
      [
        {
          razon_social: "Cliente ejemplo Minería SA de CV",
          estado: "Nuevo León",
          estatus: "Prospecto",
          dias_credito: "30",
          origen: "Demo",
        } as Record<string, string>,
      ],
      mapping,
    )
    expect(result.errors).toHaveLength(0)
    expect(result.validRows[0].estatus).toBe("prospecto")
    expect(result.validRows[0].estado).toBe("Nuevo León")
  })

  it("existen los tipos de importación nuevos y mapean el paquete", () => {
    for (const entity of ["contactos", "prospectos", "oportunidades", "movimientos-bancarios", "catalogo-contable"]) {
      expect(getTemplate(entity), `plantilla ${entity}`).toBeDefined()
    }
    const opp = getTemplate("oportunidades")!
    const mapping = autoMap(opp, OPportunity_HEADERS)
    expect(mapping.oportunidad).toBe("oportunidad")
    expect(mapping.familiaInteres).toBe("familia_interes")
    expect(mapping.productoInteres).toBe("producto_interes")
    expect(mapping.montoEstimado).toBe("monto_estimado")
    expect(mapping.fechaCierreEstimada).toBe("fecha_cierre_estimada")

    const inv = getTemplate("inventario-inicial")!
    const invMapping = autoMap(inv, INVENTORY_HEADERS)
    expect(invMapping.cantidad).toBe("cantidad_disponible")
    expect(invMapping.lote).toBe("lote_serie")
    expect(invMapping.caducidad).toBe("fecha_caducidad")
    expect(invMapping.costoUnitario).toBe("costo_unitario")
  })

  it("detecta duplicados por SKU dentro del archivo (no duplica productos)", () => {
    const template = getTemplate("productos")!
    const mapping = autoMap(template, CATALOG_HEADERS)
    const result = validate(
      template,
      [
        { sku: "SW-MIN-DLO", producto: "Cable tipo DLO", familia: "Minería", unidad_venta: "m" } as Record<string, string>,
        { sku: "SW-MIN-DLO", producto: "Cable tipo DLO (dup)", familia: "Minería", unidad_venta: "m" } as Record<string, string>,
      ],
      mapping,
    )
    expect(result.validRows).toHaveLength(1)
    expect(result.duplicates).toHaveLength(1)
    expect(result.duplicates[0].row).toBe(2)
  })

  it("detecta existentes por SKU para actualizar en vez de crear", () => {
    const template = getTemplate("productos")!
    const mapping = autoMap(template, CATALOG_HEADERS)
    // El SKU ya existe en el sistema (clave natural conocida) → se marca duplicado
    // para que el flujo lo trate como actualización, no como alta nueva.
    const existing = new Set<string>(["sw-min-dlo"])
    const result = validate(
      template,
      [{ sku: "SW-MIN-DLO", producto: "Cable tipo DLO", familia: "Minería", unidad_venta: "m" } as Record<string, string>],
      mapping,
      existing,
    )
    expect(result.validRows).toHaveLength(0)
    expect(result.duplicates).toHaveLength(1)
  })

  it("reporta errores por fila cuando falta un campo obligatorio", () => {
    const template = getTemplate("productos")!
    const mapping = autoMap(template, CATALOG_HEADERS)
    const result = validate(
      template,
      [{ sku: "", producto: "", familia: "Minería", unidad_venta: "m" } as Record<string, string>],
      mapping,
    )
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors.some((e) => e.field === "sku")).toBe(true)
    expect(result.validRows).toHaveLength(0)
  })
})

describe("Permisos — Panel Nexo solo para operaciones@nexo.com", () => {
  it("operaciones@nexo.com es administrador de plataforma", () => {
    const role = resolvePlatformRole("operaciones@nexo.com")
    expect(role).toBe("platform_admin")
    expect(canAccessControlPlane(role)).toBe(true)
  })

  it("un usuario normal de Soleil Wire no accede al Panel Nexo", () => {
    const role = resolvePlatformRole("ventas@soleilwire.com")
    expect(role).toBe("none")
    expect(canAccessControlPlane(role)).toBe(false)
  })
})

describe("Asistente — módulos combinados y lenguaje informal", () => {
  const base = { pathname: "/dashboard/productos-precios", isNexoAdmin: false, canImport: true, canExport: true }

  it("explica Productos y Precios ante 'q puedo hacer aqui'", () => {
    const reply = buildAssistantReply({ ...base, input: "q puedo hacer aqui" })
    expect(reply.text).toContain("Productos y Precios")
    expect(reply.suggestions.length).toBeGreaterThan(0)
  })

  it("entiende 'sin precio' sin acentos ni contexto", () => {
    const reply = buildAssistantReply({ ...base, input: "cuales estan sin precio" })
    expect(reply.suggestions.some((s) => s.href.includes("productos-precios"))).toBe(true)
  })

  it("entiende 'stock bajo' y lleva a Inventario y Almacén", () => {
    const reply = buildAssistantReply({ ...base, input: "stock bajo" })
    expect(reply.suggestions.some((s) => s.href.includes("inventory"))).toBe(true)
  })

  it("entiende 'bobina' como trazabilidad de inventario", () => {
    const reply = buildAssistantReply({ ...base, input: "donde veo la bobina BOB-0001" })
    expect(reply.suggestions.some((s) => s.href.includes("inventory"))).toBe(true)
  })

  it("responde sin romperse a toda la lista de frases mal escritas", () => {
    const phrases = [
      "que puedo hacer aqui",
      "q puedo hacer",
      "sumame ventas",
      "ventas del mes",
      "filtra ranch",
      "ordenar mayor menor",
      "exportar excel",
      "importar precios",
      "quien cambio esto",
      "historial",
      "stock bajo",
      "sin precio",
      "margen",
      "crm",
      "cotizaciones",
    ]
    for (const phrase of phrases) {
      const reply = buildAssistantReply({ ...base, input: phrase })
      expect(reply.text, `frase: ${phrase}`).toBeTruthy()
      expect(reply.text.length, `frase: ${phrase}`).toBeGreaterThan(0)
    }
  })

  it("responde en inglés cuando el idioma configurado es inglés", () => {
    const reply = buildAssistantReply({ ...base, input: "what can i do", language: "en" })
    expect(reply.text).toMatch(/[A-Za-z]/)
    expect(reply.text).not.toContain("Estás en")
  })

  it("'exportar excel' e 'importar precios' guían export/import", () => {
    const exp = buildAssistantReply({ ...base, input: "exportar excel" })
    expect(exp.text.toLowerCase()).toContain("export")
    const imp = buildAssistantReply({ ...base, input: "importar precios" })
    expect(imp.suggestions.some((s) => s.href.includes("import"))).toBe(true)
  })

  it("'quien cambio esto' e 'historial' llevan a trazabilidad", () => {
    const a = buildAssistantReply({ ...base, input: "quien cambio esto" })
    expect(a.text.toLowerCase()).toContain("últimos cambios")
    const b = buildAssistantReply({ ...base, input: "historial" })
    expect(b.text.toLowerCase()).toContain("últimos cambios")
  })

  it("no recomienda el panel administrador a usuarios normales", () => {
    const reply = buildAssistantReply({
      input: "que puedo hacer aqui",
      pathname: "/admin/tenants",
      isNexoAdmin: false,
      canImport: true,
      canExport: true,
    })
    // Niega el acceso y no ofrece ninguna acción hacia /admin
    expect(reply.text).toContain("No tienes permiso")
    expect(reply.suggestions).toHaveLength(0)
    const normalUser = buildAssistantReply({
      input: "que puedo hacer aqui",
      pathname: "/dashboard",
      isNexoAdmin: false,
      canImport: true,
      canExport: true,
    })
    expect(normalUser.suggestions.every((s) => !s.href.startsWith("/admin"))).toBe(true)
  })
})
