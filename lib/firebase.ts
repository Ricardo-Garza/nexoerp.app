import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { getAuth as getAuthSdk, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getStorage, type FirebaseStorage } from "firebase/storage"

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

export function getFirebaseApp(): FirebaseApp {
  if (!firebaseApp) {
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  }
  return firebaseApp
}

export function getFirebaseAuth(): Auth {
  return getAuthSdk(getFirebaseApp())
}

export function getFirebaseDb(): Firestore {
  return getFirestore(getFirebaseApp())
}

export function getFirebaseStorage(): FirebaseStorage {
  return getStorage(getFirebaseApp())
}

/** Alias legacy: módulos antiguos importan getAuth desde este módulo */
export function getAuth(): Auth {
  return getFirebaseAuth()
}
