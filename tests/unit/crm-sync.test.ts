import { describe, expect, it } from "vitest"
import { MockMomentumAdapter } from "@/lib/integrations/crm/mock-adapter"
import { HttpMomentumAdapter } from "@/lib/integrations/crm/http-adapter"
import { buildOutboxEvent, processOutbox, pullContactsToCustomers } from "@/lib/integrations/crm/sync"
import type { CrmSyncPort } from "@/lib/integrations/crm/port"
import type { ExternalIdMapping } from "@/lib/integrations/crm/types"

const ORG = "org-delar"

function seededAdapter() {
  return new MockMomentumAdapter([
    { name: "Restaurante El Fogón", email: "compras@elfogon.mx", company: "El Fogón" },
    { name: "Alitas Norte", phone: "8111000001", company: "Alitas Norte SA" },
    { name: "Restaurante El Fogón (dup)", email: "COMPRAS@ELFOGON.MX" }, // duplicado por email
  ])
}

describe("CRM Momentum — pull de contactos (sandbox)", () => {
  it("mapea contactos a borradores de cliente y deduplica por email normalizado", async () => {
    const result = await pullContactsToCustomers({
      organizationId: ORG,
      crm: seededAdapter(),
      existingMappings: [],
      existingCustomerKeys: new Set(),
    })
    expect(result.summary.pulled).toBe(3)
    expect(result.summary.created).toBe(2)
    expect(result.summary.deduplicated).toBe(1)
    expect(result.drafts.map((d) => d.crmExternalId)).toHaveLength(2)
    expect(result.mappings.every((m) => m.system === "momentum" && m.organizationId === ORG)).toBe(true)
  })

  it("es idempotente: contactos ya mapeados no se recrean", async () => {
    const crm = seededAdapter()
    const first = await pullContactsToCustomers({
      organizationId: ORG,
      crm,
      existingMappings: [],
      existingCustomerKeys: new Set(),
    })
    const second = await pullContactsToCustomers({
      organizationId: ORG,
      crm,
      existingMappings: first.mappings,
      existingCustomerKeys: new Set(),
    })
    expect(second.summary.created).toBe(0)
    expect(second.summary.updated).toBe(2)
    expect(second.drafts).toHaveLength(0)
  })
})

describe("CRM Momentum — outbox con reintentos y dead-letter", () => {
  it("envía eventos pendientes una sola vez", async () => {
    const crm = seededAdapter()
    const event = buildOutboxEvent({
      organizationId: ORG,
      operation: "record_activity",
      idempotencyKey: "act-orden-123",
      payload: { type: "nota", description: "Pedido confirmado", contactId: "mock-contact-1", dealId: null, scheduledAt: null, completedAt: null },
    })
    const events = [event]
    const r1 = await processOutbox(events, crm)
    expect(r1.sent).toBe(1)
    const r2 = await processOutbox(events, crm) // re-proceso: no duplica
    expect(r2.sent).toBe(0)
    expect(event.status).toBe("sent")
  })

  it("manda a dead-letter tras agotar reintentos", async () => {
    const failing: CrmSyncPort = {
      name: "failing",
      health: async () => ({ ok: false, detail: "down" }),
      listContacts: async () => [],
      createContact: async () => {
        throw new Error("CRM caído")
      },
      updateContact: async () => {
        throw new Error("CRM caído")
      },
      listDeals: async () => [],
      recordActivity: async () => {
        throw new Error("CRM caído")
      },
    }
    const event = buildOutboxEvent({
      organizationId: ORG,
      operation: "push_customer",
      idempotencyKey: "cust-1",
      payload: { name: "Cliente X", email: null, phone: null, company: null, source: "erp", temperature: "warm", score: 0, notes: null },
      maxAttempts: 2,
    })
    const events = [event]
    await processOutbox(events, failing)
    expect(event.status).toBe("failed")
    await processOutbox(events, failing)
    expect(event.status).toBe("dead_letter")
    expect(event.lastError).toContain("CRM caído")
  })
})

describe("CRM Momentum — contrato del adaptador HTTP (fetch simulado)", () => {
  it("usa los endpoints reales de auto-crm y propaga errores HTTP", async () => {
    const calls: string[] = []
    const fakeFetch = (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push(`${init?.method ?? "GET"} ${url}`)
      return new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } })
    }) as typeof fetch

    const adapter = new HttpMomentumAdapter("https://crm.example.test", fakeFetch)
    await adapter.listContacts({ search: "fogón" })
    await adapter.listDeals()
    expect(calls[0]).toBe("GET https://crm.example.test/api/contacts?search=fog%C3%B3n")
    expect(calls[1]).toBe("GET https://crm.example.test/api/deals")

    const failFetch = (async () => new Response("{}", { status: 500 })) as typeof fetch
    const failing = new HttpMomentumAdapter("https://crm.example.test", failFetch)
    await expect(failing.listContacts()).rejects.toThrow("respondió 500")
    const health = await failing.health()
    expect(health.ok).toBe(false)
  })
})
