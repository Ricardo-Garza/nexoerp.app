import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { connectAuthEmulator, getAuth as getAuthSdk, type Auth } from "firebase/auth"
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore"
import { getStorage, type FirebaseStorage } from "firebase/storage"
import { describeMisconfiguration, getAuthMode } from "./config/auth-mode"

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const requiredKeys = ["apiKey", "authDomain", "projectId", "appId"]
const missingKeys = requiredKeys.filter((key) => !firebaseConfig[key as keyof typeof firebaseConfig])

// Configuración PARCIAL = error real de despliegue. Ausencia total = modo demo
// esperado (ver lib/config/auth-mode.ts), no se reporta como error.
if (missingKeys.length > 0 && missingKeys.length < requiredKeys.length && typeof window !== "undefined") {
  console.error(`[Firebase] Missing required environment variables: ${missingKeys.join(", ")}`)
}

// Inicialización PEREZOSA: nada se conecta al importar el módulo. Permite
// compilar y prerenderizar sin credenciales (ADR 0001 del porteo).
let firebaseApp: FirebaseApp | undefined

export class FirebaseConfigError extends Error {
  constructor(detail: string) {
    super(`Configuración de Firebase inválida. ${detail}`)
    this.name = "FirebaseConfigError"
  }
}

export function getFirebaseApp(): FirebaseApp {
  if (getAuthMode() !== "firebase") throw new FirebaseConfigError(describeMisconfiguration())
  if (!firebaseApp) {
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  }
  return firebaseApp
}

/**
 * Emuladores locales (solo pruebas): únicamente con un proyecto `demo-*` y NUNCA en producción de Vercel,
 * de modo que una variable mal puesta no pueda desviar el tráfico real.
 */
function emulatorsEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" &&
    (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "").startsWith("demo-") &&
    process.env.NEXT_PUBLIC_VERCEL_ENV !== "production"
  )
}

let authInstance: Auth | undefined
let dbInstance: Firestore | undefined

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuthSdk(getFirebaseApp())
    if (emulatorsEnabled()) connectAuthEmulator(authInstance, `http://${process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9199"}`, { disableWarnings: true })
  }
  return authInstance
}

export function getFirebaseDb(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(getFirebaseApp())
    if (emulatorsEnabled()) {
      const [host, port] = (process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || "127.0.0.1:8085").split(":")
      connectFirestoreEmulator(dbInstance, host, Number(port))
    }
  }
  return dbInstance
}

export function getFirebaseStorage(): FirebaseStorage {
  return getStorage(getFirebaseApp())
}

/** Alias legacy: módulos antiguos importan getAuth desde este módulo */
export function getAuth(): Auth {
  return getFirebaseAuth()
}
