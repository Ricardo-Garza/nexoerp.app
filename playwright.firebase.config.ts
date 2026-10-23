import { defineConfig, devices } from "@playwright/test"

/**
 * E2E con Firebase Authentication y Firestore REALES (emuladores locales, proyecto `demo-nexo-e2e`),
 * SIN modo demo. Se ejecuta con `npm run test:e2e:firebase`, que levanta los emuladores, compila una
 * variante (`.next-fb`) con la configuración de Firebase y lanza estas pruebas.
 * Las contraseñas se generan al azar en global-setup: no hay credenciales en el repositorio.
 */
export const E2E_FIREBASE_ENV = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key-e2e",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "localhost",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-nexo-e2e",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:1:web:e2e",
  NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true",
  NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9199",
  NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST: "127.0.0.1:8085",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9199",
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8085",
  GCLOUD_PROJECT: "demo-nexo-e2e",
  NEXT_DIST_DIR: ".next-fb",
}

export default defineConfig({
  testDir: "tests/e2e-firebase",
  timeout: 90_000,
  workers: 1,
  reporter: [["list"]],
  globalSetup: "./tests/e2e-firebase/global-setup.ts",
  use: {
    baseURL: "http://127.0.0.1:3217",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : undefined,
  },
  projects: [{ name: "firebase-desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: "npx next start -p 3217",
    env: E2E_FIREBASE_ENV,
    url: "http://127.0.0.1:3217/login",
    reuseExistingServer: false,
    timeout: 90_000,
  },
})
