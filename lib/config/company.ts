/**
 * Configuración central de empresa (white-label).
 * El nombre y branding se resuelven por variable de entorno con default DELAR,
 * de modo que la plataforma pueda re-marcarse sin tocar código (ADR 0001).
 */
export interface CompanyConfig {
  /** Nombre comercial de la plataforma (white-label) */
  appName: string
  /** Nombre corto para el logo/sidebar */
  shortName: string
  /** Descripción para metadatos */
  tagline: string
  /** Organización semilla activa */
  organizationId: string
  organizationName: string
  timezone: string
  baseCurrency: string
  locale: string
}

export const companyConfig: CompanyConfig = {
  // Plataforma madre: Nexo ERP; el tenant inicial es DELAR Foods (white-label §5)
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Nexo ERP",
  shortName: process.env.NEXT_PUBLIC_APP_SHORT_NAME ?? "Nexo ERP",
  tagline:
    process.env.NEXT_PUBLIC_APP_TAGLINE ??
    "Plataforma ERP empresarial multiempresa — operación food-service, distribución y producción",
  organizationId: "org-delar",
  organizationName: "DELAR Foods",
  timezone: "America/Monterrey",
  baseCurrency: "MXN",
  locale: "es-MX",
}
