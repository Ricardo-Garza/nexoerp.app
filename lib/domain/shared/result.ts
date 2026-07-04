/** Resultado tipado para operaciones de dominio: nunca lanzar strings sueltos a la UI. */
export type DomainErrorCode =
  | "not_found"
  | "forbidden"
  | "validation"
  | "conflict"
  | "state_transition"
  | "insufficient_stock"
  | "lot_not_sellable"
  | "duplicate_operation"

export interface DomainError {
  code: DomainErrorCode
  /** Mensaje operativo en español, apto para mostrarse al usuario */
  message: string
  details?: Record<string, string | number | boolean | null>
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: DomainError }

export const ok = <T>(value: T): Result<T> => ({ ok: true, value })
export const err = <T = never>(
  code: DomainErrorCode,
  message: string,
  details?: DomainError["details"],
): Result<T> => ({ ok: false, error: { code, message, details } })
