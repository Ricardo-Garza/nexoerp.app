import type { SalesOrderLine } from "@/lib/types"

/**
 * Calculate totals for a sales order line
 */
export function calculateLineTotal(line: SalesOrderLine): SalesOrderLine {
  if (line.type !== "product") {
    return line
  }

  const quantity = line.quantity || 0
  const unitPrice = line.unitPrice || 0
  const subtotal = quantity * unitPrice

  // Calculate discount
  let discountAmount = 0
  if (line.discount) {
    if (line.discount <= 100) {
      // Percentage
      discountAmount = (subtotal * line.discount) / 100
    } else {
      // Fixed amount
      discountAmount = line.discount
    }
  }

  const subtotalAfterDiscount = subtotal - discountAmount

  // Calculate tax
  const taxRate = line.tax || 0
  const taxAmount = (subtotalAfterDiscount * taxRate) / 100

  const total = subtotalAfterDiscount + taxAmount

  return {
    ...line,
    subtotal,
    discountAmount,
    taxAmount,
    total,
  }
}

/**
 * Calculate totals for all lines in an order
 */
export function calculateOrderTotals(lines: SalesOrderLine[]): {
  subtotal: number
  taxTotal: number
  discountTotal: number
  total: number
} {
  let subtotal = 0
  let taxTotal = 0
  let discountTotal = 0
  let total = 0

  lines.forEach((line) => {
    if (line.type === "product") {
      const calculated = calculateLineTotal(line)
      subtotal += calculated.subtotal || 0
      taxTotal += calculated.taxAmount || 0
      discountTotal += calculated.discountAmount || 0
      total += calculated.total || 0
    }
  })

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    total: Math.round(total * 100) / 100,
  }
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = "MXN"): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0)
}
