import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

/**
 * Prueba estructural de firestore.rules: verifica que las cláusulas de seguridad
 * críticas del aislamiento por tenant existen y no se borran por accidente.
 * (Las pruebas de comportamiento completas requieren el emulador de Firestore;
 * ver docs/FIRESTORE_RULES_SECURITY.md.)
 */
const rules = readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8")

describe("firestore.rules — aislamiento multi-tenant", () => {
  it("niega todo por defecto", () => {
    expect(rules).toMatch(/match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;/)
  })

  it("define el admin de plataforma por email operaciones@nexo.com", () => {
    expect(rules).toContain("operaciones@nexo.com")
    expect(rules).toMatch(/function isPlatformAdmin\(\)/)
  })

  it("resuelve el tenant del usuario por su perfil", () => {
    expect(rules).toMatch(/function belongsToTenant\(tenantId\)/)
    expect(rules).toMatch(/function userTenantId\(\)/)
  })

  it("aísla el subárbol de datos del tenant", () => {
    expect(rules).toMatch(/match \/tenants\/\{tenantId\}/)
    expect(rules).toMatch(/match \/\{sub=\*\*\}\s*\{\s*allow read: if belongsToTenant\(tenantId\)/)
  })

  it("protege la escritura de tenants solo para plataforma", () => {
    expect(rules).toMatch(/allow create, update, delete: if isPlatformAdmin\(\);/)
  })

  it("permite crear tickets de soporte pero gestionarlos solo plataforma", () => {
    expect(rules).toMatch(/match \/platform_support\/\{ticketId\}/)
  })
})
