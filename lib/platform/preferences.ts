export type ErpLanguage = "es" | "en";
export type ErpTheme = "light" | "dark" | "system";
export type ErpTableDensity = "compact" | "medium" | "comfortable";

export interface ErpPreferences {
  language: ErpLanguage;
  theme: ErpTheme;
  tableDensity: ErpTableDensity;
  currency: "MXN" | "USD";
  dateFormat: "dd/MM/yyyy" | "MM/dd/yyyy" | "yyyy-MM-dd";
  timeZone: string;
  menuMode: "standard" | "compact";
  printFormat: "letter" | "a4" | "ticket";
}

export const DEFAULT_ERP_PREFERENCES: ErpPreferences = {
  language: "es",
  theme: "dark",
  tableDensity: "medium",
  currency: "MXN",
  dateFormat: "dd/MM/yyyy",
  timeZone: "America/Mexico_City",
  menuMode: "standard",
  printFormat: "letter",
};

export function mergeErpPreferences(
  preferences?: Partial<ErpPreferences> | null,
): ErpPreferences {
  return { ...DEFAULT_ERP_PREFERENCES, ...(preferences ?? {}) };
}

export function normalizeLocale(locale?: string | null): ErpLanguage {
  const normalized = (locale ?? "es").toLowerCase();
  if (normalized.startsWith("en")) return "en";
  return "es";
}

export function formatCurrency(
  value: number,
  preferences: ErpPreferences,
): string {
  return new Intl.NumberFormat(
    preferences.language === "en" ? "en-US" : "es-MX",
    {
      style: "currency",
      currency: preferences.currency,
    },
  ).format(value);
}
