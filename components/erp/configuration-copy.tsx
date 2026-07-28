"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useErpPreferences } from "@/hooks/use-erp-preferences"
import { getUiText } from "@/lib/i18n/erp-ui"

export function ConfigurationHeading() {
  const { language } = useErpPreferences()
  const text = getUiText(language)
  return (
    <div>
      <h1 className="text-3xl font-bold text-balance">{text.settings.title}</h1>
      <p className="mt-2 text-muted-foreground">{text.settings.description}</p>
    </div>
  )
}

export function CompanyConfigurationSummary() {
  const { language } = useErpPreferences()
  const text = getUiText(language)
  const items = [
    language === "en" ? "Trade name and logo" : "Nombre comercial y logo",
    language === "en" ? "Primary color and default theme" : "Color principal y tema por defecto",
    language === "en" ? "Default language, currency and time zone" : "Idioma por defecto, moneda y zona horaria",
    language === "en" ? "Active and hidden modules" : "Modulos activos y ocultos",
    language === "en" ? "Permissions by role" : "Permisos por rol",
    language === "en" ? "Dashboard and table preferences" : "Preferencias de tablero y tablas",
    "CRM Momentum",
    language === "en" ? "Import/export options" : "Opciones de importacion/exportacion",
    language === "en" ? "Document templates" : "Plantillas de documentos",
    language === "en" ? "Visible quick actions" : "Acciones rapidas visibles",
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{text.settings.companyTitle}</CardTitle>
        <p className="text-sm text-muted-foreground">{text.settings.companyDescription}</p>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item} className="rounded-lg border bg-muted/30 p-3">
            <p className="text-sm font-medium">{item}</p>
            <Badge variant="outline" className="mt-2">
              {text.settings.ready}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function ConfigurationShortcutGrid() {
  const { language } = useErpPreferences()
  const text = getUiText(language)
  const links = [
    {
      href: "/dashboard/attributes",
      title: text.settings.productAttributes,
      description: text.settings.productAttributesHelp,
    },
    {
      href: "/dashboard/field-services",
      title: text.settings.fieldService,
      description: text.settings.fieldServiceHelp,
    },
    {
      href: "/dashboard/eprocurement",
      title: text.settings.digitalPurchases,
      description: text.settings.digitalPurchasesHelp,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="rounded-lg border p-4 transition-colors hover:bg-accent">
          <p className="font-medium">{link.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
        </Link>
      ))}
    </div>
  )
}
