/**
 * Genera lib/domain/seed/seed-data.json desde los datos canónicos de
 * project-context/delar-erp/data/. Los CSV originales son la fuente de verdad;
 * este JSON es un artefacto generado y versionado para el seed idempotente.
 *
 * Ejecutar: node scripts/generate-domain-seed.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const dataDir = join(root, "project-context", "delar-erp", "data")

function parseCsv(path) {
  const raw = readFileSync(path, "utf8").replace(/^﻿/, "")
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0)
  const headers = splitCsvLine(lines[0])
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line)
    return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? ""]))
  })
}

function splitCsvLine(line) {
  const out = []
  let cur = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        cur += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ",") {
      out.push(cur)
      cur = ""
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out.map((c) => c.trim())
}

const brands = parseCsv(join(dataDir, "brands_seed.csv"))
const catalog = parseCsv(join(dataDir, "product_catalog_seed.csv"))
const priceRows = parseCsv(join(dataDir, "price_lists_seed.csv"))
const dq = parseCsv(join(dataDir, "data_quality_issues.csv"))
const commercial = JSON.parse(readFileSync(join(dataDir, "delivery_and_commercial_rules_seed.json"), "utf8"))

// Listas de precios únicas
const listIndex = new Map()
for (const row of priceRows) {
  if (!listIndex.has(row.price_list_code)) {
    listIndex.set(row.price_list_code, {
      code: row.price_list_code,
      name: row.price_list_name,
      channel: row.price_list_code.startsWith("WHOLESALE") ? "wholesale" : "retail",
      currency: row.currency,
      validFrom: row.valid_from,
      status: row.status,
      sourceNote: row.source_note,
    })
  }
}

const seed = {
  generatedFrom: "project-context/delar-erp/data (2025 historical, requires validation)",
  brands: brands.map((b) => ({
    code: b.brand_code,
    name: b.brand_name,
    brandType: b.brand_type,
  })),
  skus: catalog.map((r) => ({
    sku: r.sku,
    brandCode: r.brand_code,
    family: r.family,
    name: r.product_name,
    category: r.category,
    presentationType: r.presentation_type,
    netContent: r.net_content,
    netUnit: r.net_unit,
    unitsPerCase: Number(r.units_per_case || 1),
    ean: r.ean || null,
    dun: r.dun || null,
    trackLot: r.track_lot === "true",
    expiryRequired: r.expiry_required === "true",
    dataStatus: r.data_status,
    source: r.source,
  })),
  priceLists: [...listIndex.values()],
  priceEntries: priceRows.map((r) => ({
    priceListCode: r.price_list_code,
    sku: r.sku,
    unitPrice: r.unit_price,
  })),
  commercialRules: commercial,
  dataQualityIssues: dq.map((r) => ({
    id: r.issue_id,
    domain: r.domain,
    entity: r.entity,
    issue: r.issue,
    requiredAction: r.required_action,
    severity: r.severity,
  })),
}

const outPath = join(root, "lib", "domain", "seed", "seed-data.json")
mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, JSON.stringify(seed, null, 2) + "\n", "utf8")
console.log(
  `seed-data.json generado: ${seed.brands.length} marcas, ${seed.skus.length} SKUs, ${seed.priceLists.length} listas, ${seed.priceEntries.length} precios, ${seed.dataQualityIssues.length} issues de calidad`,
)
