import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const root = process.cwd()

function read(path: string): string {
  return readFileSync(join(root, path), "utf8")
}

describe("ERP UI polish source checks", () => {
  it("does not expose implementation messages in inventory lots", () => {
    const source = read("components/delar/inventory-lots.tsx")

    expect(source).not.toMatch(/modo demo local|persistencia durable|deuda D3|IMPLEMENTATION_STATUS|docs\//i)
    expect(source).toContain("Esta función todavía está en configuración")
  })

  it("data table exposes column filters, active filter chips, metrics and recent changes", () => {
    const source = read("components/ui/data-table-pro.tsx")

    expect(source).toContain('data-testid="table-filters"')
    expect(source).toContain('data-testid="table-active-filters"')
    expect(source).toContain('data-testid="table-metrics"')
    expect(source).toContain('data-testid="table-recent-changes"')
    expect(source).toContain("Filtro por columna")
  })

  it("header uses roomy controls for language, theme and company", () => {
    const header = read("components/layout/app-header.tsx")
    const preferences = read("components/layout/user-preference-selects.tsx")

    expect(header).toContain("min-h-[76px]")
    expect(header).toContain("gap-3")
    expect(preferences).toContain("w-[142px]")
    expect(preferences).toContain("Español")
  })

  it("assistant has specific inventory lot actions", () => {
    const source = read("lib/assistant/nexo-assistant.ts")

    expect(source).toContain("Buscar lote")
    expect(source).toContain("Ver últimos movimientos")
    expect(source).not.toMatch(/Ã|Â|â/)
  })
})
