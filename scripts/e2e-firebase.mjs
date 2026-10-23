#!/usr/bin/env node
/**
 * Orquesta el E2E con Firebase (emuladores ya levantados por `firebase emulators:exec`):
 *  1. compila una variante de la app en `.next-fb` con la configuración de Firebase del emulador;
 *  2. ejecuta Playwright con playwright.firebase.config.ts.
 * Uso: npm run test:e2e:firebase
 */
import { spawnSync } from "node:child_process"

const env = {
  ...process.env,
  NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key-e2e",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "localhost",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-nexo-e2e",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:1:web:e2e",
  NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true",
  NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9199",
  NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST: "127.0.0.1:8085",
  NEXT_DIST_DIR: ".next-fb",
}
delete env.NEXT_PUBLIC_AUTH_MODE
delete env.NEXT_PUBLIC_DEMO_ISOLATED

const run = (cmd, args) => spawnSync(cmd, args, { env, stdio: "inherit", shell: process.platform === "win32" }).status ?? 1

if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.error("Falta FIREBASE_AUTH_EMULATOR_HOST: ejecuta `npm run test:e2e:firebase` (levanta los emuladores).")
  process.exit(2)
}
if (!process.argv.includes("--skip-build") && run("npx", ["next", "build"]) !== 0) process.exit(1)
process.exit(run("npx", ["playwright", "test", "-c", "playwright.firebase.config.ts"]))
