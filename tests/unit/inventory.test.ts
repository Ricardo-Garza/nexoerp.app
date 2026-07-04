import { describe, expect, it } from "vitest"
import {
  canTransitionLotQuality,
  isLotUsable,
  projectStock,
  suggestFefoAllocation,
  validateMovement,
} from "@/lib/domain/inventory/ledger"
import type { InventoryMovement, Lot } from "@/lib/domain/inventory/types"

const baseMovement = {
  organizationId: "org-delar",
  skuId: "sku-1",
  lotId: "lot-1",
  locationId: "loc-1",
  actorId: "tester",
  correlationId: "corr-1",
}

function mov(partial: Partial<InventoryMovement>): InventoryMovement {
  return {
    id: "m",
    type: "receipt",
    quantity: "10",
    idempotencyKey: "k",
    reason: null,
    occurredAt: new Date().toISOString(),
    reversesMovementId: null,
    ...baseMovement,
    ...partial,
  }
}

function lot(partial: Partial<Lot>): Lot {
  return {
    id: "lot-1",
    organizationId: "org-delar",
    skuId: "sku-1",
    lotCode: "LOT-1",
    vendorLotCode: null,
    receivedAt: "2026-01-01",
    expiryDate: "2027-01-01",
    qualityStatus: "released",
    ...partial,
  }
}

describe("ledger de movimientos", () => {
  it("valida signos por tipo de movimiento", () => {
    const receiptNegative = validateMovement(
      { ...baseMovement, type: "receipt", quantity: "-5", idempotencyKey: "a" },
      undefined,
      null,
      "0",
    )
    expect(receiptNegative.ok).toBe(false)

    const shipmentPositive = validateMovement(
      { ...baseMovement, type: "shipment", quantity: "5", idempotencyKey: "b" },
      undefined,
      lot({}),
      "10",
    )
    expect(shipmentPositive.ok).toBe(false)
  })

  it("rechaza cantidad cero", () => {
    const r = validateMovement({ ...baseMovement, type: "receipt", quantity: "0", idempotencyKey: "c" }, undefined, null, "0")
    expect(r.ok).toBe(false)
  })

  it("no permite stock negativo sin política explícita", () => {
    const r = validateMovement(
      { ...baseMovement, type: "shipment", quantity: "-20", idempotencyKey: "d" },
      undefined,
      lot({}),
      "10",
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.code).toBe("insufficient_stock")
  })

  it("idempotencia: la misma clave no duplica efecto", () => {
    const existing = mov({ idempotencyKey: "same-key" })
    const r = validateMovement(
      { ...baseMovement, type: "receipt", quantity: "10", idempotencyKey: "same-key" },
      existing,
      null,
      "0",
    )
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value).toBe("duplicate")
  })

  it("bloquea salida de lote no liberado o vencido", () => {
    const quarantined = validateMovement(
      { ...baseMovement, type: "shipment", quantity: "-2", idempotencyKey: "e" },
      undefined,
      lot({ qualityStatus: "quarantine" }),
      "10",
    )
    expect(quarantined.ok).toBe(false)
    if (!quarantined.ok) expect(quarantined.error.code).toBe("lot_not_sellable")

    const expired = validateMovement(
      { ...baseMovement, type: "shipment", quantity: "-2", idempotencyKey: "f" },
      undefined,
      lot({ expiryDate: "2020-01-01" }),
      "10",
    )
    expect(expired.ok).toBe(false)
  })
})

describe("proyección de stock", () => {
  it("reconstruye saldos desde el ledger, incluidas reservas", () => {
    const rows = projectStock([
      mov({ idempotencyKey: "r1", type: "receipt", quantity: "10" }),
      mov({ idempotencyKey: "s1", type: "shipment", quantity: "-3" }),
      mov({ idempotencyKey: "res1", type: "reservation", quantity: "-2" }),
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0].onHand).toBe("7")
    expect(rows[0].reserved).toBe("2")
    expect(rows[0].available).toBe("5")
  })
})

describe("FEFO", () => {
  const lots: Lot[] = [
    lot({ id: "l-far", lotCode: "FAR", expiryDate: "2027-06-01" }),
    lot({ id: "l-near", lotCode: "NEAR", expiryDate: "2026-08-01" }),
    lot({ id: "l-expired", lotCode: "EXPIRED", expiryDate: "2020-01-01" }),
    lot({ id: "l-quar", lotCode: "QUAR", expiryDate: "2026-07-15", qualityStatus: "quarantine" }),
  ]
  const stock = projectStock([
    mov({ idempotencyKey: "s-far", lotId: "l-far", quantity: "10" }),
    mov({ idempotencyKey: "s-near", lotId: "l-near", quantity: "4" }),
    mov({ idempotencyKey: "s-exp", lotId: "l-expired", quantity: "50" }),
    mov({ idempotencyKey: "s-quar", lotId: "l-quar", quantity: "50" }),
  ])

  it("sugiere primero el lote con caducidad más próxima, excluyendo vencidos y cuarentena", () => {
    const r = suggestFefoAllocation({ skuId: "sku-1", quantity: "6", onDate: "2026-07-03", lots, stock })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value[0].lotCode).toBe("NEAR")
      expect(r.value[0].quantity).toBe("4")
      expect(r.value[1].lotCode).toBe("FAR")
      expect(r.value[1].quantity).toBe("2")
      expect(r.value.map((s) => s.lotCode)).not.toContain("EXPIRED")
      expect(r.value.map((s) => s.lotCode)).not.toContain("QUAR")
    }
  })

  it("falla si el stock utilizable no alcanza aunque haya stock bloqueado", () => {
    const r = suggestFefoAllocation({ skuId: "sku-1", quantity: "100", onDate: "2026-07-03", lots, stock })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.code).toBe("insufficient_stock")
  })
})

describe("estados de calidad", () => {
  it("solo lotes liberados y no vencidos son utilizables", () => {
    expect(isLotUsable(lot({}), "2026-07-03").ok).toBe(true)
    expect(isLotUsable(lot({ qualityStatus: "pending" }), "2026-07-03").ok).toBe(false)
    expect(isLotUsable(lot({ qualityStatus: "rejected" }), "2026-07-03").ok).toBe(false)
    expect(isLotUsable(lot({ qualityStatus: "blocked" }), "2026-07-03").ok).toBe(false)
    expect(isLotUsable(lot({ expiryDate: "2026-07-02" }), "2026-07-03").ok).toBe(false)
  })

  it("valida transiciones de calidad", () => {
    expect(canTransitionLotQuality("quarantine", "released")).toBe(true)
    expect(canTransitionLotQuality("rejected", "released")).toBe(false)
    expect(canTransitionLotQuality("released", "blocked")).toBe(true)
  })
})
