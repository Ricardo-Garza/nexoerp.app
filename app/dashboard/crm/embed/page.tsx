"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ExternalLink, MessageSquare, AlertTriangle } from "lucide-react"
import { usePlatform } from "@/contexts/platform-context"
import { getTenant } from "@/lib/platform/tenant-store"

/**
 * Vista embebida del CRM Momentum dentro de Nexo con barra de regreso clara.
 * Si el CRM bloquea el iframe (X-Frame-Options), ofrecemos abrir en pestaña nueva
 * sin dejar al usuario atrapado (§11: regreso fácil a Nexo).
 */
export default function CrmEmbedPage() {
  const router = useRouter()
  const { activeTenantId } = usePlatform()
  const [url, setUrl] = useState("https://crm-momentum.vercel.app")
  const [blocked, setBlocked] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getTenant(activeTenantId).then((t) => t?.crm.baseUrl && setUrl(t.crm.baseUrl))
    // Si el iframe no carga en 4s asumimos bloqueo por cabeceras del CRM
    const timer = setTimeout(() => setBlocked(true), 4000)
    return () => clearTimeout(timer)
  }, [activeTenantId])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="h-14 border-b bg-card px-4 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/crm")} data-testid="back-to-nexo">
            <ArrowLeft className="w-4 h-4 mr-1" /> Regresar a Nexo
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <MessageSquare className="w-4 h-4 text-primary shrink-0" />
            <span className="font-semibold truncate">CRM Momentum</span>
            <Badge variant="secondary" className="shrink-0">
              embebido
            </Badge>
          </div>
        </div>
        <Button asChild size="sm" variant="ghost">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-1" /> Pestaña nueva
          </a>
        </Button>
      </div>

      <div className="flex-1 relative">
        {!loaded && !blocked && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background"
            data-testid="crm-embed-skeleton"
          >
            <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Cargando CRM Momentum…</p>
            <div className="w-64 space-y-2">
              <div className="h-2.5 rounded-full bg-muted animate-pulse" />
              <div className="h-2.5 rounded-full bg-muted animate-pulse w-4/5 mx-auto" />
            </div>
          </div>
        )}
        <iframe
          src={url}
          title="CRM Momentum"
          className="w-full h-full border-0"
          onLoad={() => {
            setBlocked(false)
            setLoaded(true)
          }}
        />
        {blocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/95 p-6">
            <div className="max-w-md text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/15 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold">El CRM no permite incrustarse</h2>
              <p className="text-muted-foreground text-sm">
                CRM Momentum protege su contenido con cabeceras de seguridad que impiden el iframe. Ábrelo en una
                pestaña nueva; el handoff seguro (SSO) queda pendiente de credenciales del CRM.
              </p>
              <div className="flex gap-2 justify-center">
                <Button asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-1" /> Abrir CRM Momentum
                  </a>
                </Button>
                <Button variant="outline" onClick={() => router.push("/dashboard/crm")}>
                  Regresar a Nexo
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
