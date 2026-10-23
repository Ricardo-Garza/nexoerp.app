import { describe, expect, it } from "vitest"
import { describeMisconfiguration, firebaseProjectMismatch, getAuthMode, missingFirebaseVars, type AuthEnv } from "@/lib/config/auth-mode"
import { authErrorMessage } from "@/lib/auth-errors"

const FIREBASE: AuthEnv = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "test-key-not-real",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "nexoerp-88c6e.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "nexoerp-88c6e",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:123:web:abc",
}

describe("Modo de autenticación (causa raíz: caída silenciosa a demo)", () => {
  it("producción con Firebase completo usa autenticación real", () => {
    expect(getAuthMode({ ...FIREBASE, NODE_ENV: "production", VERCEL_ENV: "production" })).toBe("firebase")
    expect(getAuthMode({ ...FIREBASE, NODE_ENV: "production", VERCEL_ENV: "preview" })).toBe("firebase")
  })

  it("producción SIN variables de Firebase es un error de configuración, NO modo demo", () => {
    for (const vercel of ["production", "preview", undefined]) {
      expect(getAuthMode({ NODE_ENV: "production", VERCEL_ENV: vercel })).toBe("misconfigured")
    }
    expect(getAuthMode({ NODE_ENV: "production", NEXT_PUBLIC_FIREBASE_API_KEY: "x" })).toBe("misconfigured") // parcial
  })

  it("nombra (sin valores) las variables que faltan", () => {
    expect(missingFirebaseVars({ NEXT_PUBLIC_FIREBASE_API_KEY: "x" })).toEqual(["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "NEXT_PUBLIC_FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_APP_ID"])
    expect(describeMisconfiguration({ NODE_ENV: "production" })).toMatch(/NEXT_PUBLIC_FIREBASE_API_KEY/)
    expect(describeMisconfiguration({ NODE_ENV: "production", NEXT_PUBLIC_FIREBASE_API_KEY: "SECRETO" })).not.toMatch(/SECRETO/)
  })

  it("el modo demo exige entorno aislado y jamás se activa en producción de Vercel", () => {
    expect(getAuthMode({ NODE_ENV: "development", NEXT_PUBLIC_AUTH_MODE: "demo" })).toBe("demo")
    expect(getAuthMode({ NODE_ENV: "production", NEXT_PUBLIC_AUTH_MODE: "demo" })).toBe("misconfigured")
    expect(getAuthMode({ NODE_ENV: "production", NEXT_PUBLIC_AUTH_MODE: "demo", NEXT_PUBLIC_DEMO_ISOLATED: "true" })).toBe("demo") // E2E local
    expect(getAuthMode({ NODE_ENV: "production", NEXT_PUBLIC_AUTH_MODE: "demo", NEXT_PUBLIC_DEMO_ISOLATED: "true", VERCEL_ENV: "production" })).toBe("misconfigured")
    expect(getAuthMode({ NODE_ENV: "production", NEXT_PUBLIC_AUTH_MODE: "demo", NEXT_PUBLIC_DEMO_ISOLATED: "true", NEXT_PUBLIC_VERCEL_ENV: "production" })).toBe("misconfigured")
    // pedir demo con Firebase configurado en producción no degrada la seguridad
    expect(getAuthMode({ ...FIREBASE, NODE_ENV: "production", NEXT_PUBLIC_AUTH_MODE: "demo", VERCEL_ENV: "production" })).toBe("misconfigured")
  })

  it("el desarrollo local sin configuración conserva el demo como comodidad; producción no", () => {
    expect(getAuthMode({ NODE_ENV: "development" })).toBe("demo")
    expect(getAuthMode({ NODE_ENV: "development", ...FIREBASE })).toBe("firebase")
  })

  it("rechaza un proyecto Firebase distinto al autorizado (salvo emuladores demo-*)", () => {
    expect(firebaseProjectMismatch({ ...FIREBASE, NEXT_PUBLIC_FIREBASE_PROJECT_ID: "otro-proyecto" })).toBe(true)
    expect(getAuthMode({ ...FIREBASE, NEXT_PUBLIC_FIREBASE_PROJECT_ID: "otro-proyecto", NODE_ENV: "production" })).toBe("misconfigured")
    expect(firebaseProjectMismatch({ ...FIREBASE, NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-nexo" })).toBe(false)
    expect(firebaseProjectMismatch({ ...FIREBASE, NEXT_PUBLIC_FIREBASE_PROJECT_ID: "otro", NEXT_PUBLIC_EXPECTED_FIREBASE_PROJECT_ID: "otro" })).toBe(false)
  })
})

describe("Errores de Firebase Auth en español", () => {
  it.each([
    ["auth/invalid-credential", /Credenciales incorrectas/],
    ["auth/user-not-found", /Credenciales incorrectas/], // no revela si la cuenta existe
    ["auth/wrong-password", /Credenciales incorrectas/],
    ["auth/too-many-requests", /Demasiados intentos/],
    ["auth/network-request-failed", /conexión/],
    ["auth/user-disabled", /deshabilitada/],
    ["auth/operation-not-allowed", /no está habilitado/],
    ["auth/unauthorized-domain", /dominio no está autorizado/],
  ])("%s", (code, re) => {
    expect(authErrorMessage({ code })).toMatch(re)
  })

  it("códigos desconocidos usan un mensaje genérico sin filtrar detalles", () => {
    expect(authErrorMessage({ code: "auth/algo-raro", message: "secreto interno" })).toBe("No fue posible iniciar sesión. Inténtalo de nuevo.")
    expect(authErrorMessage(new Error("boom"), "reset")).toMatch(/enviar el correo/)
  })
})
