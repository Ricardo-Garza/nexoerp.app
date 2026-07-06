"use client"

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit as fsLimit,
  serverTimestamp,
} from "firebase/firestore"
import { getFirebaseDb } from "@/lib/firebase"
import { getAuthMode } from "@/lib/config/auth-mode"
import type { AuditRecord, ImportRun, SupportTicket, Tenant } from "./types"
import { SEED_TENANTS, findSeedTenant } from "./seed-tenants"

/**
 * Capa de persistencia del Control Plane. Doble adaptador tras una sola API:
 *
 *  - modo "firebase" (producción/preview): Firestore real, colecciones
 *    `tenants/{id}`, `tenants/{id}/auditEvents`, `tenants/{id}/imports`,
 *    `platform_support`. Es el MISMO patrón client-side que ya persiste en
 *    producción para los módulos legacy, por lo que no depende del Admin SDK.
 *  - modo "demo" (local/CI/E2E sin credenciales): localStorage. Permite validar
 *    toda la UI con Playwright sin tocar datos reales.
 *
 * El seed es idempotente en ambos modos (upsert por id).
 */

const LS_TENANTS = "nexo_tenants"
const LS_AUDIT = "nexo_audit"
const LS_IMPORTS = "nexo_imports"
const LS_SUPPORT = "nexo_support"

function isDemo(): boolean {
  return getAuthMode() === "demo"
}

function lsRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function lsWrite<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* almacenamiento lleno o bloqueado: se ignora en demo */
  }
}

/** Siembra idempotente de los tenants fundacionales. */
export async function ensureTenantsSeeded(): Promise<void> {
  if (isDemo()) {
    const existing = lsRead<Tenant[]>(LS_TENANTS, [])
    const byId = new Map(existing.map((t) => [t.id, t]))
    for (const seed of SEED_TENANTS) if (!byId.has(seed.id)) byId.set(seed.id, seed)
    lsWrite(LS_TENANTS, [...byId.values()])
    return
  }
  const db = getFirebaseDb()
  for (const seed of SEED_TENANTS) {
    const ref = doc(db, "tenants", seed.id)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, { ...seed, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    }
  }
}

export async function listTenants(): Promise<Tenant[]> {
  if (isDemo()) {
    const list = lsRead<Tenant[]>(LS_TENANTS, [])
    return list.length ? list : SEED_TENANTS
  }
  const db = getFirebaseDb()
  const snap = await getDocs(collection(db, "tenants"))
  if (snap.empty) return SEED_TENANTS
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Tenant, "id">) }))
}

export async function getTenant(id: string): Promise<Tenant | null> {
  if (isDemo()) {
    const list = lsRead<Tenant[]>(LS_TENANTS, SEED_TENANTS)
    return list.find((t) => t.id === id) ?? findSeedTenant(id) ?? null
  }
  const db = getFirebaseDb()
  const snap = await getDoc(doc(db, "tenants", id))
  if (!snap.exists()) return findSeedTenant(id) ?? null
  return { id: snap.id, ...(snap.data() as Omit<Tenant, "id">) }
}

export async function saveTenant(tenant: Tenant): Promise<Tenant> {
  const updated = { ...tenant, updatedAt: new Date().toISOString() }
  if (isDemo()) {
    const list = lsRead<Tenant[]>(LS_TENANTS, SEED_TENANTS)
    const idx = list.findIndex((t) => t.id === tenant.id)
    if (idx >= 0) list[idx] = updated
    else list.push(updated)
    lsWrite(LS_TENANTS, list)
    return updated
  }
  const db = getFirebaseDb()
  await setDoc(doc(db, "tenants", tenant.id), { ...updated, updatedAt: serverTimestamp() }, { merge: true })
  return updated
}

export function makeTenantId(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 32)
  return `org-${slug || Math.random().toString(36).slice(2, 8)}`
}

// -------------------------------------------------------------------------
// Auditoría por tenant
// -------------------------------------------------------------------------

export async function appendAudit(record: Omit<AuditRecord, "id" | "at"> & { at?: string }): Promise<AuditRecord> {
  const full: AuditRecord = {
    ...record,
    id: `aud-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    at: record.at ?? new Date().toISOString(),
  }
  if (isDemo()) {
    const list = lsRead<AuditRecord[]>(LS_AUDIT, [])
    list.push(full)
    lsWrite(LS_AUDIT, list.slice(-500))
    return full
  }
  const db = getFirebaseDb()
  await setDoc(doc(db, "tenants", record.tenantId, "auditEvents", full.id), {
    ...full,
    at: serverTimestamp(),
  })
  return full
}

export async function listAudit(tenantId: string | null, max = 100): Promise<AuditRecord[]> {
  if (isDemo()) {
    const list = lsRead<AuditRecord[]>(LS_AUDIT, [])
    return list
      .filter((a) => !tenantId || a.tenantId === tenantId)
      .sort((a, b) => (a.at < b.at ? 1 : -1))
      .slice(0, max)
  }
  const db = getFirebaseDb()
  if (!tenantId) return []
  const q = query(collection(db, "tenants", tenantId, "auditEvents"), orderBy("at", "desc"), fsLimit(max))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AuditRecord, "id">) }))
}

// -------------------------------------------------------------------------
// Corridas de importación
// -------------------------------------------------------------------------

export async function appendImportRun(run: Omit<ImportRun, "id" | "at"> & { at?: string }): Promise<ImportRun> {
  const full: ImportRun = {
    ...run,
    id: `imp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    at: run.at ?? new Date().toISOString(),
  }
  if (isDemo()) {
    const list = lsRead<ImportRun[]>(LS_IMPORTS, [])
    list.push(full)
    lsWrite(LS_IMPORTS, list.slice(-200))
    return full
  }
  const db = getFirebaseDb()
  await setDoc(doc(db, "tenants", run.tenantId, "imports", full.id), { ...full, at: serverTimestamp() })
  return full
}

export async function listImportRuns(tenantId: string | null, max = 50): Promise<ImportRun[]> {
  if (isDemo()) {
    const list = lsRead<ImportRun[]>(LS_IMPORTS, [])
    return list
      .filter((r) => !tenantId || r.tenantId === tenantId)
      .sort((a, b) => (a.at < b.at ? 1 : -1))
      .slice(0, max)
  }
  const db = getFirebaseDb()
  if (!tenantId) return []
  const q = query(collection(db, "tenants", tenantId, "imports"), orderBy("at", "desc"), fsLimit(max))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ImportRun, "id">) }))
}

// -------------------------------------------------------------------------
// Inserción masiva de datos por tenant (Centro de Importación)
// -------------------------------------------------------------------------

const LS_DATA_PREFIX = "nexo_data_"

/**
 * Persiste filas importadas en la colección del tenant.
 *  - firebase: `tenants/{tenantId}/{collection}` (batched setDoc)
 *  - demo: localStorage `nexo_data_{tenantId}_{collection}` (para que se vean en la app)
 * Devuelve cuántas filas se escribieron.
 */
export async function bulkInsert(
  tenantId: string,
  collectionName: string,
  rows: Record<string, unknown>[],
): Promise<number> {
  if (rows.length === 0) return 0
  if (isDemo()) {
    const key = `${LS_DATA_PREFIX}${tenantId}_${collectionName}`
    const existing = lsRead<Record<string, unknown>[]>(key, [])
    const stamped = rows.map((r, i) => ({
      id: `imp-${Date.now().toString(36)}-${i}`,
      tenantId,
      ...r,
      createdAt: new Date().toISOString(),
    }))
    lsWrite(key, [...existing, ...stamped])
    return stamped.length
  }
  const db = getFirebaseDb()
  let written = 0
  for (const r of rows) {
    const ref = doc(collection(db, "tenants", tenantId, collectionName))
    await setDoc(ref, { ...r, tenantId, createdAt: serverTimestamp() })
    written++
  }
  return written
}

export function readImportedData(tenantId: string, collectionName: string): Record<string, unknown>[] {
  return lsRead<Record<string, unknown>[]>(`${LS_DATA_PREFIX}${tenantId}_${collectionName}`, [])
}

// -------------------------------------------------------------------------
// Tickets de soporte a Nexo
// -------------------------------------------------------------------------

export async function appendSupportTicket(t: Omit<SupportTicket, "id" | "at"> & { at?: string }): Promise<SupportTicket> {
  const full: SupportTicket = {
    ...t,
    id: `tkt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    at: t.at ?? new Date().toISOString(),
  }
  if (isDemo()) {
    const list = lsRead<SupportTicket[]>(LS_SUPPORT, [])
    list.push(full)
    lsWrite(LS_SUPPORT, list.slice(-200))
    return full
  }
  const db = getFirebaseDb()
  await setDoc(doc(db, "platform_support", full.id), { ...full, at: serverTimestamp() })
  return full
}

export async function listSupportTickets(max = 50): Promise<SupportTicket[]> {
  if (isDemo()) {
    return lsRead<SupportTicket[]>(LS_SUPPORT, [])
      .sort((a, b) => (a.at < b.at ? 1 : -1))
      .slice(0, max)
  }
  const db = getFirebaseDb()
  const q = query(collection(db, "platform_support"), orderBy("at", "desc"), fsLimit(max))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SupportTicket, "id">) }))
}
