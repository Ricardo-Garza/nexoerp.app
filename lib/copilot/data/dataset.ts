import soleilSeed from "@/lib/domain/soleilwire/soleil-seed.json"
import type { CatalogInput, DemoDataset } from "../types"
import { generateSoleilDemoDataset } from "./generator"

let cached: DemoDataset | null = null

/** Catálogo base público (familias y nombres) que alimenta al generador. */
export function soleilCatalogInput(): CatalogInput[] {
  return (soleilSeed.productos as { sku: string; familia: string; producto: string }[]).map((p) => ({
    sku: p.sku,
    familia: p.familia,
    producto: p.producto,
  }))
}

/** Dataset DEMO determinista, generado una vez por proceso (vive solo en el servidor). */
export function getSoleilDemoDataset(): DemoDataset {
  if (!cached) cached = generateSoleilDemoDataset(soleilCatalogInput())
  return cached
}
