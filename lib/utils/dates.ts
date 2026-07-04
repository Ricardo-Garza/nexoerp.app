import { Timestamp } from "firebase/firestore"

/** Normaliza los valores de fecha de Firestore (Timestamp | string | number | Date) a Date. */
export function asDate(value: Timestamp | string | number | Date | null | undefined): Date {
  if (value == null) return new Date(NaN)
  if (value instanceof Date) return value
  if (value instanceof Timestamp) return value.toDate()
  if (typeof value === "object" && "toDate" in value) return (value as Timestamp).toDate()
  return new Date(value)
}
