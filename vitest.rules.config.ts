import { defineConfig } from "vitest/config"
import { fileURLToPath } from "url"

// Pruebas de Firestore Security Rules: requieren el emulador (npm run test:rules)
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: { include: ["tests/rules/**/*.test.ts"], environment: "node", testTimeout: 30000, hookTimeout: 60000, fileParallelism: false },
})
