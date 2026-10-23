import { NextResponse } from "next/server"
import { CopilotDataError } from "@/lib/copilot/adapters/types"
import { requestSchema } from "@/lib/copilot/schema"
import { getDemoService } from "@/lib/copilot/service"
import { COPILOT_TENANT_ID } from "@/lib/copilot/constants"
import { isPlatformAdminEmail } from "@/lib/platform/platform-admin"
import { getSessionUser } from "@/lib/server/session"

/**
 * POST /api/copilot/query — Nexo Intelligence (solo lectura).
 *
 * Seguridad (todo del lado servidor; el navegador nunca recibe la base de datos):
 *  1. Sesión válida (modo demo: cookie de usuario demo; Firebase Admin pendiente, deuda D4).
 *  2. El tenant solicitado debe ser el del adaptador DEMO y el usuario debe poder operarlo
 *     (administrador de plataforma). Ningún identificador del cliente se acepta sin validar.
 *  3. Cuerpo acotado y validado con zod; memoria de sesión re-verificada contra el tenant.
 *  4. Límite de frecuencia por usuario y sin caché del lado cliente.
 */
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_BODY_BYTES = 16 * 1024
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 60
const hits = new Map<string, number[]>()

function rateLimited(key: string): boolean {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 500) for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k)
  return recent.length > MAX_PER_WINDOW
}

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } })

export async function POST(request: Request) {
  const session = await getSessionUser()
  if (!session) return json({ error: "unauthenticated", message: "Inicia sesión para usar Nexo Intelligence." }, 401)
  if (rateLimited(session.id)) return json({ error: "rate_limited", message: "Demasiadas consultas en poco tiempo. Espera un momento." }, 429)

  const length = Number(request.headers.get("content-length") ?? "0")
  if (length > MAX_BODY_BYTES) return json({ error: "too_large", message: "La consulta es demasiado grande." }, 413)
  let body: unknown
  try {
    const text = await request.text()
    if (text.length > MAX_BODY_BYTES) return json({ error: "too_large", message: "La consulta es demasiado grande." }, 413)
    body = JSON.parse(text)
  } catch {
    return json({ error: "bad_request", message: "Cuerpo JSON inválido." }, 400)
  }
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) return json({ error: "bad_request", message: "Consulta inválida." }, 400)
  const { question, tenantId, memory } = parsed.data

  // Autorización por tenant: solo el tenant DEMO de Soleil Wire y solo para administradores de plataforma
  if (tenantId !== COPILOT_TENANT_ID || !isPlatformAdminEmail(session.email)) {
    return json({ error: "forbidden", message: "No tienes acceso a los datos de esta empresa con Nexo Intelligence." }, 403)
  }

  try {
    const response = await getDemoService().ask({ tenantId, userId: session.id, role: session.role }, question, memory)
    return json(response)
  } catch (e) {
    if (e instanceof CopilotDataError) {
      const status = e.code === "forbidden" ? 403 : e.code === "timeout" ? 504 : e.code === "too_large" ? 413 : 502
      return json({ error: e.code, message: "No fue posible consultar el origen de datos." }, status)
    }
    return json({ error: "internal", message: "Ocurrió un error interno al procesar la consulta." }, 500)
  }
}
