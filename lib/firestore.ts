"use client"

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  onSnapshot,
  serverTimestamp,
  type DocumentData,
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore"
import { getFirebaseDb, getAuth } from "./firebase"

// Collection names mapped to Firestore
export const COLLECTIONS = {
  companies: "companies",
  products: "products",
  customers: "customers",
  orders: "orders",
  suppliers: "suppliers",
  employees: "employees", // HR/Payroll
  payrollPeriods: "payrollPeriods",
  payrollConcepts: "payrollConcepts",
  payrollReceipts: "payrollReceipts",
  attendanceRecords: "attendanceRecords",
  vacationRequests: "vacationRequests",
  performanceReviews: "performanceReviews",
  invoices: "invoices",
  quotations: "quotations",
  prospects: "prospects",
  banks: "banks",
  documents: "documents",
  requisitions: "requisitions",
  attributes: "attributes",
  productAttributes: "productAttributes", // ProductAttribute
  categories: "categories", // ProductCategory
  productAttributeAssignments: "productAttributeAssignments", // ProductAttributeAssignment
  productVariants: "productVariants", // ProductVariant
  serviceOrders: "serviceOrders",
  users: "users",
  purchases: "purchases", // New: Track purchases and production costs
  expenses: "expenses", // New: Track operating expenses
  inventorySnapshots: "inventorySnapshots", // New: Monthly inventory snapshots
  bankAccounts: "bankAccounts", // New banking collections
  bankTransactions: "bankTransactions",
  checks: "checks",
  bankTransfers: "bankTransfers",
  bankStatements: "bankStatements",
  reconciliationItems: "reconciliationItems",
  leads: "leads",
  customerDocuments: "customerDocuments",
  accountsReceivable: "accountsReceivable",
  cfdi: "cfdi",
  supplierDocuments: "supplierDocuments",
  supplierProducts: "supplierProducts",
  purchaseOrders: "purchaseOrders",
  goodsReceipts: "goodsReceipts",
  accountsPayable: "accountsPayable",
  warehouses: "warehouses",
  inventoryStock: "inventoryStock",
  stockMovements: "stockMovements",
  warehouseTransfers: "warehouseTransfers",
  physicalCounts: "physicalCounts",
  reorderRules: "reorderRules",
  productionOrders: "productionOrders",
  productFormulas: "productFormulas",
  materialPlanning: "materialPlanning",
  qualityCertificates: "qualityCertificates",
  productionResults: "productionResults",
  productionWorkshifts: "productionWorkshifts",
  equipment: "equipment",
  preventiveMaintenance: "preventiveMaintenance",
  workOrders: "workOrders",
  equipmentReadings: "equipmentReadings",
  maintenanceTechnicians: "maintenanceTechnicians",
  serviceTickets: "serviceTickets", // Added service tickets collection
  fieldServiceOrders: "fieldServiceOrders", // Added Field Services collections
  fieldTechnicians: "fieldTechnicians",
  technicianLocations: "technicianLocations",
  ledgerAccounts: "ledgerAccounts", // Chart of accounts
  journalEntries: "journalEntries", // Pólizas contables
  budgets: "budgets", // Presupuestos
  salesOrders: "salesOrders",
  deliveries: "deliveries",
  salesInvoices: "salesInvoices", // Renamed to avoid conflict with existing invoices
  salesOrderActivities: "salesOrderActivities",
  productBatches: "productBatches", // Lotes y trazabilidad
  exchangeRates: "exchangeRates", // Tipos de cambio
  ecommerceProducts: "ecommerceProducts", // Published catalog
  ecommerceOrders: "ecommerceOrders",
  ecommerceCustomers: "ecommerceCustomers",
  shoppingCarts: "shoppingCarts",
  productReviews: "productReviews",
  promotions: "promotions",
  supplierCatalog: "supplierCatalog",
  purchaseRequisitions: "purchaseRequisitions",
  rfqs: "rfqs", // Request for Quotations
  supplierQuotations: "supplierQuotations",
  contractAgreements: "contractAgreements",
  reportTemplates: "reportTemplates",
  dashboardConfigs: "dashboardConfigs",

  payrollRuns: "payrollRuns",
  timeEntries: "timeEntries",
  incidents: "incidents",
  benefitsDeductions: "benefitsDeductions",
  candidates: "candidates",
  trainingCourses: "trainingCourses",
} as const

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS]

// Generic Firestore CRUD operations with real-time listeners

/**
 * Get all items from a collection with optional filtering
 */
export async function getItems<T>(collectionName: CollectionName, constraints: QueryConstraint[] = []): Promise<T[]> {
  try {
    const db = getFirebaseDb()
    const collectionRef = collection(db, collectionName)
    const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef

    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[]
  } catch (error) {
    console.error(`[Firestore] Error getting items from ${collectionName}:`, error)
    return []
  }
}

/**
 * Get a single item by ID
 */
export async function getItem<T>(collectionName: CollectionName, id: string): Promise<T | null> {
  try {
    const db = getFirebaseDb()
    const docRef = doc(db, collectionName, id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as T
    }
    return null
  } catch (error) {
    console.error(`[Firestore] Error getting item ${id} from ${collectionName}:`, error)
    return null
  }
}

/**
 * Add a new item to a collection
 */
export async function addItem<T extends DocumentData>(collectionName: CollectionName, item: Omit<T, "id">): Promise<T> {
  try {
    const db = getFirebaseDb()
    const auth = getAuth()
    const currentUser = auth.currentUser

    if (!currentUser) {
      throw new Error("Usuario no autenticado. Por favor inicia sesión.")
    }

    const collectionRef = collection(db, collectionName)

    const docData = {
      ...item,
      userId: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(collectionRef, docData)

    return {
      id: docRef.id,
      ...item,
      userId: currentUser.uid,
    } as T
  } catch (error) {
    console.error(`[Firestore] Error adding item to ${collectionName}:`, error)
    throw error
  }
}

/**
 * Update an existing item
 */
export async function updateItem<T extends DocumentData>(
  collectionName: CollectionName,
  id: string,
  updates: Partial<T>,
): Promise<T | null> {
  try {
    const db = getFirebaseDb()
    const docRef = doc(db, collectionName, id)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })

    // Return updated item
    const updatedDoc = await getDoc(docRef)
    if (updatedDoc.exists()) {
      return {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      } as T
    }
    return null
  } catch (error) {
    console.error(`[Firestore] Error updating item ${id} in ${collectionName}:`, error)
    return null
  }
}

/**
 * Delete an item
 */
export async function deleteItem(collectionName: CollectionName, id: string): Promise<boolean> {
  try {
    const db = getFirebaseDb()
    const docRef = doc(db, collectionName, id)
    await deleteDoc(docRef)
    return true
  } catch (error) {
    console.error(`[Firestore] Error deleting item ${id} from ${collectionName}:`, error)
    return false
  }
}

/**
 * Subscribe to real-time updates for a collection
 */
export function subscribeToCollection<T>(
  collectionName: CollectionName,
  callback: (items: T[]) => void,
  constraints: QueryConstraint[] = [],
): Unsubscribe {
  try {
    const db = getFirebaseDb()
    const collectionRef = collection(db, collectionName)
    const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef

    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[]
        callback(items)
      },
      (error) => {
        console.error(`[Firestore] Error in subscription for ${collectionName}:`, error)
        callback([])
      },
    )
  } catch (error) {
    console.error(`[Firestore] Error setting up subscription for ${collectionName}:`, error)
    return () => {}
  }
}

/**
 * Subscribe to real-time updates for a single document
 */
export function subscribeToDocument<T>(
  collectionName: CollectionName,
  id: string,
  callback: (item: T | null) => void,
): Unsubscribe {
  try {
    const db = getFirebaseDb()
    const docRef = doc(db, collectionName, id)

    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback({
            id: snapshot.id,
            ...snapshot.data(),
          } as T)
        } else {
          callback(null)
        }
      },
      (error) => {
        console.error(`[Firestore] Error in subscription for document ${id} in ${collectionName}:`, error)
        callback(null)
      },
    )
  } catch (error) {
    console.error(`[Firestore] Error setting up document subscription for ${id} in ${collectionName}:`, error)
    return () => {}
  }
}

export async function migrateDocumentsWithoutUserId(collectionName: CollectionName): Promise<number> {
  try {
    const auth = getAuth()
    const currentUser = auth.currentUser

    if (!currentUser) {
      console.log(`[v0] Skipping migration for ${collectionName}: No authenticated user`)
      return 0
    }

    console.log(`[v0] Starting migration for ${collectionName} with userId: ${currentUser.uid}`)

    const db = getFirebaseDb()
    const collectionRef = collection(db, collectionName)
    const snapshot = await getDocs(collectionRef)

    console.log(`[v0] Found ${snapshot.docs.length} documents in ${collectionName}`)

    let migratedCount = 0

    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data()

      // If document doesn't have userId, add it
      if (!data.userId) {
        console.log(`[v0] Migrating document ${docSnapshot.id} in ${collectionName}`)
        await updateDoc(doc(db, collectionName, docSnapshot.id), {
          userId: currentUser.uid,
          updatedAt: serverTimestamp(),
        })
        migratedCount++
      }
    }

    console.log(`[v0] Successfully migrated ${migratedCount} documents in ${collectionName}`)
    return migratedCount
  } catch (error) {
    console.error(`[Firestore] Error migrating documents in ${collectionName}:`, error)
    return 0
  }
}
