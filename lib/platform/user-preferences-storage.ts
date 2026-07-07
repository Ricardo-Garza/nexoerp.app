import {
  DEFAULT_ERP_PREFERENCES,
  mergeErpPreferences,
  normalizeLocale,
  type ErpPreferences,
} from "@/lib/platform/preferences";

const STORAGE_KEY = "nexo_erp_preferences";
/** Clave previa usada por el selector del header; se mantiene como espejo. */
const LEGACY_LANGUAGE_KEY = "nexo_user_language";

export const PREFERENCES_CHANGED_EVENT = "nexo-preferences-changed";

export function readErpPreferences(): ErpPreferences {
  if (typeof window === "undefined") return DEFAULT_ERP_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const stored = raw ? (JSON.parse(raw) as Partial<ErpPreferences>) : {};
    const legacyLanguage = window.localStorage.getItem(LEGACY_LANGUAGE_KEY);
    if (!stored.language && legacyLanguage) {
      stored.language = normalizeLocale(legacyLanguage);
    }
    return mergeErpPreferences(stored);
  } catch {
    return DEFAULT_ERP_PREFERENCES;
  }
}

export function writeErpPreferences(
  partial: Partial<ErpPreferences>,
): ErpPreferences {
  const next = mergeErpPreferences({ ...readErpPreferences(), ...partial });
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.localStorage.setItem(LEGACY_LANGUAGE_KEY, next.language);
    window.dispatchEvent(new CustomEvent(PREFERENCES_CHANGED_EVENT));
  }
  return next;
}
