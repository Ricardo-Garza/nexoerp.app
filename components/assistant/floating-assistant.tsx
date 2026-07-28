"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Sparkles, X, Send, Search, ArrowRight, Bot } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { usePlatform } from "@/contexts/platform-context"
import { buildAssistantReply, type AssistantSuggestion } from "@/lib/assistant/nexo-assistant"
import { useErpPreferences } from "@/hooks/use-erp-preferences"
import { getUiText } from "@/lib/i18n/erp-ui"

interface Suggestion extends AssistantSuggestion {
  action: () => void
}

interface Message {
  from: "user" | "assistant"
  text: string
  suggestions?: Suggestion[]
}

export function FloatingAssistant() {
  const router = useRouter()
  const pathname = usePathname()
  const { isPlatformAdmin } = usePlatform()
  const { language } = useErpPreferences()
  const text = getUiText(language)
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const endRef = useRef<HTMLDivElement>(null)

  const go = useCallback(
    (href: string) => () => {
      router.push(href)
      setOpen(false)
    },
    [router],
  )

  const makeSuggestions = useCallback(
    (suggestions: AssistantSuggestion[]): Suggestion[] =>
      suggestions.map((suggestion) => ({ ...suggestion, action: go(suggestion.href) })),
    [go],
  )

  const replyFor = useCallback(
    (raw: string): Message => {
      const reply = buildAssistantReply({
        input: raw,
        pathname,
        isNexoAdmin: isPlatformAdmin,
        canImport: true,
        canExport: true,
        language,
      })
      return { from: "assistant", text: reply.text, suggestions: makeSuggestions(reply.suggestions) }
    },
    [isPlatformAdmin, language, makeSuggestions, pathname],
  )

  const greeting = useMemo<Message>(() => replyFor("que puedo hacer aqui"), [replyFor])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function answer(raw: string) {
    const userMsg: Message = { from: "user", text: raw }
    setMessages((current) => [...current, userMsg, replyFor(raw)])
  }

  function submit() {
    if (!input.trim()) return
    answer(input.trim())
    setInput("")
  }

  const visibleMessages = open && messages.length === 0 ? [greeting] : messages

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        data-testid="assistant-toggle"
        aria-label={text.assistant.aria}
        className={cn(
          "fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all",
          "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground hover:scale-105",
        )}
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </button>

      {open && (
        <div
          className="fixed bottom-24 right-6 z-40 flex h-[520px] max-h-[calc(100vh-8rem)] w-[360px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl"
          data-testid="assistant-panel"
        >
          <div className="flex items-center gap-2 border-b bg-muted/40 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{text.assistant.title}</p>
              <p className="text-xs text-muted-foreground">{text.assistant.subtitle}</p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {visibleMessages.map((message, i) => (
              <div key={`${message.from}-${i}`} className={cn("flex", message.from === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                    message.from === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  <p>{message.text}</p>
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {message.suggestions.map((suggestion) => (
                        <button
                          key={`${suggestion.label}-${suggestion.href}`}
                          onClick={suggestion.action}
                          className="group flex w-full items-center justify-between gap-2 rounded-lg border bg-background px-2.5 py-1.5 text-left text-xs transition-colors hover:border-primary"
                        >
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
            ))}
            <div ref={endRef} />
          </div>

          <div className="border-t p-3">
            <Badge variant="outline" className="mb-2 text-[10px]">
              {text.assistant.guide}
            </Badge>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder={text.assistant.placeholder}
                  className="h-9 pl-8"
                  data-testid="assistant-input"
                />
              </div>
              <Button size="icon" className="h-9 w-9 shrink-0" onClick={submit} data-testid="assistant-send">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
