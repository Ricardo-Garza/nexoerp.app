"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { DEFAULT_ERP_PREFERENCES, normalizeLocale, type ErpPreferences } from "@/lib/platform/preferences"
import {
  PREFERENCES_CHANGED_EVENT,
  readErpPreferences,
  writeErpPreferences,
} from "@/lib/platform/user-preferences-storage"

export function useErpPreferences() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [preferences, setPreferences] = useState<ErpPreferences>(DEFAULT_ERP_PREFERENCES)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const sync = () => {
      const next = readErpPreferences()
      setPreferences(next)
      document.documentElement.lang = next.language
      setTheme(next.theme)
      setReady(true)
    }
    sync()
    window.addEventListener(PREFERENCES_CHANGED_EVENT, sync)
    return () => window.removeEventListener(PREFERENCES_CHANGED_EVENT, sync)
  }, [setTheme])

  useEffect(() => {
    if (!ready) return
    if (theme && theme !== preferences.theme) {
      writeErpPreferences({ theme: theme as ErpPreferences["theme"] })
    }
  }, [preferences.theme, ready, theme])

  function updatePreferences(partial: Partial<ErpPreferences>) {
    const next = writeErpPreferences(partial)
    setPreferences(next)
    if (partial.language) document.documentElement.lang = normalizeLocale(partial.language)
    if (partial.theme) setTheme(partial.theme)
    return next
  }

  return {
    preferences,
    ready,
    language: preferences.language,
    theme: preferences.theme,
    resolvedTheme,
    updatePreferences,
  }
}
