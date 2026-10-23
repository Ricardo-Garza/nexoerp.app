#!/usr/bin/env node
/**
 * Asignación AUTORIZADA de custom claims con Firebase Admin SDK (procedimiento administrativo seguro).
 *
 *   node scripts/platform-admin-claim.mjs show    --email operaciones@nexo.com --expected-uid <UID>
 *   node scripts/platform-admin-claim.mjs grant   --email operaciones@nexo.com --expected-uid <UID> [--apply]
 *   node scripts/platform-admin-claim.mjs revoke  --email operaciones@nexo.com --expected-uid <UID> [--apply]
 *   node scripts/platform-admin-claim.mjs tenant  --email <correo> --expected-uid <UID> --tenant org-xxx --role admin|user [--apply]
 *
 * Sin --apply es un ensayo: muestra qué cambiaría y no escribe nada.
 *
 * Credenciales (NUNCA en Git): Application Default Credentials del operador, por ejemplo
 *   $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\ruta\privada\service-account.json"   # fuera del repo
 * o `gcloud auth application-default login` con una cuenta con rol Firebase Authentication Admin.
 * Con FIREBASE_AUTH_EMULATOR_HOST / FIRESTORE_EMULATOR_HOST funciona contra los emuladores (pruebas).
 *
 * Después de asignar un claim, la persona debe cerrar sesión y volver a entrar (se revocan sus refresh tokens).
 */
import os from "node:os"
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"
import { applyClaims, assertProject, ClaimsError, planPlatformAdmin, planTenantClaims } from "./lib/platform-claims.mjs"

function parseArgs(argv) {
  const [command, ...rest] = argv
  const args = { command, flags: new Set() }
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]
    if (!a.startsWith("--")) continue
    const key = a.slice(2)
    if (["apply", "allow-other-project"].includes(key)) args.flags.add(key)
    else args[key] = rest[++i]
  }
  return args
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!["show", "grant", "revoke", "tenant"].includes(args.command ?? "")) {
    console.error("Uso: platform-admin-claim.mjs <show|grant|revoke|tenant> --email ... --expected-uid ... [--apply]")
    process.exit(2)
  }
  const projectId = args.project || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT
  assertProject(projectId, { allowOtherProject: args.flags.has("allow-other-project") })
  const usingEmulator = Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST)
  if (getApps().length === 0) initializeApp(usingEmulator ? { projectId } : { projectId, credential: applicationDefault() })
  const auth = getAuth()
  const firestore = getFirestore()
  const apply = args.flags.has("apply")

  let plan
  if (args.command === "tenant") plan = await planTenantClaims(auth, firestore, { email: args.email, expectedUid: args["expected-uid"], tenantId: args.tenant, role: args.role })
  else plan = await planPlatformAdmin(auth, { email: args.email, expectedUid: args["expected-uid"], action: args.command === "revoke" ? "revoke" : "grant" })

  console.log(`Proyecto: ${projectId}${usingEmulator ? " (EMULADOR)" : ""}`)
  console.log(`Cuenta:   ${plan.user.email} (uid verificado)`)
  console.log(`Claims actuales (solo claves): ${Object.keys(plan.current).sort().join(", ") || "(ninguno)"}`)
  console.log(`Claims resultantes (solo claves): ${Object.keys(plan.next).sort().join(", ") || "(ninguno)"}`)
  for (const w of plan.warnings) console.log(`⚠️  ${w}`)
  if (args.command === "show") return
  if (!plan.changed) return console.log("Sin cambios: la cuenta ya tiene esos claims.")
  if (!apply) return console.log("\nENSAYO: no se escribió nada. Repite con --apply para confirmar.")

  await applyClaims({ auth, firestore }, plan, { action: `claims.${args.command}`, operator: os.userInfo().username })
  console.log("\n✅ Claims aplicados, refresh tokens revocados y bitácora registrada en platform_audit.")
  console.log("   La persona debe cerrar sesión y volver a entrar para recibir el nuevo ID token.")
}

main().catch((e) => {
  if (e instanceof ClaimsError) console.error(`\n❌ ${e.message}\n`)
  else console.error("\n❌ Error inesperado:", e?.code ?? e?.message ?? "desconocido", "\n")
  process.exit(1)
})
