import { z } from "zod"
import { INTENT_IDS } from "./nlu/training"

/**
 * Esquemas de validación. El plan analítico y la memoria de sesión viajan entre
 * cliente y servidor, así que SIEMPRE se validan: ningún valor del cliente llega a
 * una consulta sin pasar por aquí (listas blancas, longitudes y rangos acotados).
 */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const id = z.string().min(1).max(64)

export const periodSchema = z.object({
  from: isoDate,
  to: isoDate,
  label: z.string().max(120),
  kind: z.enum(["day", "week", "month", "quarter", "year", "ytd", "rolling"]),
  partial: z.boolean(),
})

export const filtersSchema = z
  .object({
    customerId: id.optional(),
    customerIds: z.array(id).max(20).optional(),
    families: z.array(z.string().max(40)).max(13).optional(),
    sku: z.string().max(80).optional(),
    skus: z.array(z.string().max(80)).max(60).optional(),
    warehouseId: id.optional(),
    industry: z.string().max(60).optional(),
    currency: z.enum(["MXN", "USD"]).optional(),
  })
  .strict()

export const visualizationSchema = z.enum(["auto", "chart", "bar", "line", "area", "donut", "table", "kpi", "none"])

export const analyticalQuerySchema = z
  .object({
    intent: z.enum(INTENT_IDS as [string, ...string[]]),
    dimension: z.enum(["day", "week", "month", "quarter", "year", "customer", "product", "family", "warehouse", "industry", "none"]).optional(),
    filters: filtersSchema,
    period: periodSchema.optional(),
    comparison: periodSchema.optional(),
    sort: z.enum(["asc", "desc"]),
    limit: z.number().int().min(1).max(50),
    visualization: visualizationSchema,
    minDaysOverdue: z.number().int().min(0).max(3650).optional(),
    inactiveDays: z.number().int().min(1).max(3650).optional(),
    horizonMonths: z.number().int().min(1).max(12).optional(),
  })
  .strict()
export type AnalyticalQuery = z.infer<typeof analyticalQuerySchema>

export const memorySchema = z
  .object({
    lastQuery: analyticalQuerySchema.nullable(),
    periods: z.array(periodSchema).max(4),
    customerId: id.nullable(),
    families: z.array(z.string().max(40)).max(13),
    turns: z.number().int().min(0).max(500),
    lastEvidence: z
      .object({ calc: z.string().max(1500), source: z.string().max(300), assumptions: z.array(z.string().max(300)).max(8) })
      .nullable(),
  })
  .strict()
export type SessionMemory = z.infer<typeof memorySchema>

export const EMPTY_MEMORY: SessionMemory = { lastQuery: null, periods: [], customerId: null, families: [], turns: 0, lastEvidence: null }

export const MAX_QUESTION_LENGTH = 400

export const requestSchema = z
  .object({
    question: z.string().trim().min(1).max(MAX_QUESTION_LENGTH),
    tenantId: id,
    memory: memorySchema.optional(),
  })
  .strict()
export type CopilotRequest = z.infer<typeof requestSchema>
