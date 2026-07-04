import { describe, expect, it } from "vitest"
import { hasPermission, ROLE_PERMISSIONS } from "@/lib/domain/rbac/roles"

describe("RBAC granular", () => {
  it("calidad libera lotes; ventas no", () => {
    expect(hasPermission("quality_manager", "lot.release")).toBe(true)
    expect(hasPermission("sales_rep", "lot.release")).toBe(false)
    expect(hasPermission("cashier", "lot.release")).toBe(false)
  })

  it("almacén recibe inventario; auditor no muta nada", () => {
    expect(hasPermission("warehouse_manager", "inventory.receive")).toBe(true)
    expect(hasPermission("auditor", "inventory.receive")).toBe(false)
    expect(hasPermission("auditor", "stock.adjust.approve")).toBe(false)
    expect(hasPermission("auditor", "audit.view")).toBe(true)
  })

  it("margen visible solo para roles autorizados", () => {
    expect(hasPermission("director", "price.margin.view")).toBe(true)
    expect(hasPermission("finance_manager", "price.margin.view")).toBe(true)
    expect(hasPermission("sales_rep", "price.margin.view")).toBe(false)
    expect(hasPermission("warehouse_operator", "price.margin.view")).toBe(false)
  })

  it("segregación: quien solicita ajuste no lo aprueba (roles distintos)", () => {
    expect(hasPermission("warehouse_manager", "stock.adjust.request")).toBe(true)
    expect(hasPermission("warehouse_manager", "stock.adjust.approve")).toBe(false)
    expect(hasPermission("director", "stock.adjust.approve")).toBe(true)
  })

  it("todos los roles están definidos", () => {
    expect(Object.keys(ROLE_PERMISSIONS)).toHaveLength(13)
  })
})
