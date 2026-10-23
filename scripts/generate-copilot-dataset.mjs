/**
 * Regenera y verifica el dataset DEMO de Soleil Wire para Nexo Intelligence.
 *
 * Determinista e idempotente: mismo seed + mismo catálogo → mismo SHA-256.
 * Uso:
 *   npm run copilot:dataset            # imprime conteos y hash
 *   npm run copilot:dataset -- --write # además actualiza lib/copilot/data/dataset-manifest.json
 *
 * Requiere Node >= 22.18 (ejecuta TypeScript sin transpilar). No toca ninguna base de datos.
 */
import { createHash } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const SEED = join(ROOT, "lib", "domain", "soleilwire", "soleil-seed.json")
const MANIFEST = join(ROOT, "lib", "copilot", "data", "dataset-manifest.json")

const { generateSoleilDemoDataset } = await import(pathToFileURL(join(ROOT, "lib", "copilot", "data", "generator.ts")).href)
const seed = JSON.parse(readFileSync(SEED, "utf8"))
const catalog = seed.productos.map((p) => ({ sku: p.sku, familia: p.familia, producto: p.producto }))

const dataset = generateSoleilDemoDataset(catalog)
const counts = {
  customers: dataset.customers.length,
  suppliers: dataset.suppliers.length,
  warehouses: dataset.warehouses.length,
  products: dataset.products.length,
  quotes: dataset.quotes.length,
  opportunities: dataset.opportunities.length,
  orders: dataset.orders.length,
  orderLines: dataset.orders.reduce((n, o) => n + o.lines.length, 0),
  invoices: dataset.invoices.length,
  payments: dataset.payments.length,
  creditNotes: dataset.creditNotes.length,
  purchaseOrders: dataset.purchaseOrders.length,
  movements: dataset.movements.length,
}
const sha256 = createHash("sha256").update(JSON.stringify(dataset)).digest("hex")
const manifest = { seed: dataset.meta.seed, referenceDate: dataset.meta.referenceDate, schemaVersion: dataset.meta.schemaVersion, counts, sha256 }

console.table(counts)
console.log(`sha256=${sha256}`)

if (process.argv.includes("--write")) {
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n", "utf8")
  console.log(`manifest actualizado: ${MANIFEST}`)
} else {
  try {
    const current = JSON.parse(readFileSync(MANIFEST, "utf8"))
    if (current.sha256 !== sha256) {
      console.error("El dataset NO coincide con dataset-manifest.json (usa --write si el cambio es intencional).")
      process.exitCode = 1
    } else {
      console.log("OK: coincide con dataset-manifest.json")
    }
  } catch {
    console.log("(sin manifest previo)")
  }
}
