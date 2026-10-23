/**
 * Modo de autenticación de la plataforma.
 *
 *  - "firebase":      Firebase Authentication real (producción, preview y cualquier entorno con
 *                     configuración completa).
 *  - "demo":          usuarios ficticios SOLO para desarrollo local o entornos aislados autorizados
 *                     expresamente (NEXT_PUBLIC_AUTH_MODE=demo + NEXT_PUBLIC_DEMO_ISOLATED=true, p. ej. E2E).
 *                     Nunca en producción de Vercel.
 *  - "misconfigured": configuración de Firebase incompleta o inválida fuera de desarrollo. NO se cae a
 *                     autenticación ficticia: la UI muestra un error de configuración controlado.
 *
 * Antes (bug raíz del despliegue): si faltaban las variables NEXT_PUBLIC_FIREBASE_* el modo caía
 * silenciosamente a "demo", por lo que un proyecto Vercel sin variables mostraba «Modo demostración»
 * y rechazaba usuarios reales de Firebase.
 */
export type AuthMode = "firebase" | "demo" | "misconfigured"

/** Proyecto Firebase autorizado de NexoERP (se puede sobrescribir solo para pruebas con emulador). */
export const DEFAULT_FIREBASE_PROJECT_ID = "nexoerp-88c6e"

export interface AuthEnv {
  NODE_ENV?: string
  NEXT_PUBLIC_AUTH_MODE?: string
  NEXT_PUBLIC_DEMO_ISOLATED?: string
  NEXT_PUBLIC_FIREBASE_API_KEY?: string
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?: string
  NEXT_PUBLIC_FIREBASE_PROJECT_ID?: string
  NEXT_PUBLIC_FIREBASE_APP_ID?: string
  NEXT_PUBLIC_EXPECTED_FIREBASE_PROJECT_ID?: string
  NEXT_PUBLIC_VERCEL_ENV?: string
  VERCEL_ENV?: string
}

// Next.js solo inlina `process.env.NEXT_PUBLIC_X` cuando se referencia de forma literal.
function readEnv(): AuthEnv {
  return {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_AUTH_MODE: process.env.NEXT_PUBLIC_AUTH_MODE,
    NEXT_PUBLIC_DEMO_ISOLATED: process.env.NEXT_PUBLIC_DEMO_ISOLATED,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_EXPECTED_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_EXPECTED_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
  }
}

export function isFirebaseConfigured(env: AuthEnv = readEnv()): boolean {
  return Boolean(
    env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      env.NEXT_PUBLIC_FIREBASE_APP_ID,
  )
}

/** Nombres (nunca valores) de las variables obligatorias que faltan. */
export function missingFirebaseVars(env: AuthEnv = readEnv()): string[] {
  const required: (keyof AuthEnv)[] = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ]
  return required.filter((k) => !env[k])
}

function isVercelProduction(env: AuthEnv): boolean {
  return env.VERCEL_ENV === "production" || env.NEXT_PUBLIC_VERCEL_ENV === "production"
}

/** El proyecto configurado debe ser el autorizado (los de emulador usan el prefijo `demo-`). */
export function firebaseProjectMismatch(env: AuthEnv = readEnv()): boolean {
  const configured = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  if (!configured || configured.startsWith("demo-")) return false
  const expected = env.NEXT_PUBLIC_EXPECTED_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID
  return configured !== expected
}

export function getAuthMode(env: AuthEnv = readEnv()): AuthMode {
  const wantsDemo = env.NEXT_PUBLIC_AUTH_MODE === "demo"
  if (wantsDemo) {
    // Demo solo en desarrollo local o en un entorno aislado declarado; jamás en producción de Vercel.
    const allowed = !isVercelProduction(env) && (env.NODE_ENV !== "production" || env.NEXT_PUBLIC_DEMO_ISOLATED === "true")
    return allowed ? "demo" : "misconfigured"
  }
  if (isFirebaseConfigured(env)) return firebaseProjectMismatch(env) ? "misconfigured" : "firebase"
  // Sin ninguna configuración: comodidad de desarrollo local únicamente. En cualquier otro entorno es un error.
  return (env.NODE_ENV === "development" || env.NODE_ENV === "test") && !isVercelProduction(env) ? "demo" : "misconfigured"
}

/** Descripción para la pantalla de error de configuración (sin valores sensibles). */
export function describeMisconfiguration(env: AuthEnv = readEnv()): string {
  if (env.NEXT_PUBLIC_AUTH_MODE === "demo") return "El modo demostración no está permitido en este entorno."
  const missing = missingFirebaseVars(env)
  if (missing.length) return `Faltan variables de Firebase: ${missing.join(", ")}.`
  if (firebaseProjectMismatch(env)) return "El proyecto de Firebase configurado no es el autorizado para NexoERP."
  return "La configuración de autenticación no es válida."
}
