import { describe, expect, it } from "vitest"
import { buildSoleilDashboardSummary } from "@/lib/copilot/dashboard-summary"
import { getDemoService } from "@/lib/copilot/service"
import { COPILOT_TENANT_ID } from "@/lib/copilot/constants"

describe("tablero Soleil Wire", () => {
  it("calcula KPIs y rankings desde la misma vista analítica del copiloto", async () => {
    const view = await getDemoService().view({ tenantId: COPILOT_TENANT_ID, userId: "test", role: "platform_admin" })
    const summary = buildSoleilDashboardSummary(view)

    expect(summary.asOf).toBe(view.asOf)
    expect(summary.salesMonth).toBeGreaterThan(0)
    expect(summary.salesYtd).toBeGreaterThan(summary.salesMonth)
    expect(summary.activeCustomers).toBeGreaterThan(0)
    expect(summary.grossMarginMxn).toBeGreaterThan(0)
    expect(summary.inventoryUnits).toBeGreaterThan(0)
    expect(summary.criticalStock).toBeGreaterThan(0)
    expect(summary.receivablesMxn).toBeGreaterThan(0)
    expect(summary.openOpportunities).toBeGreaterThan(0)
    expect(summary.monthlySales).toHaveLength(6)
    expect(summary.topCustomers).toHaveLength(10)
    expect(summary.topProducts).toHaveLength(10)
  })
})
