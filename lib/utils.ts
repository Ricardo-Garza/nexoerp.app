import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeOrderStatus(status: unknown): string {
  if (typeof status === "string") return status
  if (status && typeof status === "object" && "status" in status) {
    const statusField = (status as { status?: unknown }).status
    return typeof statusField === "string" ? statusField : "unknown"
  }
  return "unknown"
}
