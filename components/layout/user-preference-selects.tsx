"use client";

import { useEffect, useState } from "react";
import { Languages, MonitorCog, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  normalizeLocale,
  type ErpLanguage,
  type ErpTheme,
} from "@/lib/platform/preferences";

const USER_LANGUAGE_KEY = "nexo_user_language";

interface UserPreferenceSelectsProps {
  compact?: boolean;
  className?: string;
}

export function UserPreferenceSelects({
  compact = false,
  className,
}: UserPreferenceSelectsProps) {
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState<ErpLanguage>("es");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(USER_LANGUAGE_KEY);
    setLanguage(normalizeLocale(stored ?? navigator.language));
  }, []);

  function changeLanguage(value: ErpLanguage) {
    setLanguage(value);
    if (typeof window !== "undefined")
      window.localStorage.setItem(USER_LANGUAGE_KEY, value);
    document.documentElement.lang = value;
  }

  const themeValue = (theme ?? "dark") as ErpTheme;

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex items-center gap-2",
          compact && "flex-col items-stretch",
          className,
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Select
                value={language}
                onValueChange={(value) => changeLanguage(value as ErpLanguage)}
              >
                <SelectTrigger
                  className={cn("h-9", compact ? "w-full" : "w-[118px]")}
                  data-testid="language-select"
                >
                  <Languages className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            Idioma de la interfaz. Inglés queda preparado por módulo.
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Select
                value={themeValue}
                onValueChange={(value) => setTheme(value)}
              >
                <SelectTrigger
                  className={cn("h-9", compact ? "w-full" : "w-[126px]")}
                  data-testid="theme-select"
                >
                  {themeValue === "light" ? (
                    <Sun className="mr-2 h-4 w-4" />
                  ) : themeValue === "system" ? (
                    <MonitorCog className="mr-2 h-4 w-4" />
                  ) : (
                    <Moon className="mr-2 h-4 w-4" />
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
          <TooltipContent>
            Tema visual guardado para este usuario.
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
