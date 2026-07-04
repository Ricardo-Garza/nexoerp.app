/**
 * Modo de autenticación de la plataforma.
 *
 * - "firebase": modo real (producción/preview con env vars configuradas).
 * - "demo": solo para desarrollo local, CI y E2E sin credenciales.
 *   Se activa únicamente si se pide explícitamente (NEXT_PUBLIC_AUTH_MODE=demo)
 *   o si Firebase NO está configurado en el entorno — situación imposible en
 *   los deployments reales, donde las variables existen. Ver docs/SECURITY_MODEL.md.
 */
export type AuthMode = "firebase" | "demo"

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  )
}

export function getAuthMode(): AuthMode {
  if (process.env.NEXT_PUBLIC_AUTH_MODE === "demo") return "demo"
  return isFirebaseConfigured() ? "firebase" : "demo"
}
