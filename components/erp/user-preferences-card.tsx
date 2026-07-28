"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useErpPreferences } from "@/hooks/use-erp-preferences"
import { getUiText } from "@/lib/i18n/erp-ui"
import type { ErpPreferences } from "@/lib/platform/preferences"

export function UserPreferencesCard() {
  const { preferences, ready, language, updatePreferences } = useErpPreferences()
  const text = getUiText(language)

  if (!ready) return null

  return (
    <Card data-testid="user-preferences-card">
      <CardHeader>
        <CardTitle>{text.settings.preferencesTitle}</CardTitle>
        <p className="text-sm text-muted-foreground">{text.settings.preferencesDescription}</p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="pref-language">{text.language.label}</Label>
            <Select
              value={preferences.language}
              onValueChange={(value) => updatePreferences({ language: value as ErpPreferences["language"] })}
            >
              <SelectTrigger id="pref-language" data-testid="pref-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">{text.language.spanish}</SelectItem>
                <SelectItem value="en">{text.language.english}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pref-theme">{text.theme.label}</Label>
            <Select
              value={preferences.theme}
              onValueChange={(value) => updatePreferences({ theme: value as ErpPreferences["theme"] })}
            >
              <SelectTrigger id="pref-theme" data-testid="pref-theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">{text.theme.dark}</SelectItem>
                <SelectItem value="light">{text.theme.light}</SelectItem>
                <SelectItem value="system">{text.theme.systemLong}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pref-density">{text.density.label}</Label>
            <Select
              value={preferences.tableDensity}
              onValueChange={(value) => updatePreferences({ tableDensity: value as ErpPreferences["tableDensity"] })}
            >
              <SelectTrigger id="pref-density" data-testid="pref-density">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comfortable">{text.density.comfortable}</SelectItem>
                <SelectItem value="medium">{text.density.medium}</SelectItem>
                <SelectItem value="compact">{text.density.compact}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
