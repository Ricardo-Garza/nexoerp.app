"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Play, RotateCcw, Send, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { usePlatform } from "@/contexts/platform-context"
import { COPILOT_TENANT_ID } from "@/lib/copilot/constants"
import { MAX_QUESTION_LENGTH } from "@/lib/copilot/schema"
import { DEMO_SCENARIOS } from "@/lib/copilot/scenarios"
import { ResultCard } from "@/components/copilot/result-card"
import { useCopilot } from "@/components/copilot/use-copilot"

export default function NexoIntelligencePage() {
  const router = useRouter()
  const { activeTenantId, isPlatformAdmin, setActiveTenant } = usePlatform()
  const enabled = activeTenantId === COPILOT_TENANT_ID
  const copilot = useCopilot(COPILOT_TENANT_ID)
  const [running, setRunning] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (copilot.messages.length) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [copilot.messages.length])

  async function runScenario(id: string) {
    const scenario = DEMO_SCENARIOS.find((s) => s.id === id)
    if (!scenario || running) return
    copilot.clear()
    setRunning(id)
    // Cada paso es una consulta real: comparten la memoria de sesión (como en una conversación)
    for (const step of scenario.steps) await copilot.ask(step)
    setRunning(null)
  }

  function submit() {
    if (!input.trim() || copilot.pending || running) return
    void copilot.ask(input)
    setInput("")
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Explorar Nexo Intelligence</h1>
          <Badge variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400" data-testid="intelligence-demo-badge">
            Demo · datos simulados
          </Badge>
        </div>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Un copiloto que entiende preguntas en español, consulta los registros relacionados de Soleil Wire, calcula cifras verificables y las muestra con gráficas. Cada escenario ejecuta preguntas reales contra el mismo motor del asistente: no hay respuestas
          pregrabadas. Es de solo lectura y no usa modelos de IA externos.
        </p>
      </div>

      {!enabled ? (
        <Card data-testid="intelligence-disabled">
          <CardContent className="flex gap-3 p-5 text-sm">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div>
              <p className="font-medium">Este demo solo está disponible para la empresa Soleil Wire.</p>
              <p className="mt-1 text-muted-foreground">Entra con un usuario de Soleil Wire o, como administrador de plataforma, selecciona la empresa Soleil Wire en el selector de empresas. Las demás empresas no tienen un origen de datos conectado a Nexo Intelligence.</p>
              {isPlatformAdmin && (
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setActiveTenant(COPILOT_TENANT_ID)
                    router.replace("/dashboard/nexo-intelligence")
                  }}
                  data-testid="select-soleilwire"
                >
                  Cambiar a Soleil Wire
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3" data-testid="intelligence-scenarios">
            {DEMO_SCENARIOS.map((s) => (
              <Card key={s.id} className={cn("transition-colors", running === s.id && "border-primary")}>
                <CardHeader className="pb-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{s.role}</p>
                  <CardTitle className="text-base">{s.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">{s.description}</p>
                  <p className="rounded-lg bg-muted px-2.5 py-1.5 text-xs italic">«{s.prompt}»</p>
                  <Button size="sm" className="w-full" disabled={!!running || copilot.pending} onClick={() => runScenario(s.id)} data-testid={`scenario-${s.id}`}>
                    <Play className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                    {running === s.id ? "Ejecutando…" : "Ejecutar escenario"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">Conversación</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => copilot.clear()} disabled={!copilot.messages.length} data-testid="intelligence-clear">
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Limpiar
              </Button>
            </CardHeader>
            <CardContent className="space-y-3" data-testid="intelligence-conversation">
              {!copilot.messages.length && !copilot.pending && <p className="text-sm text-muted-foreground">Ejecuta un escenario o escribe tu propia pregunta. La memoria de la conversación permite seguimientos como «¿y el mes pasado?» o «en gráfica».</p>}
              {copilot.messages.map((m) => (
                <div key={m.id} className={cn("flex", m.from === "user" ? "justify-end" : "justify-start")}>
                  {m.from === "user" ? (
                    <div className="max-w-[85%] rounded-2xl bg-primary px-3 py-2 text-sm text-primary-foreground">{m.text}</div>
                  ) : "result" in m ? (
                    <div className="w-full max-w-3xl rounded-2xl bg-muted px-4 py-3" data-testid="intelligence-answer">
                      <ResultCard result={m.result} onAsk={(q) => void copilot.ask(q)} disabled={copilot.pending || !!running} autoExport={m.fresh} />
                    </div>
                  ) : "error" in m ? (
                    <div role="alert" className="max-w-[90%] rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                      {m.error}
                    </div>
                  ) : null}
                </div>
              ))}
              {copilot.pending && (
                <p className="text-xs text-muted-foreground" role="status">
                  Analizando datos…
                </p>
              )}
              <div ref={endRef} />
              <form
                className="flex gap-2 pt-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  submit()
                }}
              >
                <Input value={input} maxLength={MAX_QUESTION_LENGTH} onChange={(e) => setInput(e.target.value)} placeholder="Escribe una pregunta sobre ventas, clientes, inventario, cobranza o CRM…" aria-label="Pregunta para Nexo Intelligence" data-testid="intelligence-input" autoComplete="off" />
                <Button type="submit" disabled={copilot.pending || !!running} aria-label="Enviar pregunta" data-testid="intelligence-send">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
