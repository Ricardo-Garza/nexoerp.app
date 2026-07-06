import { describe, expect, it } from "vitest"
import { buildAssistantReply, normalizeAssistantText } from "@/lib/assistant/nexo-assistant"

describe("Nexo assistant", () => {
  it("understands misspelled help requests without accents or question marks", () => {
    expect(normalizeAssistantText("q puedo hacer aquí??")).toBe("que puedo hacer aqui")

    const reply = buildAssistantReply({
      input: "q puedo hacer aqui",
      pathname: "/dashboard/listas-precios",
      isNexoAdmin: false,
      canImport: true,
      canExport: true,
    })

    expect(reply.text).toContain("Listas de Precios")
    expect(reply.text).toContain("comparar menudeo contra mayoreo")
  })

  it("does not recommend Nexo administration to normal users", () => {
    const reply = buildAssistantReply({
      input: "ayuda",
      pathname: "/dashboard",
      isNexoAdmin: false,
      canImport: true,
      canExport: true,
    })

    const text = [reply.text, ...reply.suggestions.map((suggestion) => suggestion.label)].join(" ")
    expect(text).not.toMatch(/Panel Nexo|Administración Nexo|Crear empresa|Configurar permisos/i)
  })

  it("does recommend Nexo administration to authorized Nexo admins", () => {
    const reply = buildAssistantReply({
      input: "ayuda",
      pathname: "/admin/tenants",
      isNexoAdmin: true,
      canImport: true,
      canExport: true,
    })

    expect(reply.text).toContain("Empresas")
    expect(reply.suggestions.map((suggestion) => suggestion.label)).toContain("Crear empresa")
    expect(reply.suggestions.map((suggestion) => suggestion.label)).toContain("Ver auditoría global")
  })

  it("maps natural language intents to allowed module actions", () => {
    const reply = buildAssistantReply({
      input: "quiero importar clientes",
      pathname: "/dashboard/clients",
      isNexoAdmin: false,
      canImport: true,
      canExport: false,
    })

    expect(reply.text).toContain("Centro de Importación")
    expect(reply.suggestions.map((suggestion) => suggestion.href)).toContain("/dashboard/import")
  })

  it("omits actions when the user lacks permission", () => {
    const reply = buildAssistantReply({
      input: "quiero exportar",
      pathname: "/dashboard/clients",
      isNexoAdmin: false,
      canImport: false,
      canExport: false,
    })

    expect(reply.text).toContain("No tienes permiso")
    expect(reply.suggestions).toHaveLength(0)
  })

  it("keeps Spanish as the default visible language", () => {
    const reply = buildAssistantReply({
      input: "que puedo hacer aqui",
      pathname: "/dashboard",
      isNexoAdmin: false,
      canImport: false,
      canExport: false,
    })

    expect(reply.text).toContain("Estás en el Panel de Control")
    expect(reply.text).not.toMatch(/tenant|sandbox|mock|Control Plane/i)
  })
})
