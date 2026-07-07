"use client"

import { useEffect, useState } from "react"
import { Languages, MonitorCog, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { normalizeLocale, type ErpLanguage, type ErpTheme } from "@/lib/platform/preferences"
import { readErpPreferences, writeErpPreferences } from "@/lib/platform/user-preferences-storage"
import { cn } from "@/lib/utils"

interface UserPreferenceSelectsProps {
  compact?: boolean
  className?: string
}

export function UserPreferenceSelects({ compact = false, className }: UserPreferenceSelectsProps) {
  const { theme, setTheme } = useTheme()
  const [language, setLanguage] = useState<ErpLanguage>("es")

  useEffect(() => {
    if (typeof window === "undefined") return
    const nextLanguage = normalizeLocale(readErpPreferences().language || navigator.language)
    setLanguage(nextLanguage)
    document.documentElement.lang = nextLanguage
  }, [])

  function changeLanguage(value: ErpLanguage) {
    setLanguage(value)
    writeErpPreferences({ language: value })
    document.documentElement.lang = value
  }

  const themeValue = (theme ?? "dark") as ErpTheme

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex items-center gap-3 overflow-visible",
          compact && "flex-col items-stretch",
          className,
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="shrink-0">
              <Select value={language} onValueChange={(value) => changeLanguage(value as ErpLanguage)}>
                <SelectTrigger
                  className={cn("h-10", compact ? "w-full" : "w-[142px]")}
                  data-testid="language-select"
                >
                  <Languages className="mr-2 h-4 w-4 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TooltipTrigger>
          <TooltipContent>Idioma de la interfaz. Inglés queda preparado por módulo.</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="shrink-0">
              <Select value={themeValue} onValueChange={(value) => setTheme(value)}>
                <SelectTrigger
                  className={cn("h-10", compact ? "w-full" : "w-[142px]")}
                  data-testid="theme-select"
                >
                  {themeValue === "light" ? (
                    <Sun className="mr-2 h-4 w-4 shrink-0" />
                  ) : themeValue === "system" ? (
                    <MonitorCog className="mr-2 h-4 w-4 shrink-0" />
                  ) : (
                    <Moon className="mr-2 h-4 w-4 shrink-0" />
                  )}
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Oscuro</SelectItem>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TooltipTrigger>
          <TooltipContent>Tema visual guardado para este usuario.</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
