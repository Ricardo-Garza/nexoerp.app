import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest"
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing"
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore"

/**
 * Pruebas de comportamiento de firestore.rules con el emulador de Firestore.
 * Ejecutar: npm run test:rules  (levanta el emulador con `firebase emulators:exec`).
 *
 *  Empresa A: A1 (miembro por PERFIL), A2 (administrador por CLAIM)
 *  Empresa B: B1 (miembro por perfil)
 *  Plataforma: OPS (claim platformAdmin), IMPOSTOR (correo operaciones@nexo.com SIN claim)
 */
let env: RulesTestEnvironment

const asA1 = () => env.authenticatedContext("uid-a1", { email: "a1@a.test" }).firestore()
const asA2Admin = () => env.authenticatedContext("uid-a2", { email: "a2@a.test", companyId: "org-a", tenantRole: "admin" }).firestore()
const asB1 = () => env.authenticatedContext("uid-b1", { email: "b1@b.test" }).firestore()
const asOps = () => env.authenticatedContext("uid-ops", { email: "operaciones@nexo.com", platformAdmin: true }).firestore()
const asImpostor = () => env.authenticatedContext("uid-impostor", { email: "operaciones@nexo.com", email_verified: true }).firestore()
const asSupport = () => env.authenticatedContext("uid-support", { email: "soporte@nexo.test", platformSupport: true }).firestore()
const asSolo = () => env.authenticatedContext("uid-solo", { email: "solo@x.test" }).firestore()
const anon = () => env.unauthenticatedContext().firestore()

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-nexo-rules",
    firestore: { rules: readFileSync(resolve(process.env.RULES_FILE ?? resolve(process.cwd(), "firestore.rules")), "utf8") },
  })
})

afterAll(async () => {
  await env.cleanup()
})

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, "users/uid-a1"), { email: "a1@a.test", name: "A1", role: "user", companyId: "org-a" })
    await setDoc(doc(db, "users/uid-a2"), { email: "a2@a.test", name: "A2", role: "admin", companyId: "org-a" })
    await setDoc(doc(db, "users/uid-b1"), { email: "b1@b.test", name: "B1", role: "user", companyId: "org-b" })
    await setDoc(doc(db, "users/uid-ops"), { email: "operaciones@nexo.com", name: "Ops", role: "user" })
    await setDoc(doc(db, "tenants/org-a"), { name: "Empresa A", modules: ["dashboard", "sales"], ui: { theme: "light" } })
    await setDoc(doc(db, "tenants/org-b"), { name: "Empresa B", modules: ["dashboard"], ui: { theme: "dark" } })
    await setDoc(doc(db, "tenants/org-a/products/p1"), { tenantId: "org-a", name: "Cable A" })
    await setDoc(doc(db, "tenants/org-b/products/p2"), { tenantId: "org-b", name: "Cable B" })
    await setDoc(doc(db, "tenants/org-a/auditEvents/e1"), { tenantId: "org-a", action: "x" })
    await setDoc(doc(db, "customers/c-a1"), { companyId: "org-a", userId: "uid-a1", name: "Cliente A1" })
    await setDoc(doc(db, "customers/c-a2"), { companyId: "org-a", userId: "uid-a2", name: "Cliente A2" })
    await setDoc(doc(db, "customers/c-b1"), { companyId: "org-b", userId: "uid-b1", name: "Cliente B1" })
    await setDoc(doc(db, "salesOrders/o-b1"), { companyId: "org-b", userId: "uid-b1", total: 100 })
    await setDoc(doc(db, "accountsReceivable/ar-b1"), { companyId: "org-b", userId: "uid-b1", amount: 5 })
    await setDoc(doc(db, "companies/org-b"), { userId: "uid-b1", name: "B SA" })
    await setDoc(doc(db, "platform_meta/releases"), { latest: "1.0.0" })
  })
})

describe("1. Usuario no autenticado: acceso denegado", () => {
  it("no lee ni escribe en ninguna colección", async () => {
    const db = anon()
    await assertFails(getDoc(doc(db, "users/uid-a1")))
    await assertFails(getDoc(doc(db, "tenants/org-a")))
    await assertFails(getDocs(collection(db, "tenants")))
    await assertFails(getDoc(doc(db, "customers/c-a1")))
    await assertFails(getDoc(doc(db, "tenants/org-a/products/p1")))
    await assertFails(getDoc(doc(db, "platform_meta/releases")))
    await assertFails(setDoc(doc(db, "customers/nuevo"), { userId: "x", companyId: "org-a" }))
    await assertFails(addDoc(collection(db, "platform_support"), { subject: "hola" }))
  })

  it("solo la landing puede crear solicitudes de demo (acotadas) y nadie las lee", async () => {
    await assertSucceeds(addDoc(collection(anon(), "demo_requests"), { name: "Visitante", email: "v@x.test" }))
    await assertFails(addDoc(collection(anon(), "demo_requests"), Object.fromEntries(Array.from({ length: 25 }, (_, i) => [`k${i}`, i]))))
    await assertFails(getDocs(collection(anon(), "demo_requests")))
    await assertFails(getDocs(collection(asA2Admin(), "demo_requests")))
  })
})

describe("2. Usuario de empresa A: accede a los datos autorizados de A", () => {
  it("lee su empresa, sus productos y sus clientes (consulta por companyId)", async () => {
    const db = asA1()
    await assertSucceeds(getDoc(doc(db, "tenants/org-a")))
    await assertSucceeds(getDoc(doc(db, "tenants/org-a/products/p1")))
    await assertSucceeds(getDocs(collection(db, "tenants/org-a/products")))
    await assertSucceeds(getDocs(query(collection(db, "customers"), where("companyId", "==", "org-a"))))
    await assertSucceeds(getDoc(doc(db, "customers/c-a2"))) // compañero de la misma empresa
    await assertSucceeds(getDoc(doc(db, "users/uid-a2")))
  })

  it("opera como autor dentro de su empresa (alta, edición, baja) y con sus preferencias", async () => {
    const db = asA1()
    await assertSucceeds(setDoc(doc(db, "customers/nuevo"), { companyId: "org-a", userId: "uid-a1", name: "Nuevo" }))
    await assertSucceeds(updateDoc(doc(db, "customers/c-a1"), { name: "Renombrado" }))
    await assertSucceeds(deleteDoc(doc(db, "customers/nuevo")))
    await assertSucceeds(setDoc(doc(db, "users/uid-a1/preferences/tablas"), { density: "compact" }))
    await assertSucceeds(setDoc(doc(db, "tenants/org-a/products/p3"), { tenantId: "org-a", name: "Otro" }))
    await assertSucceeds(addDoc(collection(db, "tenants/org-a/auditEvents"), { tenantId: "org-a", action: "login" }))
  })

  it("el primer ingreso crea un perfil sin privilegios y puede editar sus datos personales", async () => {
    const db = env.authenticatedContext("uid-nuevo", { email: "nuevo@x.test" }).firestore()
    await assertSucceeds(setDoc(doc(db, "users/uid-nuevo"), { email: "nuevo@x.test", name: "nuevo", role: "user", createdAt: new Date(), updatedAt: new Date() }))
    await assertSucceeds(updateDoc(doc(db, "users/uid-nuevo"), { name: "Nuevo Nombre", updatedAt: new Date() }))
  })

  it("una cuenta unipersonal (companyId = uid) conserva sus datos", async () => {
    const db = asSolo()
    await assertSucceeds(setDoc(doc(db, "products/s1"), { companyId: "uid-solo", userId: "uid-solo", name: "Mío" }))
    await assertSucceeds(getDocs(query(collection(db, "products"), where("companyId", "==", "uid-solo"))))
    await assertSucceeds(getDocs(query(collection(db, "products"), where("userId", "==", "uid-solo"))))
  })

  it("cualquier usuario autenticado puede abrir un ticket de soporte para su empresa", async () => {
    await assertSucceeds(addDoc(collection(asA1(), "platform_support"), { tenantId: "org-a", subject: "ayuda" }))
    await assertFails(addDoc(collection(asA1(), "platform_support"), { tenantId: "org-b", subject: "ajeno" }))
    await assertFails(getDocs(collection(asA1(), "platform_support")))
  })
})

describe("3. Usuario de empresa A: acceso a la empresa B denegado", () => {
  it("no lee ni consulta datos de B (documentos, subcolecciones, consultas)", async () => {
    const db = asA1()
    await assertFails(getDoc(doc(db, "tenants/org-b")))
    await assertFails(getDoc(doc(db, "tenants/org-b/products/p2")))
    await assertFails(getDocs(collection(db, "tenants/org-b/products")))
    await assertFails(getDoc(doc(db, "customers/c-b1")))
    await assertFails(getDoc(doc(db, "salesOrders/o-b1")))
    await assertFails(getDoc(doc(db, "accountsReceivable/ar-b1")))
    await assertFails(getDoc(doc(db, "companies/org-b")))
    await assertFails(getDoc(doc(db, "users/uid-b1")))
    await assertFails(getDocs(query(collection(db, "customers"), where("companyId", "==", "org-b"))))
    await assertFails(getDocs(collection(db, "customers"))) // consulta sin filtro de empresa
    await assertFails(getDocs(collection(db, "tenants"))) // el selector de empresas es solo de plataforma
  })

  it("no escribe en B ni mueve documentos de empresa", async () => {
    const db = asA1()
    await assertFails(setDoc(doc(db, "tenants/org-b/products/pX"), { tenantId: "org-b" }))
    await assertFails(setDoc(doc(db, "customers/robo"), { companyId: "org-b", userId: "uid-a1" }))
    await assertFails(updateDoc(doc(db, "customers/c-b1"), { name: "hackeado" }))
    await assertFails(deleteDoc(doc(db, "customers/c-b1")))
    await assertFails(updateDoc(doc(db, "customers/c-a1"), { companyId: "org-b" })) // no cambia de empresa
    await assertFails(setDoc(doc(db, "tenants/org-a/products/pY"), { tenantId: "org-b" })) // marca de empresa falsa
  })

  it("un tenantId manipulado en el cliente no abre nada: la empresa sale del claim/perfil, no del cliente", async () => {
    await assertFails(getDocs(collection(asB1(), "tenants/org-a/products")))
    await assertFails(getDoc(doc(asB1(), "tenants/org-a")))
  })
})

describe("4. Administrador de empresa: permisos administrativos solo dentro de su empresa", () => {
  it("edita la apariencia de su empresa, pero no módulos, versión ni otras empresas", async () => {
    const db = asA2Admin()
    await assertSucceeds(updateDoc(doc(db, "tenants/org-a"), { ui: { theme: "dark" }, updatedAt: new Date() }))
    await assertFails(updateDoc(doc(db, "tenants/org-a"), { modules: ["dashboard", "payroll", "accounting"] }))
    await assertFails(updateDoc(doc(db, "tenants/org-b"), { ui: { theme: "dark" } }))
    await assertFails(setDoc(doc(db, "tenants/org-nueva"), { name: "Nueva" }))
    await assertFails(deleteDoc(doc(db, "tenants/org-a")))
  })

  it("administra a los miembros de su empresa, sin tocar claims ni empresas ajenas", async () => {
    const db = asA2Admin()
    await assertSucceeds(updateDoc(doc(db, "users/uid-a1"), { role: "admin", updatedAt: new Date() }))
    await assertFails(updateDoc(doc(db, "users/uid-a1"), { role: "platform_admin" }))
    await assertFails(updateDoc(doc(db, "users/uid-a1"), { companyId: "org-b" }))
    await assertFails(updateDoc(doc(db, "users/uid-a1"), { platformAdmin: true }))
    await assertFails(updateDoc(doc(db, "users/uid-b1"), { role: "user", name: "ajeno" }))
    await assertFails(deleteDoc(doc(db, "users/uid-b1")))
    await assertSucceeds(deleteDoc(doc(db, "users/uid-a1")))
  })

  it("gestiona documentos de su empresa de otros autores, no de otras empresas; auditoría solo se agrega", async () => {
    const db = asA2Admin()
    await assertSucceeds(updateDoc(doc(db, "customers/c-a1"), { name: "Editado por admin" }))
    await assertSucceeds(deleteDoc(doc(db, "customers/c-a1")))
    await assertFails(updateDoc(doc(db, "customers/c-b1"), { name: "x" }))
    await assertSucceeds(getDocs(collection(db, "tenants/org-a/auditEvents")))
    await assertFails(updateDoc(doc(db, "tenants/org-a/auditEvents/e1"), { action: "borrado" }))
    await assertFails(deleteDoc(doc(db, "tenants/org-a/auditEvents/e1")))
  })

  it("un usuario sin rol de administrador no administra a otros", async () => {
    const db = asA1()
    await assertFails(updateDoc(doc(db, "users/uid-a2"), { name: "x" }))
    await assertFails(updateDoc(doc(db, "tenants/org-a"), { ui: { theme: "dark" } }))
    await assertFails(getDocs(collection(db, "tenants/org-a/auditEvents")))
  })
})

describe("5. Platform Admin: permisos de plataforma definidos y auditables", () => {
  it("con el claim platformAdmin lista y administra todas las empresas", async () => {
    const db = asOps()
    await assertSucceeds(getDocs(collection(db, "tenants")))
    await assertSucceeds(getDoc(doc(db, "tenants/org-b")))
    await assertSucceeds(setDoc(doc(db, "tenants/org-nueva"), { name: "Nueva", modules: [] }))
    await assertSucceeds(updateDoc(doc(db, "tenants/org-b"), { modules: ["dashboard", "sales"] }))
    await assertSucceeds(getDocs(collection(db, "tenants/org-b/products")))
    await assertSucceeds(getDocs(query(collection(db, "customers"), where("companyId", "==", "org-b"))))
    await assertSucceeds(setDoc(doc(db, "platform_meta/releases"), { latest: "1.1.0" }))
  })

  it("deja huella auditable: la bitácora de plataforma solo se agrega y solo la lee la plataforma", async () => {
    const db = asOps()
    await assertSucceeds(setDoc(doc(db, "platform_audit/a1"), { actorUid: "uid-ops", action: "tenant.switch", tenantId: "org-b" }))
    await assertFails(setDoc(doc(db, "platform_audit/a2"), { actorUid: "otro-uid", action: "falsificada" })) // no suplanta a otro actor
    await assertFails(updateDoc(doc(db, "platform_audit/a1"), { action: "editada" }))
    await assertFails(deleteDoc(doc(db, "platform_audit/a1")))
    await assertSucceeds(getDoc(doc(db, "platform_audit/a1")))
    await assertFails(getDoc(doc(asA2Admin(), "platform_audit/a1")))
  })

  it("el soporte de plataforma (claim platformSupport) solo lee; no escribe ni lee datos de negocio", async () => {
    const db = asSupport()
    await assertSucceeds(getDoc(doc(db, "tenants/org-a")))
    await assertSucceeds(getDocs(collection(db, "platform_support")))
    await assertFails(updateDoc(doc(db, "tenants/org-a"), { modules: [] }))
    await assertFails(getDoc(doc(db, "customers/c-a1")))
  })

  it("el CORREO operaciones@nexo.com sin el claim NO concede ningún privilegio de plataforma", async () => {
    const db = asImpostor()
    await assertFails(getDocs(collection(db, "tenants")))
    await assertFails(getDoc(doc(db, "tenants/org-a")))
    await assertFails(setDoc(doc(db, "tenants/org-robada"), { name: "x" }))
    await assertFails(getDoc(doc(db, "customers/c-a1")))
    await assertFails(setDoc(doc(db, "platform_meta/releases"), { latest: "9" }))
    await assertFails(getDocs(collection(db, "demo_requests")))
    await assertFails(getDoc(doc(db, "platform_audit/a1")))
  })

  it("un claim falso como cadena o un campo del perfil tampoco conceden acceso", async () => {
    const texto = env.authenticatedContext("uid-x", { platformAdmin: "true" }).firestore()
    await assertFails(getDoc(doc(texto, "tenants/org-a")))
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/uid-y"), { email: "y@y.test", platformAdmin: true, role: "admin", platformRole: "platform_admin" })
    })
    await assertFails(getDoc(doc(env.authenticatedContext("uid-y", { email: "y@y.test" }).firestore(), "tenants/org-a")))
  })
})

describe("6. Nadie puede escalar privilegios modificando su propio perfil", () => {
  it("no cambia su rol, su empresa ni campos de plataforma", async () => {
    const db = asA1()
    await assertFails(updateDoc(doc(db, "users/uid-a1"), { role: "admin" }))
    await assertFails(updateDoc(doc(db, "users/uid-a1"), { companyId: "org-b" }))
    await assertFails(updateDoc(doc(db, "users/uid-a1"), { platformAdmin: true }))
    await assertFails(updateDoc(doc(db, "users/uid-a1"), { platformRole: "platform_admin" }))
    await assertFails(updateDoc(doc(db, "users/uid-a1"), { name: "ok", role: "admin" })) // mezcla campo permitido con uno prohibido
    await assertSucceeds(updateDoc(doc(db, "users/uid-a1"), { name: "Nombre válido", updatedAt: new Date() }))
  })

  it("un administrador de empresa tampoco se eleva a sí mismo a plataforma ni cambia de empresa", async () => {
    const db = asA2Admin()
    await assertFails(updateDoc(doc(db, "users/uid-a2"), { role: "admin", companyId: "org-b" }))
    await assertFails(updateDoc(doc(db, "users/uid-a2"), { platformAdmin: true }))
  })

  it("al darse de alta no puede crear un perfil privilegiado ni asignarse empresa", async () => {
    const db = env.authenticatedContext("uid-nuevo2", { email: "nuevo2@x.test" }).firestore()
    await assertFails(setDoc(doc(db, "users/uid-nuevo2"), { email: "nuevo2@x.test", role: "admin" }))
    await assertFails(setDoc(doc(db, "users/uid-nuevo2"), { email: "nuevo2@x.test", role: "user", companyId: "org-b" }))
    await assertFails(setDoc(doc(db, "users/uid-nuevo2"), { email: "nuevo2@x.test", role: "user", platformAdmin: true }))
    await assertFails(setDoc(doc(db, "users/uid-nuevo2"), { email: "otro@x.test", role: "user" })) // correo distinto al del token
    await assertFails(setDoc(doc(db, "users/uid-ajeno"), { email: "nuevo2@x.test", role: "user" })) // perfil de otro uid
  })
})

describe("7. Nadie puede concederse roles globales", () => {
  it("un usuario normal no escribe en colecciones de plataforma ni crea empresas", async () => {
    for (const db of [asA1(), asA2Admin(), asB1(), asImpostor()]) {
      await assertFails(setDoc(doc(db, "platform_meta/releases"), { latest: "9.9.9" }))
      await assertFails(setDoc(doc(db, "platform_audit/x"), { actorUid: "u" }))
      await assertFails(setDoc(doc(db, "tenants/org-pwn"), { name: "pwn" }))
      await assertFails(setDoc(doc(db, "users/uid-ops"), { role: "admin", email: "operaciones@nexo.com" }))
      await assertFails(updateDoc(doc(db, "users/uid-ops"), { name: "tomada" }))
    }
  })

  it("tampoco usa colecciones comodín ni la squatting de empresas para saltarse el aislamiento", async () => {
    const db = asA1()
    await assertFails(setDoc(doc(db, "companies/org-soleilwire"), { userId: "uid-a1" })) // no reclama IDs de empresa ajenos
    await assertFails(getDoc(doc(db, "companies/org-b")))
    await assertSucceeds(setDoc(doc(db, "companies/uid-a1"), { userId: "uid-a1", name: "Mía" }))
  })
})
