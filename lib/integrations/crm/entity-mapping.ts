import type { MomentumContact } from "./types"

/**
 * Mapeo declarativo Nexo ↔ CRM Momentum. Documenta qué entidad del ERP
 * corresponde a cada entidad del CRM y cómo se traducen los campos clave.
 * Ver docs/CRM_MOMENTUM_EMBED_AND_SYNC.md.
 */
export interface EntityMap {
  nexo: string
  crm: string
  direction: "nexo→crm" | "crm→nexo" | "bidireccional"
  keyFields: string[]
}

export const CRM_ENTITY_MAP: EntityMap[] = [
  { nexo: "Clientes", crm: "Contacts (company)", direction: "bidireccional", keyFields: ["rfc", "email"] },
  { nexo: "Contactos", crm: "Contacts (person)", direction: "bidireccional", keyFields: ["email", "phone"] },
  { nexo: "Prospectos", crm: "Leads / cold contacts", direction: "crm→nexo", keyFields: ["email"] },
  { nexo: "Oportunidades", crm: "Deals", direction: "crm→nexo", keyFields: ["title", "contactId"] },
  { nexo: "Actividades", crm: "Activities", direction: "bidireccional", keyFields: ["contactId", "scheduledAt"] },
  { nexo: "Cotizaciones", crm: "Deals (quote stage)", direction: "nexo→crm", keyFields: ["folio"] },
  { nexo: "Pedidos", crm: "Deals (won stage)", direction: "nexo→crm", keyFields: ["folio"] },
]

/** Traduce un cliente de Nexo al formato de contacto Momentum (para push). */
export function customerToMomentumContact(customer: {
  nombre?: string
  email?: string | null
  telefono?: string | null
  empresa?: string | null
}): Omit<MomentumContact, "id" | "createdAt" | "updatedAt"> {
  return {
    name: customer.nombre ?? "Sin nombre",
    email: customer.email ?? null,
    phone: customer.telefono ?? null,
    company: customer.empresa ?? customer.nombre ?? null,
    source: "nexo-erp",
    temperature: "warm",
    score: 50,
    notes: "Sincronizado desde Nexo ERP",
  }
}
