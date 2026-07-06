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

  it("guides users to table features for totals, filters and history questions", () => {
    const base = {
      pathname: "/dashboard/ventas/ordenes",
      isNexoAdmin: false,
      canImport: true,
      canExport: true,
    }

    expect(buildAssistantReply({ ...base, input: "sumar ventas" }).text).toContain("Totales")
    expect(buildAssistantReply({ ...base, input: "filtrar por fecha" }).text).toContain("Filtros")
    expect(buildAssistantReply({ ...base, input: "ver historial" }).text).toContain("Últimos cambios")
    expect(buildAssistantReply({ ...base, input: "guardar vista" }).text).toContain("Vista")
  })

  it("recognizes the payroll, banking and accounting screens", () => {
    const payroll = buildAssistantReply({
      input: "que puedo hacer aqui",
      pathname: "/dashboard/payroll",
      isNexoAdmin: false,
      canImport: true,
      canExport: true,
    })
    expect(payroll.text).toContain("Nómina")
    expect(payroll.suggestions.map((s) => s.label)).toContain("Importar empleados")

    const banking = buildAssistantReply({
      input: "ayuda",
      pathname: "/dashboard/banking",
      isNexoAdmin: false,
      canImport: false,
      canExport: false,
    })
    expect(banking.text).toContain("Bancos")
    expect(banking.suggestions.map((s) => s.label)).not.toContain("Importar movimientos")

    const accounting = buildAssistantReply({
      input: "ayuda",
      pathname: "/dashboard/accounting",
      isNexoAdmin: false,
      canImport: true,
      canExport: true,
    })
    expect(accounting.text).toContain("Contabilidad")
  })

  it("replies in English when the user prefers English", () => {
    const reply = buildAssistantReply({
      input: "what can i do",
      pathname: "/dashboard/payroll",
      isNexoAdmin: false,
      canImport: true,
      canExport: true,
      language: "en",
    })

    expect(reply.text).toContain("Payroll")
    expect(reply.text).not.toContain("Estás en")
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
