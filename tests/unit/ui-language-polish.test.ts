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
})
