#!/usr/bin/env node
/**
 * Seed idempotente de Firebase/Firestore para Nexo ERP (REST, sin Admin SDK).
 *
 * Qué hace:
 *  - (opcional) crea/verifica el usuario Auth `operaciones@nexo.com` como admin de plataforma;
 *  - siembra los tenants fundacionales (DELAR, demo) en `tenants/{id}`;
 *  - siembra datos de ejemplo por tenant (clientes, productos);
 *  - deja un evento de auditoría inicial.
 *
 * Seguridad: NO hay contraseñas en el repo. Las credenciales se pasan por entorno:
 *   SEED_ADMIN_EMAIL=operaciones@nexo.com SEED_ADMIN_PASSWORD=... npm run seed:firebase
 * Si no se pasan, el script explica exactamente qué hacer y termina sin error.
 *
 * Idempotente: usa PATCH sobre document IDs deterministas (correr N veces = mismo estado).
 */

import fs from "node:fs"
import path from "node:path"

// --- Carga de variables de entorno (.env.local / .env) -------------------
function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const p = path.resolve(process.cwd(), file)
    if (!fs.existsSync(p)) continue
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
    }
  }
}
loadEnv()

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "operaciones@nexo.com"
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD

function fail(msg) {
  console.error(`\n❌ ${msg}\n`)
  process.exit(1)
}

if (!API_KEY || !PROJECT_ID) {
  console.log(`
⚠️  Firebase no está configurado en este entorno.

Define en .env.local (o en las variables del entorno):
  NEXT_PUBLIC_FIREBASE_API_KEY=...
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=nexoerp-88c6e
  (y el resto de NEXT_PUBLIC_FIREBASE_*)

Luego vuelve a ejecutar: npm run seed:firebase
`)
  process.exit(0)
}

const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`
const IDENTITY = `https://identitytoolkit.googleapis.com/v1`

// --- Conversión JS -> valores tipados de Firestore -----------------------
function toFsValue(v) {
  if (v === null || v === undefined) return { nullValue: null }
  if (typeof v === "boolean") return { booleanValue: v }
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }
  if (typeof v === "string") return { stringValue: v }
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFsValue) } }
  if (typeof v === "object") return { mapValue: { fields: toFsFields(v) } }
  return { stringValue: String(v) }
}
function toFsFields(obj) {
  const fields = {}
  for (const [k, val] of Object.entries(obj)) fields[k] = toFsValue(val)
  return fields
}

async function signIn() {
  if (!ADMIN_PASSWORD) return null
  // Intenta iniciar sesión; si el usuario no existe, intenta crearlo.
  const signInRes = await fetch(`${IDENTITY}/accounts:signInWithPassword?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, returnSecureToken: true }),
  })
  if (signInRes.ok) {
    const data = await signInRes.json()
    console.log(`✅ Sesión iniciada como ${ADMIN_EMAIL}`)
    return data
  }
  const signUpRes = await fetch(`${IDENTITY}/accounts:signUp?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, returnSecureToken: true }),
  })
  if (signUpRes.ok) {
    const data = await signUpRes.json()
    console.log(`✅ Usuario ${ADMIN_EMAIL} creado en Firebase Auth`)
    return data
  }
  const err = await signUpRes.json().catch(() => ({}))
  fail(`No se pudo autenticar ni crear ${ADMIN_EMAIL}: ${err?.error?.message || signUpRes.status}`)
}

async function patchDoc(idToken, collectionPath, docId, data) {
  const url = `${FS_BASE}/${collectionPath}/${docId}`
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ fields: toFsFields(data) }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`PATCH ${collectionPath}/${docId} → ${res.status} ${err?.error?.message || ""}`)
  }
}

const now = new Date().toISOString()

const TENANTS = [
  {
    id: "org-delar",
    name: "DELAR Foods",
    slug: "delar",
    status: "active",
    version: "1.0.0",
    primaryColor: "#e11d2a",
    rfc: "DFO850101XY0",
  },
  {
    id: "org-demo",
    name: "Prototipo Demo",
    slug: "demo",
    status: "trial",
    version: "0.1.0",
    primaryColor: "#2563eb",
    rfc: "XAXX010101000",
  },
]

const SAMPLE_CUSTOMERS = {
  "org-delar": [
    { nombre: "Restaurante El Fogón", rfc: "FOG850101AB1", email: "compras@elfogon.mx", estado: "activo" },
    { nombre: "Abarrotes La Moderna", rfc: "AMO900202CD2", email: "pedidos@lamoderna.mx", estado: "activo" },
  ],
  "org-demo": [{ nombre: "Cliente Demo 1", rfc: "XAXX010101000", email: "demo@demo.mx", estado: "prospecto" }],
}

async function main() {
  console.log(`\n🌱 Seed Firebase — proyecto ${PROJECT_ID}\n`)
  const session = await signIn()
  const idToken = session?.idToken || null
  const uid = session?.localId || null

  if (!idToken) {
    console.log(`
⚠️  No se proporcionó SEED_ADMIN_PASSWORD, así que no se escribirá en Firestore
   (las reglas exigen sesión autenticada) ni se creará el usuario Auth.

Para sembrar de forma segura, ejecuta:

  SEED_ADMIN_EMAIL=operaciones@nexo.com \\
  SEED_ADMIN_PASSWORD='<contraseña-segura>' \\
  npm run seed:firebase

Esto:
  1) crea/verifica el usuario Auth operaciones@nexo.com;
  2) siembra tenants y datos de ejemplo en Firestore;
  3) es idempotente (puedes repetirlo sin duplicar).

Nota: el rol de administrador de plataforma se reconoce por el email
operaciones@nexo.com (allowlist en lib/platform/platform-admin.ts) y, si quieres
reforzarlo, por un custom claim { platformAdmin: true } vía Admin SDK/consola.
`)
    process.exit(0)
  }

  // Perfil del admin de plataforma
  if (uid) {
    await patchDoc(idToken, "users", uid, {
      email: ADMIN_EMAIL,
      name: "Operaciones Nexo",
      role: "admin",
      platformRole: "platform_admin",
      companyId: "org-delar",
      updatedAt: now,
    })
    console.log(`✅ Perfil de plataforma escrito para ${ADMIN_EMAIL}`)
  }

  // Tenants
  for (const t of TENANTS) {
    await patchDoc(idToken, "tenants", t.id, {
      name: t.name,
      slug: t.slug,
      status: t.status,
      version: t.version,
      branding: { logoText: t.name, primaryColor: t.primaryColor, theme: "system" },
      fiscal: { legalName: t.name, rfc: t.rfc, regime: "601", address: "", pac: "mock" },
      crm: { enabled: t.id === "org-delar", baseUrl: "https://crm-momentum.vercel.app", mode: "sandbox", masterSource: "nexo", modules: [] },
      seededAt: now,
      updatedAt: now,
    })
    console.log(`✅ Tenant sembrado: ${t.name} (${t.id})`)

    // Clientes de ejemplo (id determinista → idempotente)
    const customers = SAMPLE_CUSTOMERS[t.id] || []
    for (let i = 0; i < customers.length; i++) {
      const c = customers[i]
      await patchDoc(idToken, `tenants/${t.id}/customers`, `seed-cust-${i + 1}`, { ...c, tenantId: t.id, createdAt: now })
    }
    if (customers.length) console.log(`   • ${customers.length} clientes de ejemplo`)

    // Auditoría inicial
    await patchDoc(idToken, `tenants/${t.id}/auditEvents`, "seed-initial", {
      tenantId: t.id,
      at: now,
      actorEmail: ADMIN_EMAIL,
      actorRole: "platform_admin",
      action: "tenant.seed",
      entityType: "Tenant",
      entityId: t.id,
      summary: `Seed inicial de ${t.name}`,
      source: "seed",
    })
  }

  console.log(`\n✅ Seed completado (idempotente). Entra con ${ADMIN_EMAIL} al Control Plane en /admin\n`)
}

main().catch((e) => fail(e.message))
