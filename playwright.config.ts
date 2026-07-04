import { defineConfig, devices } from "@playwright/test"

/**
 * E2E sobre el build de producción en modo demo (sin credenciales).
 * Requiere `pnpm build` previo; el webServer levanta `next start`.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    // Chromium preinstalado del entorno; evita descargas en CI/contendor
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : undefined,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    // iPad con motor Chromium: WebKit no está preinstalado en este entorno
    { name: "tablet", use: { ...devices["iPad Pro 11"], browserName: "chromium" } },
  ],
  webServer: {
    command: "npm run start -- -p 3100",
    env: { NEXT_PUBLIC_AUTH_MODE: "demo" },
    url: "http://127.0.0.1:3100/login",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
