import { describe, expect, it } from "vitest";
import {
  DEFAULT_ERP_PREFERENCES,
  mergeErpPreferences,
  normalizeLocale,
} from "@/lib/platform/preferences";

describe("ERP preferences", () => {
  it("defaults to Spanish, dark theme and MXN formatting", () => {
    expect(DEFAULT_ERP_PREFERENCES.language).toBe("es");
    expect(DEFAULT_ERP_PREFERENCES.theme).toBe("dark");
    expect(DEFAULT_ERP_PREFERENCES.currency).toBe("MXN");
    expect(DEFAULT_ERP_PREFERENCES.timeZone).toBe("America/Mexico_City");
  });

  it("merges partial tenant preferences without losing defaults", () => {
    const merged = mergeErpPreferences({
      language: "en",
      tableDensity: "compact",
    });

    expect(merged.language).toBe("en");
    expect(merged.tableDensity).toBe("compact");
    expect(merged.currency).toBe("MXN");
    expect(merged.dateFormat).toBe("dd/MM/yyyy");
  });

  it("normalizes supported locales and falls back to Spanish", () => {
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("es-MX")).toBe("es");
    expect(normalizeLocale("fr-FR")).toBe("es");
  });
});
