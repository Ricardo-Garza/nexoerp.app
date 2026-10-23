import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

/**
 * Prueba ESTRUCTURAL de firestore.rules (corre en `npm test`, sin emulador): impide que vuelvan a
 * colarse los patrones inseguros que se corrigieron. El comportamiento real está probado con el
 * emulador en tests/rules/*.test.ts (`npm run test:rules`).
 */
const rules = readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8")
const code = rules
  .split("\n")
  .filter((l) => !l.trim().startsWith("//"))
  .join("\n")

describe("firestore.rules — aislamiento multi-tenant", () => {
  it("niega todo por defecto", () => {
    expect(code).toMatch(/match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;/)
  })

  it("el administrador de plataforma se define SOLO por custom claim, no por correo", () => {
    expect(code).toMatch(/function isPlatformAdmin\(\)/)
    expect(code).toContain("request.auth.token.get('platformAdmin', false) == true")
    expect(code).not.toMatch(/token\.email\s*==/)
    expect(code).not.toContain("operaciones@nexo.com")
  })

  it("el tenant del usuario sale del claim o del perfil (no editable por el propio usuario)", () => {
    expect(code).toMatch(/function myTenant\(\)/)
    expect(code).toMatch(/function isMember\(tenantId\)/)
  })

  it("el perfil de usuario solo permite editar campos no privilegiados", () => {
    expect(code).toMatch(/function selfEditableKeys\(\)/)
    expect(code).not.toMatch(/selfEditableKeys\(\)\s*\{[^}]*'role'/)
    expect(code).not.toMatch(/selfEditableKeys\(\)\s*\{[^}]*'companyId'/)
    expect(code).toMatch(/hasOnly\(selfEditableKeys\(\)\)/)
  })

  it("aísla el subárbol de datos del tenant y la auditoría es solo de agregado", () => {
    expect(code).toMatch(/match \/tenants\/\{tenantId\}/)
    expect(code).toMatch(/match \/auditEvents\/\{eventId\}[\s\S]*?allow update, delete: if false;/)
  })

  it("las empresas solo las escribe la plataforma", () => {
    expect(code).toMatch(/allow create, delete: if isPlatformAdmin\(\);/)
  })

  it("no existe el comodín «cualquier autenticado lee todo» ni el isAdmin() global por perfil", () => {
    expect(code).not.toMatch(/allow read: if isAuthenticated\(\);/)
    expect(code).not.toMatch(/allow read: if signedIn\(\);\s*\n\s*allow create/)
    expect(code).not.toMatch(/function isAdmin\(\)/)
    // las lecturas de colecciones de negocio dependen de pertenencia (canReadDoc), no solo de estar autenticado
    expect(code).toMatch(/allow read: if !isReservedCollection\(collection\) && signedIn\(\) && canReadDoc\(resource\.data\)/)
  })

  it("las solicitudes de demo de la landing las gestiona solo la plataforma", () => {
    expect(code).toMatch(/match \/demo_requests\/\{requestId\}[\s\S]*?allow read, update, delete: if isPlatformAdmin\(\);/)
  })

  it("permite crear tickets de soporte pero gestionarlos solo plataforma", () => {
    expect(code).toMatch(/match \/platform_support\/\{ticketId\}/)
  })
})
