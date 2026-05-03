// ============================================================
// Mini ERP Pro Server Actions
// ============================================================

'use server'

import { revalidatePath } from 'next/cache'
import { supabase, isConfigured } from './supabase'
import { generateInvoiceNumber, generateProductionNumber } from './formatters'

// Generic error handler
function handleError(error: unknown): { success: false; error: string } {
  console.error('Server Action Error:', error)
  return { success: false, error: error instanceof Error ? error.message : 'An error occurred' }
}

// ============================================================
// Settings Actions
// ============================================================

export async function getSettings() {
  if (!isConfigured()) return null
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .single()
  if (error && error.code !== 'PGRST116') return null
  return data
}

export async function updateSettings(formData: {
  company_name: string
  base_currency: string
  secondary_currency: string
}) {
  if (!isConfigured()) return { success: false, error: 'Not configured' }
  try {
    const { error } = await supabase
      .from('settings')
      .update(formData)
      .eq('id', 1)
    if (error) throw error
    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    return handleError(error)
  }
}

// ============================================================
// Exchange Rate Actions
// ============================================================

export async function getExchangeRates() {
  if (!isConfigured()) return []
  const { data } = await supabase
    .from('exchange_rates')
    .select('*')
    .order('date', { ascending: false })
  return data || []
}

export async function upsertExchangeRate(formData: {
  from_currency: string
  to_currency: string
  rate: number
  date: string
}) {
  if (!isConfigured()) return { success: false, error: 'Not configured' }
  try {
    const { error } = await supabase
      .from('exchange_rates')
      .upsert([formData], { onConflict: 'from_currency,to_currency,date' })
    if (error) throw error
    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    return handleError(error)
  }
}

// ============================================================
// Account Actions
// ============================================================

export async function getAccounts() {
  if (!isConfigured()) return []
  const { data } = await supabase
    .from('accounts')
    .select('*')
    .order('type', { ascending: true })
  return data || []
}

export async function createAccount(formData: {
  name: string
  type: string
  currency: string
  opening_balance: number
}) {
  if (!isConfigured()) return { success: false, error: 'Not configured' }
  try {
    const { error } = await supabase
      .from('accounts')
      .insert([formData])
    if (error) throw error
    revalidatePath('/treasury')
    return { success: true }
  } catch (error) {
    return handleError(error)
  }
}

// ============================================================
// Transaction Actions
// ============================================================

export async function getTransactions(limit: number = 50) {
  if (!isConfigured()) return []
  const { data } = await supabase
    .from('transactions')
    .select(`
      *,
      from_account:accounts!from_account_id(id, name, type),
      to_account:accounts!to_account_id(id, name, type)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)
  return data || []
}

export async function createTransaction(formData: {
  date: string
  type: string
  from_account_id?: number | null
  to_account_id?: number | null
  amount: number
  currency: string
  exchange_rate: number
  amount_base: number
  reference_type?: string | null
  reference_id?: number | null
  note?: string | null
}) {
  if (!isConfigured()) return { success: false, error: 'Not configured' }
  try {
    const { error } = await supabase
      .from('transactions')
      .insert([{
        date: formData.date,
        type: formData.type,
        from_account_id: formData.from_account_id || null,
        to_account_id: formData.to_account_id || null,
        amount: formData.amount,
        currency: formData.currency,
        exchange_rate: formData.exchange_rate || 1,
        amount_base: formData.amount_base,
        reference_type: formData.reference_type || null,
        reference_id: formData.reference_id || null,
        note: formData.note || null,
      }])
    if (error) throw error
    revalidatePath('/treasury')
    return { success: true }
  } catch (error) {
    return handleError(error)
  }
}

// ============================================================
// Supplier Actions
// ============================================================

export async function getSuppliers() {
  if (!isConfigured()) return []
  const { data } = await supabase
    .from('suppliers')
    .select('*')
    .order('name')
  return data || []
}

export async function getSupplier(id: number) {
  if (!isConfigured()) return null
  const { data } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export async function createSupplier(formData: {
  name: string
  country: string
  currency: string
  phone?: string
  notes?: string
}) {
  if (!isConfigured()) return { success: false, error: 'Not configured' }
  try {
    const { error } = await supabase
      .from('suppliers')
      .insert([formData])
    if (error) throw error
    revalidatePath('/suppliers')
    return { success: true }
  } catch (error) {
    return handleError(error)
  }
}

export async function updateSupplier(id: number, formData: {
  name: string
  country: string
  currency: string
  phone?: string
  notes?: string
}) {
  if (!isConfigured()) return { success: false, error: 'Not configured' }
  try {
    const { error } = await supabase
      .from('suppliers')
      .update(formData)
      .eq('id', id)
    if (error) throw error
    revalidatePath('/suppliers')
    return { success: true }
  } catch (error) {
    return handleError(error)
  }
}

// ============================================================
// Item Actions
// ============================================================

export async function getItems() {
  if (!isConfigured()) return []
  const { data } = await supabase
    .from('items')
    .select('*')
    .order('category', { ascending: true })
  return data || []
}

export async function getItem(id: number) {
  if (!isConfigured()) return null
  const { data } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export async function createItem(formData: {
  name: string
  category: string
  unit: string
  default_cost: number
  currency: string
  reorder_level: number
}) {
  if (!isConfigured()) return { success: false, error: 'Not configured' }
  try {
    const { error } = await supabase
      .from('items')
      .insert([formData])
    if (error) throw error
    revalidatePath('/inventory')
    return { success: true }
  } catch (error) {
    return handleError(error)
  }
}

export async function updateItem(id: number, formData: {
  name: string
  category: string
  unit: string
  default_cost: number
  currency: string
  reorder_level: number
}) {
  if (!isConfigured()) return { success: false, error: 'Not configured' }
  try {
    const { error } = await supabase
      .from('items')
      .update(formData)
      .eq('id', id)
    if (error) throw error
    revalidatePath('/inventory')
    return { success: true }
  } catch (error) {
    return handleError(error)
  }
}

// ============================================================
// Purchase Actions
// ============================================================

export async function getPurchases() {
  if (!isConfigured()) return []
  const { data } = await supabase
    .from('purchases')
    .select(`
      *,
      supplier:suppliers(id, name, country),
      items:purchase_items(
        *,
        item:items(id, name, unit)
      )
    `)
    .order('created_at', { ascending: false })
  return data || []
}

export async function getPurchase(id: number) {
  if (!isConfigured()) return null
  const { data } = await supabase
    .from('purchases')
    .select(`
      *,
      supplier:suppliers(id, name, country),
      items:purchase_items(
        *,
        item:items(id, name, unit, category)
      )
    `)
    .eq('id', id)
    .single()
  return data
}

export async function createPurchase(formData: {
  supplier_id: number
  date: string
  currency: string
  exchange_rate: number
  paid_amount: number
  note: string
  items: { item_id: number; quantity: number; unit_cost: number }[]
}) {
  if (!isConfigured()) return { success: false, error: 'Not configured' }
  try {
    // Get next invoice number
    const { count } = await supabase
      .from('purchases')
      .select('*', { count: 'exact', head: true })
    const invoiceNo = generateInvoiceNumber('PUR', (count || 0) + 1)

    // Calculate subtotal
    const subtotal = formData.items.reduce((sum, item) => {
      return sum + item.quantity * item.unit_cost
    }, 0)
    const total_base = subtotal * (formData.exchange_rate || 1)

    // Create purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert([{
        supplier_id: formData.supplier_id,
        date: formData.date,
        invoice_no: invoiceNo,
        currency: formData.currency,
        exchange_rate: formData.exchange_rate || 1,
        subtotal,
        total_base,
        paid_amount: formData.paid_amount || 0,
        note: formData.note || null,
      }])
      .select()
      .single()

    if (purchaseError) throw purchaseError
    if (!purchase) throw new Error('Failed to create purchase')

    // Create purchase items
    const purchaseItems = formData.items.map(item => ({
      purchase_id: purchase.id,
      item_id: item.item_id,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      total_cost: item.quantity * item.unit_cost,
    }))

    const { error: itemsError } = await supabase
      .from('purchase_items')
      .insert(purchaseItems)

    if (itemsError) throw itemsError

    // Create inventory movements
    const movements = formData.items.map(item => ({
      date: formData.date,
      item_id: item.item_id,
      type: 'in',
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      reference_type: 'purchase',
      reference_id: purchase.id,
      note: `Purchase ${invoiceNo}`,
    }))

    const { error: movError } = await supabase
      .from('inventory_movements')
      .insert(movements)

    if (movError) throw movError

    // Create payment transaction if paid
    if (formData.paid_amount > 0) {
      const treasuryAccount = await supabase
        .from('accounts')
        .select('id')
        .eq('type', 'treasury')
        .eq('currency', formData.currency)
        .single()

      if (treasuryAccount.data) {
        await supabase
          .from('transactions')
          .insert([{
            date: formData.date,
            type: 'purchase_payment',
            from_account_id: treasuryAccount.data.id,
            amount: formData.paid_amount,
            currency: formData.currency,
            exchange_rate: formData.exchange_rate || 1,
            amount_base: formData.paid_amount * (formData.exchange_rate || 1),
            reference_type: 'purchase',
            reference_id: purchase.id,
            note: `Payment for ${invoiceNo}`,
          }])
      }
    }

    revalidatePath('/purchases')
    revalidatePath('/inventory')
    revalidatePath('/treasury')
    return { success: true, invoice_no: invoiceNo }
  } catch (error) {
    return handleError(error)
  }
}

// ============================================================
// Inventory Movement Actions
// ============================================================

export async function getInventoryMovements(limit: number = 100) {
  if (!isConfigured()) return []
  const { data } = await supabase
    .from('inventory_movements')
    .select(`
      *,
      item:items(id, name, unit)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)
  return data || []
}

export async function createInventoryAdjustment(formData: {
  date: string
  item_id: number
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  unit_cost: number
  note: string
}) {
  if (!isConfigured()) return { success: false, error: 'Not configured' }
  try {
    const { error } = await supabase
      .from('inventory_movements')
      .insert([formData])
    if (error) throw error
    revalidatePath('/inventory')
    return { success: true }
  } catch (error) {
    return handleError(error)
  }
}

// ============================================================
// Product Actions
// ============================================================

export async function getProducts() {
  if (!isConfigured()) return []
  const { data } = await supabase
    .from('products')
    .select(`
      *,
      bom_items:bom_items(
        *,
        item:items(id, name, unit, default_cost)
      )
    `)
    .order('name')
  return data || []
}

export async function getProduct(id: number) {
  if (!isConfigured()) return null
  const { data } = await supabase
    .from('products')
    .select(`
      *,
      bom_items:bom_items(
        *,
        item:items(id, name, unit, category, default_cost)
      )
    `)
    .eq('id', id)
    .single()
  return data
}

export async function createProduct(formData: {
  name: string
  sku: string
  target_price: number
  notes?: string
}) {
  if (!isConfigured()) return { success: false, error: 'Not configured' }
  try {
    const { error } = await supabase
      .from('products')
      .insert([formData])
    if (error) throw error
    revalidatePath('/production')
    return { success: true }
  } catch (error) {
    return handleError(error)
  }
}

export async function updateProduct(id: number, formData: {
  name: string
  sku: string
  target_price: number
  notes?: string
}) {
  if (!isConfigured()) return { success: false, error: 'Not configured' }
  try {
    const { error } = await supabase
      .from('products')
      .update(formData)
      .eq('id', id)
    if (error) throw error
    revalidatePath('/production')
    return { success: true }
  } catch (error) {
    return handleError(error)
  }
}

// ============================================================
// BOM Actions
// ============================================================

export async function createBomItem(formData: {
  product_id: number
  item_id: number
  quantity_per_unit: number
  wastage_percent: number
}) {
  if (!isConfigured()) return { success: false, error: 'Not configured' }
  try {
    const { error } = await supabase
      .from('bom_items')
      .upsert([formData], { onConflict: 'product_id,item_id' })
    if (error) throw error
    revalidatePath('/production')
    return { success: true }
  } catch (error) {
    return handleError(error)
  }
}

export async function deleteBomItem(id: number) {
  if (!isConfigured()) return { success: false, error: 'Not configured' }
  try {
    const { error } = await supabase
      .from('bom_items')
      .delete()
      .eq('id', id)
    if (error) throw error
    revalidatePath('/production')
    return { success: true }
  } catch (error) {
    return handleError(error)
  }
}

// ============================================================
// Production Order Actions
// ============================================================

export async function getProductionOrders() {
  if (!isConfigured()) return []
  const { data } = await supabase
    .from('production_orders')
    .select(`
      *,
      product:products(id, name, sku)
    `)
    .order('created_at', { ascending: false })
  return data || []
}

export async function getProductionOrder(id: number) {
  if (!isConfigured()) return null
  const { data } = await supabase
    .from('production_orders')
    .select(`
      *,
      product:products(id, name, sku, bom_items(item_id, quantity_per_unit, wastage_percent))
    `)
    .eq('id', id)
    .single()
  return data
}

export async function createProductionOrder(formData: {
  date: string
  product_id: number
  quantity: number
  labor_cost: number
  extra_cost: number
  note: string
}) {
  if (!isConfigured()) return { success: false, error: 'Not configured' }
  try {
    // Get product with BOM
    const { data: product } = await supabase
      .from('products')
      .select(`
        *,
        bom_items:bom_items(
          *,
          item:items(id, default_cost)
        )
      `)
      .eq('id', formData.product_id)
      .single()

    if (!product || !product.bom_items?.length) {
      return { success: false, error: 'Product not found or has no BOM' }
    }

    // Get current inventory for items
    const itemIds = product.bom_items.map((b: { item_id: number }) => b.item_id)
    const { data: movements } = await supabase
      .from('inventory_movements')
      .select('item_id, type, quantity')
      .in('item_id', itemIds)

    // Calculate current stock per item
    const stockMap = new Map<number, number>()
    movements?.forEach(m => {
      const current = stockMap.get(m.item_id) || 0
      if (m.type === 'in') stockMap.set(m.item_id, current + m.quantity)
      if (m.type === 'out') stockMap.set(m.item_id, current - m.quantity)
    })

    // Calculate required materials and check availability
    const requiredMaterials: { item_id: number; quantity: number; cost: number }[] = []
    for (const bom of product.bom_items) {
      const baseQty = bom.quantity_per_unit * formData.quantity
      const wastage = baseQty * (bom.wastage_percent / 100)
      const totalQty = baseQty + wastage
      const cost = totalQty * (bom.item?.default_cost || 0)
      requiredMaterials.push({ item_id: bom.item_id, quantity: totalQty, cost })

      const available = stockMap.get(bom.item_id) || 0
      if (available < totalQty) {
        return {
          success: false,
          error: `Insufficient stock for item ID ${bom.item_id}. Required: ${totalQty}, Available: ${available}`
        }
      }
    }

    // Calculate material cost
    const material_cost = requiredMaterials.reduce((sum, m) => sum + m.cost, 0)
    const total_cost = material_cost + (formData.labor_cost || 0) + (formData.extra_cost || 0)
    const cost_per_unit = formData.quantity > 0 ? total_cost / formData.quantity : 0

    // Create production order
    const { data: order, error: orderError } = await supabase
      .from('production_orders')
      .insert([{
        date: formData.date,
        product_id: formData.product_id,
        quantity: formData.quantity,
        status: 'completed',
        material_cost,
        labor_cost: formData.labor_cost || 0,
        extra_cost: formData.extra_cost || 0,
        total_cost,
        cost_per_unit,
        note: formData.note || null,
      }])
      .select()
      .single()

    if (orderError) throw orderError
    if (!order) throw new Error('Failed to create production order')

    // Create inventory OUT movements for each material
    const outMovements = requiredMaterials.map(m => ({
      date: formData.date,
      item_id: m.item_id,
      type: 'out',
      quantity: m.quantity,
      unit_cost: stockMap.get(m.item_id) || 0, // Use current avg cost
      reference_type: 'production',
      reference_id: order.id,
      note: `Production order ${order.id}`,
    }))

    const { error: movError } = await supabase
      .from('inventory_movements')
      .insert(outMovements)

    if (movError) throw movError

    revalidatePath('/production')
    revalidatePath('/inventory')
    return { success: true, order_id: order.id }
  } catch (error) {
    return handleError(error)
  }
}

// ============================================================
// Expense Actions
// ============================================================

export async function getExpenses() {
  if (!isConfigured()) return []
  const { data } = await supabase
    .from('expenses')
    .select(`
      *,
      account:accounts(id, name)
    `)
    .order('created_at', { ascending: false })
  return data || []
}

export async function createExpense(formData: {
  date: string
  account_id: number
  category: string
  amount: number
  currency: string
  exchange_rate: number
  note: string
}) {
  if (!isConfigured()) return { success: false, error: 'Not configured' }
  try {
    const { error } = await supabase
      .from('expenses')
      .insert([{
        date: formData.date,
        account_id: formData.account_id,
        category: formData.category,
        amount: formData.amount,
        currency: formData.currency,
        exchange_rate: formData.exchange_rate || 1,
        amount_base: formData.amount * (formData.exchange_rate || 1),
        note: formData.note || null,
      }])
    if (error) throw error

    // Create transaction
    await supabase
      .from('transactions')
      .insert([{
        date: formData.date,
        type: 'expense',
        from_account_id: formData.account_id,
        amount: formData.amount,
        currency: formData.currency,
        exchange_rate: formData.exchange_rate || 1,
        amount_base: formData.amount * (formData.exchange_rate || 1),
        reference_type: 'expense',
        note: formData.category,
      }])

    revalidatePath('/expenses')
    revalidatePath('/treasury')
    return { success: true }
  } catch (error) {
    return handleError(error)
  }
}

// ============================================================
// Expense Categories Actions
// ============================================================

export async function getExpenseCategories() {
  if (!isConfigured()) return []
  const { data } = await supabase
    .from('expense_categories')
    .select('*')
    .order('name')
  return data || []
}

export async function createExpenseCategory(name: string) {
  if (!isConfigured()) return { success: false, error: 'Not configured' }
  try {
    const { error } = await supabase
      .from('expense_categories')
      .insert([{ name }])
    if (error) throw error
    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    return handleError(error)
  }
}

// ============================================================
// Dashboard Data
// ============================================================

export async function getDashboardData() {
  if (!isConfigured()) return null

  const [
    settings,
    accounts,
    transactions,
    purchases,
    items,
    inventoryMovements,
    productionOrders,
    expenses,
  ] = await Promise.all([
    getSettings(),
    getAccounts(),
    getTransactions(10),
    getPurchases(),
    getItems(),
    getInventoryMovements(200),
    getProductionOrders(),
    getExpenses(),
  ])

  // Calculate treasury balances
  const treasuryAccounts = accounts.filter(a => a.type === 'treasury')
  let treasuryX = 0
  let treasuryY = 0

  treasuryAccounts.forEach(acc => {
    let balance = acc.opening_balance || 0
    transactions.forEach(t => {
      if (t.to_account_id === acc.id) balance += t.amount_base || 0
      if (t.from_account_id === acc.id) balance -= t.amount_base || 0
    })
    if (acc.currency === 'USD') treasuryX += balance
    else if (acc.currency === 'CNY') treasuryY += balance / 7.24 // Convert to USD
  })

  // Calculate total supplier payables
  const supplierPurchases = purchases.reduce((sum, p) => sum + (p.total_base || 0), 0)
  const supplierPayments = purchases.reduce((sum, p) => sum + (p.paid_amount || 0) * (p.exchange_rate || 1), 0)
  const totalPayables = supplierPurchases - supplierPayments

  // Calculate inventory value
  const itemStock = new Map<number, { stock: number; costs: number[] }>()
  inventoryMovements.forEach(m => {
    const current = itemStock.get(m.item_id) || { stock: 0, costs: [] }
    if (m.type === 'in') {
      current.stock += m.quantity
      current.costs.push(m.unit_cost)
    }
    if (m.type === 'out') {
      current.stock -= m.quantity
    }
    itemStock.set(m.item_id, current)
  })

  let inventoryValue = 0
  let lowStockCount = 0
  itemStock.forEach((data, itemId) => {
    const avgCost = data.costs.length > 0
      ? data.costs.reduce((a, b) => a + b, 0) / data.costs.length
      : 0
    inventoryValue += data.stock * avgCost
    const item = items.find(i => i.id === itemId)
    if (item && item.reorder_level > 0 && data.stock <= item.reorder_level) {
      lowStockCount++
    }
  })

  // Monthly expenses
  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthlyExpenses = expenses
    .filter(e => e.date?.startsWith(currentMonth))
    .reduce((sum, e) => sum + (e.amount_base || 0), 0)

  // Monthly production cost
  const monthlyProduction = productionOrders
    .filter(o => o.date?.startsWith(currentMonth))
    .reduce((sum, o) => sum + (o.total_cost || 0), 0)

  // Total cash
  const totalCash = treasuryX + treasuryY

  return {
    settings,
    total_cash: totalCash,
    treasury_x: treasuryX,
    treasury_y: treasuryY,
    total_supplier_payables: totalPayables,
    inventory_value: inventoryValue,
    monthly_expenses: monthlyExpenses,
    production_cost_month: monthlyProduction,
    low_stock_count: lowStockCount,
    recent_transactions: transactions,
    recent_purchases: purchases.slice(0, 5),
    recent_production: productionOrders.slice(0, 5),
  }
}