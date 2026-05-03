// ============================================================
// Mini ERP Pro Formatters
// ============================================================

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format date for input fields
 */
export function formatDateInput(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

/**
 * Format currency with symbol
 */
export function formatMoney(amount: number, currency: string = 'USD'): string {
  const symbols: Record<string, string> = {
    USD: '$',
    CNY: '¥',
    EUR: '€',
    GBP: '£',
  }
  const symbol = symbols[currency] || currency + ' '
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Format number with commas
 */
export function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Format percentage
 */
export function formatPercent(num: number): string {
  return `${num.toFixed(1)}%`
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    planned: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    in: 'bg-blue-100 text-blue-800',
    out: 'bg-red-100 text-red-800',
    adjustment: 'bg-purple-100 text-purple-800',
    income: 'bg-green-100 text-green-800',
    expense: 'bg-red-100 text-red-800',
    transfer: 'bg-blue-100 text-blue-800',
    purchase_payment: 'bg-orange-100 text-orange-800',
    production_cost: 'bg-indigo-100 text-indigo-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

/**
 * Get category badge color
 */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    fabric: 'bg-blue-100 text-blue-800',
    accessory: 'bg-purple-100 text-purple-800',
    other: 'bg-gray-100 text-gray-800',
  }
  return colors[category] || 'bg-gray-100 text-gray-800'
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Get month name from YYYY-MM
 */
export function getMonthName(monthStr: string): string {
  const [year, month] = monthStr.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(prefix: string = 'PUR', count: number = 1): string {
  const year = new Date().getFullYear()
  const num = String(count).padStart(4, '0')
  return `${prefix}-${year}-${num}`
}

/**
 * Generate production order number
 */
export function generateProductionNumber(count: number = 1): string {
  const year = new Date().getFullYear()
  const num = String(count).padStart(4, '0')
  return `PRD-${year}-${num}`
}