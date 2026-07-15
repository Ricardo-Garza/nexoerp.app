"use client"

import { Languages, MonitorCog, Moon, Sun } from "lucide-react"
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
import { useErpPreferences } from "@/hooks/use-erp-preferences"
import { getUiText } from "@/lib/i18n/erp-ui"
import { type ErpLanguage, type ErpTheme } from "@/lib/platform/preferences"
import { cn } from "@/lib/utils"

interface UserPreferenceSelectsProps {
  compact?: boolean
  className?: string
}

export function UserPreferenceSelects({ compact = false, className }: UserPreferenceSelectsProps) {
  const { language, theme, updatePreferences } = useErpPreferences()
  const text = getUiText(language)
  const themeValue = theme as ErpTheme

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
              <Select value={language} onValueChange={(value) => updatePreferences({ language: value as ErpLanguage })}>
                <SelectTrigger
                  className={cn("h-10", compact ? "w-full" : "w-[142px]")}
                  data-testid="language-select"
                  title={text.language.label}
                >
                  <Languages className="mr-2 h-4 w-4 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">{text.language.spanish}</SelectItem>
                  <SelectItem value="en">{text.language.english}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TooltipTrigger>
          <TooltipContent>{text.language.tooltip}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="shrink-0">
              <Select value={themeValue} onValueChange={(value) => updatePreferences({ theme: value as ErpTheme })}>
                <SelectTrigger
                  className={cn("h-10", compact ? "w-full" : "w-[142px]")}
                  data-testid="theme-select"
                  title={text.theme.label}
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
                  <SelectItem value="dark">{text.theme.dark}</SelectItem>
                  <SelectItem value="light">{text.theme.light}</SelectItem>
                  <SelectItem value="system">{text.theme.system}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TooltipTrigger>
          <TooltipContent>{text.theme.tooltip}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
