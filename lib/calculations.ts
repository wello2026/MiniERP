// ============================================================
// Mini ERP Pro Calculations
// ============================================================

import { Account, Transaction, Supplier, Item, Purchase, ProductionOrder, Expense } from './types'

/**
 * Calculate account balance
 * Balance = opening_balance + incoming - outgoing
 */
export function calculateAccountBalance(
  account: Account,
  transactions: Transaction[]
): number {
  let balance = account.opening_balance || 0

  transactions.forEach(t => {
    // Money coming IN to this account
    if (t.to_account_id === account.id) {
      balance += t.amount_base || 0
    }
    // Money going OUT of this account
    if (t.from_account_id === account.id) {
      balance -= t.amount_base || 0
    }
  })

  return balance
}

/**
 * Calculate supplier balance
 * Balance = total purchases - total paid
 */
export function calculateSupplierBalance(
  supplier: Supplier,
  purchases: Purchase[],
  transactions: Transaction[]
): number {
  const supplierPurchases = purchases.filter(p => p.supplier_id === supplier.id)
  const totalPurchases = supplierPurchases.reduce((sum, p) => sum + (p.total_base || 0), 0)
  const totalPaid = supplierPurchases.reduce((sum, p) => sum + (p.paid_amount || 0) * (p.exchange_rate || 1), 0)
  return totalPurchases - totalPaid
}

/**
 * Calculate item stock
 * Stock = SUM(in) - SUM(out) + adjustments
 */
export function calculateItemStock(
  item: Item,
  movements: { type: string; quantity: number }[]
): number {
  let stock = 0
  movements.forEach(m => {
    if (m.type === 'in') stock += m.quantity || 0
    if (m.type === 'out') stock -= m.quantity || 0
    if (m.type === 'adjustment') stock += m.quantity || 0
  })
  return Math.max(0, stock)
}

/**
 * Calculate average cost
 */
export function calculateAverageCost(
  movements: { type: string; quantity: number; unit_cost: number }[]
): number {
  let totalCost = 0
  let totalQty = 0

  movements.forEach(m => {
    if (m.type === 'in') {
      totalCost += (m.quantity || 0) * (m.unit_cost || 0)
      totalQty += m.quantity || 0
    }
  })

  return totalQty > 0 ? totalCost / totalQty : 0
}

/**
 * Calculate stock value
 */
export function calculateStockValue(stock: number, avgCost: number): number {
  return stock * avgCost
}

/**
 * Convert amount to base currency
 */
export function convertToBaseCurrency(
  amount: number,
  exchangeRate: number
): number {
  return amount * exchangeRate
}

/**
 * Calculate purchase totals
 */
export function calculatePurchaseTotals(
  items: { quantity: number; unit_cost: number; currency: string }[],
  exchangeRate: number
): { subtotal: number; total_base: number } {
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = (item.quantity || 0) * (item.unit_cost || 0)
    if (item.currency === 'CNY') {
      return sum + itemTotal * exchangeRate
    }
    return sum + itemTotal
  }, 0)

  return { subtotal, total_base: subtotal }
}

/**
 * Calculate production material cost from BOM
 */
export function calculateMaterialCost(
  bomItems: { item_id: number; quantity_per_unit: number; wastage_percent: number; item?: { default_cost?: number } }[],
  productionQuantity: number,
  itemCosts: Map<number, number>
): number {
  let totalCost = 0

  bomItems.forEach(bom => {
    const baseQty = (bom.quantity_per_unit || 0) * productionQuantity
    const wastageQty = baseQty * ((bom.wastage_percent || 0) / 100)
    const totalQty = baseQty + wastageQty
    const unitCost = itemCosts.get(bom.item_id) || 0
    totalCost += totalQty * unitCost
  })

  return totalCost
}

/**
 * Check if stock is sufficient for production
 */
export function checkStockAvailability(
  bomItems: { item_id: number; quantity_per_unit: number; wastage_percent: number }[],
  productionQuantity: number,
  currentStock: Map<number, number>
): { sufficient: boolean; shortages: { item_id: number; required: number; available: number }[] } {
  const shortages: { item_id: number; required: number; available: number }[] = []

  bomItems.forEach(bom => {
    const baseQty = (bom.quantity_per_unit || 0) * productionQuantity
    const wastageQty = baseQty * ((bom.wastage_percent || 0) / 100)
    const required = baseQty + wastageQty
    const available = currentStock.get(bom.item_id) || 0

    if (available < required) {
      shortages.push({
        item_id: bom.item_id,
        required: Math.ceil(required),
        available: available
      })
    }
  })

  return {
    sufficient: shortages.length === 0,
    shortages
  }
}

/**
 * Calculate cost per unit for production
 */
export function calculateCostPerUnit(
  materialCost: number,
  laborCost: number,
  extraCost: number,
  quantity: number
): number {
  if (quantity <= 0) return 0
  return (materialCost + laborCost + extraCost) / quantity
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Calculate monthly totals
 */
export function getMonthlyTotals(
  transactions: Transaction[],
  month: string
): { income: number; expenses: number; net: number } {
  const monthTransactions = transactions.filter(t => t.date?.startsWith(month))

  const income = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount_base || 0), 0)

  const expenses = monthTransactions
    .filter(t => t.type === 'expense' || t.type === 'purchase_payment')
    .reduce((sum, t) => sum + (t.amount_base || 0), 0)

  return { income, expenses, net: income - expenses }
}

/**
 * Calculate supplier totals
 */
export function getSupplierTotals(
  purchases: Purchase[],
  supplierId: number
): { totalPurchases: number; totalPaid: number; balance: number } {
  const supplierPurchases = purchases.filter(p => p.supplier_id === supplierId)

  const totalPurchases = supplierPurchases.reduce((sum, p) => sum + (p.total_base || 0), 0)
  const totalPaid = supplierPurchases.reduce((sum, p) => sum + (p.paid_amount || 0) * (p.exchange_rate || 1), 0)

  return {
    totalPurchases,
    totalPaid,
    balance: totalPurchases - totalPaid
  }
}