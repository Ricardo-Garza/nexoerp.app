"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DEFAULT_ERP_PREFERENCES, type ErpPreferences } from "@/lib/platform/preferences"
import { readErpPreferences, writeErpPreferences } from "@/lib/platform/user-preferences-storage"

export function UserPreferencesCard() {
  const { setTheme } = useTheme()
  const [prefs, setPrefs] = useState<ErpPreferences>(DEFAULT_ERP_PREFERENCES)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setPrefs(readErpPreferences())
    setReady(true)
  }, [])

  function update(partial: Partial<ErpPreferences>) {
    const next = writeErpPreferences(partial)
    setPrefs(next)
    if (partial.theme) setTheme(partial.theme)
  }

  if (!ready) return null

  return (
    <Card data-testid="user-preferences-card">
      <CardHeader>
        <CardTitle>Mis preferencias</CardTitle>
        <p className="text-sm text-muted-foreground">
          Idioma, tema y densidad de tablas. Se guardan para ti en este navegador.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="pref-language">Idioma</Label>
            <Select
              value={prefs.language}
              onValueChange={(value) => update({ language: value as ErpPreferences["language"] })}
            >
              <SelectTrigger id="pref-language" data-testid="pref-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pref-theme">Tema</Label>
            <Select
              value={prefs.theme}
              onValueChange={(value) => update({ theme: value as ErpPreferences["theme"] })}
            >
              <SelectTrigger id="pref-theme" data-testid="pref-theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Oscuro</SelectItem>
                <SelectItem value="light">Claro</SelectItem>
                <SelectItem value="system">Según el sistema</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pref-density">Densidad de tablas</Label>
            <Select
              value={prefs.tableDensity}
              onValueChange={(value) => update({ tableDensity: value as ErpPreferences["tableDensity"] })}
            >
              <SelectTrigger id="pref-density" data-testid="pref-density">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comfortable">Cómoda</SelectItem>
                <SelectItem value="medium">Normal</SelectItem>
                <SelectItem value="compact">Compacta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
