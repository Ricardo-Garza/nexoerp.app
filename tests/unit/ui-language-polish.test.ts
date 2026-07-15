import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const root = process.cwd()

function read(path: string): string {
  return readFileSync(join(root, path), "utf8")
}

describe("UI language polish", () => {
  it("keeps admin-facing screens in everyday Spanish", () => {
    const visibleScreens = [
      "app/admin/integrations/page.tsx",
      "app/admin/ai/page.tsx",
      "app/admin/modules/page.tsx",
      "app/admin/support/page.tsx",
      "app/dashboard/crm/page.tsx",
    ].map(read)

    const all = visibleScreens.join("\n")
    expect(all).not.toContain("Control Plane")
    expect(all).not.toContain("BYOK")
    expect(all).not.toContain("MockPacAdapter")
    expect(all).not.toContain("sync sandbox")
    expect(all).not.toContain("ledger de inventario")
    expect(all).not.toMatch(/>\s*Sandbox\s*</)
    expect(all).not.toMatch(/>\s*Mock\s*</)
  })

  it("uses 'empresa' instead of 'universo' or 'tenant' in visible copy", () => {
    const screens = [
      "app/dashboard/import/page.tsx",
      "app/admin/imports/page.tsx",
      "app/admin/audit/page.tsx",
      "app/admin/tenants/page.tsx",
    ].map(read)

    const all = screens.join("\n")
    expect(all).not.toMatch(/universo/i)
    // "Tenant(s)" solo puede aparecer como identificador de código, nunca como texto visible
    expect(all).not.toMatch(/[>"]\s*Tenants?\s*[<"]/)
    expect(read("app/admin/tenants/page.tsx")).toContain("Empresas")
  })

  it("payroll and accounting expose real import/export instead of dead buttons", () => {
    const payroll = read("app/dashboard/payroll/page.tsx")
    const employees = read("components/payroll/employees-tab.tsx")
    const accounts = read("components/accounting/accounts-table.tsx")
    const journal = read("components/accounting/journal-entries-table.tsx")

    expect(payroll).toContain('href="/dashboard/import"')
    expect(employees).toContain("DataTablePro")
    expect(accounts).not.toMatch(/alert\(/)
    expect(journal).not.toMatch(/alert\(.*en desarrollo/)
    expect(accounts).toContain("DataTablePro")
    expect(journal).toContain("DataTablePro")
  })

  it("does not use question mark icons or bare question marks as dashboard actions", () => {
    const topProducts = read("components/dashboard/top-products.tsx")

    expect(topProducts).not.toMatch(/CircleHelp|HelpCircle|Question/)
    expect(topProducts).not.toMatch(/>\s*\?\s*</)
  })

  it("keeps the public privacy page free of broken accent placeholders", () => {
    const privacy = read("app/aviso-de-privacidad/page.tsx")

    expect(privacy).not.toContain("?ltima")
    expect(privacy).not.toMatch(/c\?mo|protecci\?n|M\?xico|informaci\?n/)
  })

  it("dashboard chart tooltips never leak the raw 'value' dataKey as a label", () => {
    const dashboard = read("components/dashboard/customizable-dashboard.tsx")

    // Bar/Line usan dataKey="value": sin name="Valor" o formatter, Recharts
    // muestra literal "value" en el tooltip.
    expect(dashboard).not.toMatch(/<ChartTooltip\s*\/>/)
    expect(dashboard).toContain('name="Valor"')
    expect(dashboard).not.toMatch(/>\s*value\s*</)
  })

  it("dashboard config modal avoids fixed-width columns that force horizontal scroll", () => {
    const dashboard = read("components/dashboard/customizable-dashboard.tsx")

    expect(dashboard).not.toMatch(/grid-cols-\[[0-9]+px/)
    expect(dashboard).toContain("overflow-x-hidden")
    expect(dashboard).toContain("Personalizar panel de control")
    expect(dashboard).not.toContain("Personalizar dashboard")
    expect(dashboard).not.toContain("Por conectar")
  })
})
