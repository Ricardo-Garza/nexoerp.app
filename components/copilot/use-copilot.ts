"use client"

import { useCallback, useRef, useState } from "react"
import { authService } from "@/lib/auth"
import type { CopilotResponse, CopilotResult } from "@/lib/copilot/result"
import { EMPTY_MEMORY, MAX_QUESTION_LENGTH, type SessionMemory } from "@/lib/copilot/schema"

export type CopilotMessage =
  | { id: string; from: "user"; text: string }
  | { id: string; from: "assistant"; result: CopilotResult; fresh: boolean }
  | { id: string; from: "assistant"; error: string }
  | { id: string; from: "assistant"; guide: { text: string; suggestions: { label: string; detail?: string; href: string }[] } }

const MAX_MESSAGES = 40
const REQUEST_TIMEOUT_MS = 15_000

const HTTP_ERRORS: Record<number, string> = {
  401: "Tu sesión expiró. Vuelve a iniciar sesión para seguir consultando.",
  403: "No tienes acceso a los datos de esta empresa con Nexo Intelligence.",
  413: "La consulta es demasiado grande. Hazla más corta.",
  429: "Demasiadas consultas en poco tiempo. Espera un momento e inténtalo de nuevo.",
}

let counter = 0
const nextId = () => `m${Date.now().toString(36)}${(counter++).toString(36)}`

/**
 * Estado de la conversación con Nexo Intelligence. La memoria contextual vive SOLO en esta sesión
 * del navegador (no se persiste); el servidor la revalida en cada petición.
 */
export function useCopilot(tenantId: string, onDelegate?: (question: string) => void) {
  const [messages, setMessages] = useState<CopilotMessage[]>([])
  const [pending, setPending] = useState(false)
  const memory = useRef<SessionMemory>(EMPTY_MEMORY)
  const abort = useRef<AbortController | null>(null)
  const busy = useRef(false)

  const push = useCallback((...items: CopilotMessage[]) => {
    setMessages((cur) => [...cur, ...items].slice(-MAX_MESSAGES))
  }, [])

  const ask = useCallback(
    async (raw: string) => {
      const question = raw.trim().slice(0, MAX_QUESTION_LENGTH)
      if (!question || busy.current) return // evita envíos dobles
      busy.current = true
      setPending(true)
      push({ id: nextId(), from: "user", text: question })
      const controller = new AbortController()
      abort.current = controller
      let timedOut = false
      const timer = setTimeout(() => {
        timedOut = true
        controller.abort()
      }, REQUEST_TIMEOUT_MS)
      try {
        // En Firebase la identidad viaja como ID token firmado; el servidor lo verifica (no hay cookie de identidad)
        const idToken = await authService.getIdToken()
        const res = await fetch("/api/copilot/query", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
          body: JSON.stringify({ question, tenantId, memory: memory.current }),
          signal: controller.signal,
          cache: "no-store",
        })
        if (!res.ok) {
          push({ id: nextId(), from: "assistant", error: HTTP_ERRORS[res.status] ?? "No pude consultar los datos en este momento. Inténtalo de nuevo." })
          return
        }
        const data = (await res.json()) as CopilotResponse
        memory.current = data.memory
        if (data.result.status === "delegate" && onDelegate) {
          onDelegate(question)
          return
        }
        push({ id: nextId(), from: "assistant", result: data.result, fresh: true })
      } catch (e) {
        // Cancelada por «Limpiar»: no se muestra ningún error
        if (abort.current === controller) {
          push({ id: nextId(), from: "assistant", error: timedOut ? "La consulta tardó demasiado. Inténtalo de nuevo." : "No hay conexión con el servidor. Revisa tu red e inténtalo otra vez." })
        }
        void e
      } finally {
        clearTimeout(timer)
        if (abort.current === controller) {
          abort.current = null
          busy.current = false
          setPending(false)
        }
      }
    },
    [onDelegate, push, tenantId],
  )

  const clear = useCallback(() => {
    const inFlight = abort.current
    abort.current = null
    inFlight?.abort()
    memory.current = EMPTY_MEMORY
    busy.current = false
    setPending(false)
    setMessages([])
  }, [])

  return { messages, pending, ask, clear, pushLocal: push }
}
