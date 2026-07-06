"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Sparkles, X, Send, Search, ArrowRight, Bot } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MODULE_CATALOG } from "@/lib/platform/modules"
import { usePlatform } from "@/contexts/platform-context"

interface Suggestion {
  label: string
  detail?: string
  action: () => void
}

interface Message {
  from: "user" | "assistant"
  text: string
  suggestions?: Suggestion[]
}

/**
 * Asistente flotante rule-based (sin API key). Ayuda a navegar, buscar módulos,
 * explicar la pantalla actual y lanzar acciones. Cuando el tenant active IA
 * (BYOK) puede delegarse al proveedor configurado; por ahora responde con reglas.
 */
export function FloatingAssistant() {
  const router = useRouter()
  const pathname = usePathname()
  const { isPlatformAdmin } = usePlatform()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const endRef = useRef<HTMLDivElement>(null)

  const go = (href: string) => () => {
    router.push(href)
    setOpen(false)
  }

  const greeting = useMemo<Message>(
    () => ({
      from: "assistant",
      text: "Hola, soy tu asistente de Nexo. Puedo llevarte a un módulo, explicarte esta pantalla o iniciar una tarea. ¿Qué necesitas?",
      suggestions: [
        { label: "¿Qué puedo hacer aquí?", action: () => answer("que puedo hacer aqui") },
        { label: "Importar datos", detail: "Centro de Importación", action: go("/dashboard/import") },
        { label: "Ver clientes", action: go("/dashboard/clients") },
        ...(isPlatformAdmin ? [{ label: "Abrir Control Plane", action: go("/admin") }] : []),
      ],
    }),
    [isPlatformAdmin],
  )

  useEffect(() => {
    if (open && messages.length === 0) setMessages([greeting])
  }, [open, greeting, messages.length])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function currentScreenHelp(): string {
    const mod = MODULE_CATALOG.find((m) => pathname === m.href || pathname.startsWith(m.href + "/"))
    if (pathname.startsWith("/admin")) return "Estás en el Nexo Control Plane. Aquí gestionas empresas, módulos, integraciones, auditoría e importaciones de toda la plataforma."
    if (mod) return `Estás en "${mod.name}". ${mod.description}. ${mod.maturity !== "stable" ? "Este módulo está en " + mod.maturity + "." : ""}`
    return "Estás en el panel principal. Usa el menú lateral para entrar a cualquier módulo."
  }

  function answer(raw: string) {
    const q = raw
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
    const userMsg: Message = { from: "user", text: raw }

    // Explicar pantalla actual
    if (/que puedo hacer|que hay aqui|ayuda|explica|esta pantalla|donde estoy/.test(q)) {
      setMessages((m) => [...m, userMsg, { from: "assistant", text: currentScreenHelp() }])
      return
    }

    // Iniciar importación
    if (/importa|carga masiva|subir|excel|csv/.test(q)) {
      setMessages((m) => [
        ...m,
        userMsg,
        {
          from: "assistant",
          text: "Te llevo al Centro de Importación. Ahí descargas la plantilla, subes tu archivo y validamos antes de guardar.",
          suggestions: [{ label: "Abrir Centro de Importación", action: go("/dashboard/import") }],
        },
      ])
      return
    }

    // Abrir CRM
    if (/crm|momentum|prospecto|oportunidad/.test(q)) {
      setMessages((m) => [
        ...m,
        userMsg,
        {
          from: "assistant",
          text: "El CRM Momentum se abre desde Nexo y puedes regresar cuando quieras.",
          suggestions: [{ label: "Abrir CRM Momentum", action: go("/dashboard/crm") }],
        },
      ])
      return
    }

    // Búsqueda de módulos por nombre
    const matches = MODULE_CATALOG.filter((m) =>
      `${m.name} ${m.description}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .includes(q),
    ).slice(0, 4)

    if (matches.length > 0) {
      setMessages((m) => [
        ...m,
        userMsg,
        {
          from: "assistant",
          text: `Encontré ${matches.length} módulo(s) relacionados:`,
          suggestions: matches.map((mod) => ({
            label: mod.name,
            detail: mod.description,
            action: go(mod.href),
          })),
        },
      ])
      return
    }

    // Fallback
    setMessages((m) => [
      ...m,
      userMsg,
      {
        from: "assistant",
        text: "No encontré una coincidencia exacta. Prueba con el nombre de un módulo (ventas, inventario, clientes...) o pide 'importar datos'.",
        suggestions: [
          { label: "Ver todos los módulos", action: go("/dashboard") },
          { label: "¿Qué puedo hacer aquí?", action: () => answer("que puedo hacer aqui") },
        ],
      },
    ])
  }

  function submit() {
    if (!input.trim()) return
    answer(input.trim())
    setInput("")
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen((o) => !o)}
        data-testid="assistant-toggle"
        aria-label="Asistente Nexo"
        className={cn(
          "fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all",
          "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground hover:scale-105",
        )}
      >
        {open ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-40 w-[360px] max-w-[calc(100vw-3rem)] h-[520px] max-h-[calc(100vh-8rem)] rounded-2xl border bg-card shadow-2xl flex flex-col overflow-hidden"
          data-testid="assistant-panel"
        >
          <div className="p-4 border-b bg-muted/40 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Asistente Nexo</p>
              <p className="text-xs text-muted-foreground">Navega, busca y captura más rápido</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.from === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                    m.from === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  <p>{m.text}</p>
                  {m.suggestions && (
                    <div className="mt-2 space-y-1.5">
                      {m.suggestions.map((s, j) => (
                        <button
                          key={j}
                          onClick={s.action}
                          className="w-full text-left rounded-lg border bg-background px-2.5 py-1.5 text-xs hover:border-primary transition-colors flex items-center justify-between gap-2 group"
                        >
                          <span>
                            <span className="font-medium">{s.label}</span>
                            {s.detail && <span className="block text-muted-foreground">{s.detail}</span>}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="p-3 border-t">
            <Badge variant="outline" className="mb-2 text-[10px]">
              Modo reglas · sin costo
            </Badge>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="Pregunta o busca un módulo..."
                  className="pl-8 h-9"
                  data-testid="assistant-input"
                />
              </div>
              <Button size="icon" className="h-9 w-9 shrink-0" onClick={submit} data-testid="assistant-send">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
