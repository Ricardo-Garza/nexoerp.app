import { NextResponse } from "next/server"
import { buildSoleilDashboardSummary } from "@/lib/copilot/dashboard-summary"
import { COPILOT_TENANT_ID } from "@/lib/copilot/constants"
import { getDemoService } from "@/lib/copilot/service"
import { authenticateRequest, canAccessTenant } from "@/lib/server/request-auth"

/** Datos agregados del tablero Soleil Wire; el dataset nunca viaja al navegador. */
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const auth = await authenticateRequest(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.code, message: "Inicia sesión para consultar el tablero." }, { status: auth.status, headers: { "Cache-Control": "no-store" } })
  }
  if (!canAccessTenant(auth.principal, COPILOT_TENANT_ID)) {
    return NextResponse.json({ error: "forbidden", message: "No tienes acceso a los datos de esta empresa." }, { status: 403, headers: { "Cache-Control": "no-store" } })
  }
  const view = await getDemoService().view({
    tenantId: COPILOT_TENANT_ID,
    userId: auth.principal.uid,
    role: auth.principal.platformAdmin ? "platform_admin" : (auth.principal.tenantRole ?? "member"),
  })
  return NextResponse.json(buildSoleilDashboardSummary(view), { headers: { "Cache-Control": "no-store" } })
}
