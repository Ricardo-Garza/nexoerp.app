"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { ArrowRight, Compass, Maximize2, Minimize2, RotateCcw, Search, Send, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { usePlatform } from "@/contexts/platform-context"
import { buildAssistantReply, type AssistantSuggestion } from "@/lib/assistant/nexo-assistant"
import { useErpPreferences } from "@/hooks/use-erp-preferences"
import { getUiText } from "@/lib/i18n/erp-ui"
import { COPILOT_TENANT_ID, SUGGESTED_QUESTIONS } from "@/lib/copilot/constants"
import { MAX_QUESTION_LENGTH } from "@/lib/copilot/schema"
import { RobotIcon } from "@/components/copilot/robot-icon"
import { ResultCard } from "@/components/copilot/result-card"
import { useCopilot } from "@/components/copilot/use-copilot"

interface Suggestion extends AssistantSuggestion {
  action: () => void
}

interface GuideMessage {
  from: "user" | "assistant"
  text: string
  suggestions?: Suggestion[]
}

const INVITE_KEY = "nexo_copilot_invite_seen"

function safeStorage<T>(fn: () => T, fallback: T): T {
  try {
    return fn()
  } catch {
    return fallback
  }
}

/**
 * Asistente flotante de Nexo ERP.
 *  - Empresas con origen de datos conectado (hoy: demo de Soleil Wire, solo administradores de
 *    plataforma): copiloto «Nexo Intelligence» con consultas reales, gráficas y memoria de sesión.
 *  - Resto de empresas: la guía contextual de siempre (ayuda y navegación).
 */
export function FloatingAssistant() {
  const router = useRouter()
  const pathname = usePathname()
  const { isPlatformAdmin, activeTenantId } = usePlatform()
  const { language } = useErpPreferences()
  const text = getUiText(language)
  // El servidor decide quién puede consultar (claim de plataforma o pertenencia firmada al tenant); la UI solo ofrece el modo
  const copilotMode = activeTenantId === COPILOT_TENANT_ID

  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false) // panel montado (permite animar la salida)
  const [expanded, setExpanded] = useState(false)
  const [input, setInput] = useState("")
  const [guide, setGuide] = useState<GuideMessage[]>([])
  const [invite, setInvite] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  const setPanel = useCallback((value: boolean) => {
    setOpen(value)
    if (value) setVisible(true)
  }, [])

  const go = useCallback(
    (href: string) => () => {
      router.push(href)
      setPanel(false)
    },
    [router, setPanel],
  )

  const makeSuggestions = useCallback((suggestions: AssistantSuggestion[]): Suggestion[] => suggestions.map((s) => ({ ...s, action: go(s.href) })), [go])

  const guideReplyFor = useCallback(
    (raw: string): GuideMessage => {
      const reply = buildAssistantReply({ input: raw, pathname, isNexoAdmin: isPlatformAdmin, canImport: true, canExport: true, language })
      return { from: "assistant", text: reply.text, suggestions: makeSuggestions(reply.suggestions) }
    },
    [isPlatformAdmin, language, makeSuggestions, pathname],
  )

  const onDelegate = useCallback(
    (question: string) => {
      const reply = buildAssistantReply({ input: question, pathname, isNexoAdmin: isPlatformAdmin, canImport: true, canExport: true, language })
      pushLocalRef.current?.({ id: `g${Date.now()}`, from: "assistant", guide: { text: reply.text, suggestions: reply.suggestions } })
    },
    [isPlatformAdmin, language, pathname],
  )
  const copilot = useCopilot(COPILOT_TENANT_ID, onDelegate)
  const pushLocalRef = useRef(copilot.pushLocal)
  pushLocalRef.current = copilot.pushLocal

  const greeting = useMemo<GuideMessage>(() => guideReplyFor("que puedo hacer aqui"), [guideReplyFor])

  // Montaje/desmontaje con animación de salida
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setVisible(false), 160)
    return () => clearTimeout(t)
  }, [open])

  // Auto-scroll al final cuando llegan mensajes o cambia el estado de proceso
  const reducedMotion = useRef(false)
  useEffect(() => {
    reducedMotion.current = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  }, [])
  useEffect(() => {
    // El estado de bienvenida se muestra desde arriba; el auto-scroll aplica cuando ya hay conversación
    const hasConversation = copilotMode ? copilot.messages.length > 0 || copilot.pending : guide.length > 0
    if (!hasConversation) return
    endRef.current?.scrollIntoView({ behavior: reducedMotion.current ? "auto" : "smooth", block: "end" })
  }, [copilot.messages, copilot.pending, guide, open, expanded, copilotMode])

  // Invitación discreta, una sola vez, solo en modo copiloto
  useEffect(() => {
    if (!copilotMode || open) return
    if (safeStorage(() => window.localStorage.getItem(INVITE_KEY), "1")) return
    const show = setTimeout(() => setInvite(true), 2500)
    const hide = setTimeout(() => dismissInvite(), 12000)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
  }, [copilotMode, open])

  function dismissInvite() {
    setInvite(false)
    safeStorage(() => window.localStorage.setItem(INVITE_KEY, "1"), undefined)
  }

  function closePanel() {
    setPanel(false)
    toggleRef.current?.focus()
  }

  function submit(raw?: string) {
    const value = (raw ?? input).trim()
    if (!value) return
    if (copilotMode) {
      if (copilot.pending) return
      void copilot.ask(value)
    } else {
      setGuide((cur) => [...cur, { from: "user", text: value }, guideReplyFor(value)])
    }
    setInput("")
  }

  const guideMessages = open && guide.length === 0 ? [greeting] : guide
  const showWelcome = copilotMode && copilot.messages.length === 0

  return (
    <>
      {copilotMode && invite && !open && (
        <div className="copilot-invite fixed bottom-24 right-6 z-40 max-w-[260px] rounded-2xl border bg-card p-3 pr-8 text-sm shadow-xl" role="status" data-testid="copilot-invite">
          <button type="button" onClick={dismissInvite} aria-label="Cerrar invitación" className="absolute right-1.5 top-1.5 rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <X className="h-3.5 w-3.5" />
          </button>
          Hola, soy Nexo Intelligence. ¿Quieres analizar tus ventas?
          <button
            type="button"
            onClick={() => {
              dismissInvite()
              setPanel(true)
            }}
            className="mt-2 block text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:underline"
          >
            Abrir asistente
          </button>
        </div>
      )}

      <button
        ref={toggleRef}
        onClick={() => {
          setPanel(!open)
          if (invite) dismissInvite()
        }}
        data-testid="assistant-toggle"
        aria-label={copilotMode ? "Nexo Intelligence" : text.assistant.aria}
        aria-expanded={open}
        aria-controls="nexo-assistant-panel"
        className={cn(
          "group/robot fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform motion-reduce:transition-none",
          "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/60 motion-reduce:hover:scale-100",
        )}
      >
        {open ? <X className="h-6 w-6" /> : <RobotIcon className="h-8 w-8" />}
      </button>

      {visible && (
        <div
          id="nexo-assistant-panel"
          role="dialog"
          aria-label={copilotMode ? "Nexo Intelligence" : text.assistant.title}
          data-state={open ? "open" : "closed"}
          data-testid="assistant-panel"
          data-mode={copilotMode ? "copilot" : "guide"}
          onKeyDown={(e) => {
            if (e.key === "Escape") closePanel()
          }}
          className={cn(
            "copilot-panel fixed bottom-24 right-3 z-40 flex flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl sm:right-6",
            copilotMode && expanded
              ? "h-[calc(100dvh-7rem)] w-[calc(100vw-1.5rem)] sm:w-[min(920px,calc(100vw-3rem))]"
              : "h-[560px] max-h-[calc(100dvh-7rem)] w-[calc(100vw-1.5rem)] sm:w-[400px]",
          )}
        >
          <div className="flex items-center gap-2 border-b bg-muted/40 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <RobotIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{copilotMode ? "Nexo Intelligence" : text.assistant.title}</p>
              {copilotMode ? (
                <Badge variant="outline" className="mt-0.5 border-amber-500/50 px-1.5 py-0 text-[10px] text-amber-600 dark:text-amber-400" data-testid="copilot-demo-badge">
                  Demo Soleil Wire · datos simulados
                </Badge>
              ) : (
                <p className="truncate text-xs text-muted-foreground">{text.assistant.subtitle}</p>
              )}
            </div>
            {copilotMode && (
              <div className="flex items-center gap-0.5">
                <Link href="/dashboard/nexo-intelligence" onClick={() => setPanel(false)} aria-label="Explorar Nexo Intelligence" title="Explorar Nexo Intelligence" data-testid="copilot-explore" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Compass className="h-4 w-4" />
                </Link>
                <button type="button" onClick={() => setExpanded((v) => !v)} aria-label={expanded ? "Reducir panel" : "Ampliar panel"} title={expanded ? "Reducir panel" : "Ampliar panel"} data-testid="copilot-expand" className="hidden rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:block">
                  {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button type="button" onClick={() => copilot.clear()} aria-label="Limpiar conversación" title="Limpiar conversación" data-testid="copilot-clear" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            )}
            <button type="button" onClick={closePanel} aria-label="Cerrar asistente" title="Cerrar" data-testid="copilot-close" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain p-3" role="log" aria-live="polite" aria-relevant="additions" data-testid="assistant-log">
            {copilotMode ? (
              <>
                {showWelcome && (
                  <div data-testid="copilot-welcome">
                    <div className="rounded-2xl bg-muted px-3 py-2.5 text-sm">
                      <p className="font-medium">Hola, soy Nexo Intelligence.</p>
                      <p className="mt-1 text-muted-foreground">Pregúntame por ventas, clientes, inventario, cobranza o el pipeline de Soleil Wire. Calculo directo desde los registros y puedes seguir la conversación («¿y en septiembre?», «compáralos», «en gráfica»).</p>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">Solo lectura · los datos son simulados para este demo.</p>
                    </div>
                    <p className="mb-1.5 mt-3 text-xs font-medium text-muted-foreground">Prueba con:</p>
                    <div className={cn("grid gap-1.5", expanded ? "sm:grid-cols-2" : "grid-cols-1")}>
                      {SUGGESTED_QUESTIONS.map((q) => (
                        <button key={q} type="button" disabled={copilot.pending} onClick={() => submit(q)} data-testid="copilot-suggestion" className="group flex items-center justify-between gap-2 rounded-xl border bg-background px-3 py-2 text-left text-xs transition-colors hover:border-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
                          <span>{q}</span>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-40 group-hover:opacity-100" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {copilot.messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.from === "user" ? "justify-end" : "justify-start")}>
                    {m.from === "user" ? (
                      <div className="max-w-[85%] break-words rounded-2xl bg-primary px-3 py-2 text-sm text-primary-foreground" data-testid="copilot-user-message">
                        {m.text}
                      </div>
                    ) : "result" in m ? (
                      <div className="w-full min-w-0 rounded-2xl bg-muted px-3 py-2.5" data-testid="copilot-answer">
                        <ResultCard result={m.result} onAsk={(q) => submit(q)} disabled={copilot.pending} autoExport={m.fresh} />
                      </div>
                    ) : "guide" in m ? (
                      <div className="max-w-[90%] rounded-2xl bg-muted px-3 py-2 text-sm">
                        <p>{m.guide.text}</p>
                        <div className="mt-2 space-y-1.5">
                          {m.guide.suggestions.map((s) => (
                            <button key={`${s.label}-${s.href}`} type="button" onClick={go(s.href)} className="group flex w-full items-center justify-between gap-2 rounded-lg border bg-background px-2.5 py-1.5 text-left text-xs transition-colors hover:border-primary">
                              <span>
                                <span className="font-medium">{s.label}</span>
                                {s.detail && <span className="block text-muted-foreground">{s.detail}</span>}
                              </span>
                              <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-40 group-hover:opacity-100" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div role="alert" className="max-w-[90%] rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300" data-testid="copilot-error">
                        {m.error}
                      </div>
                    )}
                  </div>
                ))}
                {copilot.pending && (
                  <div className="flex justify-start" data-testid="copilot-pending" role="status" aria-label="Analizando datos">
                    <div className="flex items-center gap-1.5 rounded-2xl bg-muted px-3 py-2.5 text-xs text-muted-foreground">
                      <span className="copilot-dot h-1.5 w-1.5 rounded-full bg-current" />
                      <span className="copilot-dot h-1.5 w-1.5 rounded-full bg-current" />
                      <span className="copilot-dot h-1.5 w-1.5 rounded-full bg-current" />
                      <span className="ml-1">Analizando datos…</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              guideMessages.map((message, i) => (
                <div key={`${message.from}-${i}`} className={cn("flex", message.from === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm", message.from === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                    <p>{message.text}</p>
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {message.suggestions.map((suggestion) => (
                          <button key={`${suggestion.label}-${suggestion.href}`} onClick={suggestion.action} className="group flex w-full items-center justify-between gap-2 rounded-lg border bg-background px-2.5 py-1.5 text-left text-xs transition-colors hover:border-primary">
                            <span>
                              <span className="font-medium">{suggestion.label}</span>
                              {suggestion.detail && <span className="block text-muted-foreground">{suggestion.detail}</span>}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-40 group-hover:opacity-100" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t p-3">
            {!copilotMode && (
              <Badge variant="outline" className="mb-2 text-[10px]">
                {text.assistant.guide}
              </Badge>
            )}
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={input}
                  maxLength={MAX_QUESTION_LENGTH}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={copilotMode ? "Pregunta por tus ventas, clientes, inventario…" : text.assistant.placeholder}
                  aria-label={copilotMode ? "Pregunta para Nexo Intelligence" : text.assistant.placeholder}
                  className="h-9 pl-8"
                  data-testid="assistant-input"
                  autoComplete="off"
                />
              </div>
              <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={copilotMode && copilot.pending} aria-label="Enviar pregunta" data-testid="assistant-send">
                <Send className="h-4 w-4" />
              </Button>
            </form>
            {copilotMode && <p className="mt-1.5 text-center text-[10px] text-muted-foreground">Solo lectura · Datos simulados de demostración</p>}
          </div>
        </div>
      )}
    </>
  )
}
