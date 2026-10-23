/**
 * Lógica de asignación de custom claims de NexoERP (sin I/O de consola, para poder probarla con el emulador).
 *
 * Reglas de seguridad:
 *  - Solo correos de la lista autorizada pueden recibir `platformAdmin`.
 *  - El operador debe declarar el UID esperado (lo ve en Firebase Console) y debe coincidir con la cuenta real.
 *  - Por omisión es un ensayo (dry-run): no escribe nada sin `apply: true`.
 *  - Se conservan los demás claims existentes y se deja una entrada en `platform_audit`.
 *  - Tras asignar se revocan los refresh tokens: la persona debe volver a iniciar sesión para recibir el claim.
 */
export const PLATFORM_ADMIN_ALLOWLIST = ["operaciones@nexo.com"]
export const NEVER_PLATFORM_ADMIN = ["ventas@nexo.com"]
export const EXPECTED_PROJECT_ID = "nexoerp-88c6e"

export class ClaimsError extends Error {}

const norm = (e) => String(e ?? "").trim().toLowerCase()

export function assertProject(projectId, { allowOtherProject = false } = {}) {
  if (!projectId) throw new ClaimsError("Falta el ID del proyecto (--project o NEXT_PUBLIC_FIREBASE_PROJECT_ID).")
  const emulator = projectId.startsWith("demo-")
  if (!emulator && projectId !== EXPECTED_PROJECT_ID && !allowOtherProject) {
    throw new ClaimsError(`El proyecto «${projectId}» no es el autorizado (${EXPECTED_PROJECT_ID}). Usa --allow-other-project solo si es intencional.`)
  }
}

async function lookup(auth, email, expectedUid) {
  if (!expectedUid) throw new ClaimsError("Debes indicar --expected-uid (cópialo de Firebase Console > Authentication).")
  let user
  try {
    user = await auth.getUserByEmail(email)
  } catch (e) {
    if (e?.code === "auth/user-not-found") throw new ClaimsError(`No existe un usuario con el correo ${email}. No se crean cuentas desde este script.`)
    throw e
  }
  if (user.uid !== expectedUid) throw new ClaimsError("El UID de la cuenta no coincide con --expected-uid. Operación abortada.")
  if (user.disabled) throw new ClaimsError("La cuenta está deshabilitada.")
  return user
}

/** Calcula (sin escribir) los claims resultantes de conceder o revocar el rol global. */
export async function planPlatformAdmin(auth, { email, expectedUid, action = "grant" }) {
  if (!["show", "grant", "revoke"].includes(action)) throw new ClaimsError("Acción de plataforma inválida.")
  const e = norm(email)
  if (NEVER_PLATFORM_ADMIN.includes(e)) throw new ClaimsError(`${e} no puede recibir privilegios de plataforma.`)
  if (action === "grant" && !PLATFORM_ADMIN_ALLOWLIST.includes(e)) throw new ClaimsError(`${e} no está en la lista autorizada de administradores de plataforma.`)
  const user = await lookup(auth, e, expectedUid)
  const current = user.customClaims ?? {}
  const next = { ...current }
  if (action === "grant") next.platformAdmin = true
  else if (action === "revoke") delete next.platformAdmin
  return { user, current, next, changed: JSON.stringify(current) !== JSON.stringify(next), warnings: user.emailVerified ? [] : ["El correo de la cuenta no está verificado en Firebase."] }
}

/** Asigna claims de empresa (companyId + tenantRole) a una cuenta existente; nunca de plataforma. */
export async function planTenantClaims(auth, firestore, { email, expectedUid, tenantId, role }) {
  const e = norm(email)
  if (!["admin", "user"].includes(role)) throw new ClaimsError("El rol de empresa debe ser admin o user.")
  if (!/^org-[a-z0-9-]{1,40}$/.test(tenantId ?? "")) throw new ClaimsError("tenantId inválido (formato org-xxxx).")
  if (PLATFORM_ADMIN_ALLOWLIST.includes(e)) throw new ClaimsError("La cuenta de plataforma no se asigna a una empresa; usa el selector de empresas.")
  const snap = await firestore.doc(`tenants/${tenantId}`).get()
  if (!snap.exists) throw new ClaimsError(`La empresa ${tenantId} no existe en Firestore.`)
  const user = await lookup(auth, e, expectedUid)
  const current = user.customClaims ?? {}
  const next = { ...current, companyId: tenantId, tenantRole: role }
  return { user, current, next, changed: JSON.stringify(current) !== JSON.stringify(next), warnings: [] }
}

export async function applyClaims({ auth, firestore }, plan, { action, operator, extra = {} }) {
  await auth.setCustomUserClaims(plan.user.uid, plan.next)
  await auth.revokeRefreshTokens(plan.user.uid) // obliga a re-autenticar para recibir el nuevo ID token
  await firestore.collection("platform_audit").add({
    actorUid: `admin-sdk:${operator}`,
    action,
    targetUid: plan.user.uid,
    targetEmail: plan.user.email ?? null,
    claimsBefore: Object.keys(plan.current).sort(),
    claimsAfter: Object.keys(plan.next).sort(),
    at: new Date().toISOString(),
    ...extra,
  })
}
