// ============================================================
// Mini ERP Pro Types
// ============================================================

export interface Settings {
  id: number;
  company_name: string;
  base_currency: string;
  secondary_currency: string;
  created_at: string;
  updated_at: string;
}

export interface ExchangeRate {
  id: number;
  from_currency: string;
  to_currency: string;
  rate: number;
  date: string;
  created_at: string;
}

export interface Account {
  id: number;
  name: string;
  type: 'treasury' | 'supplier' | 'expense' | 'production';
  currency: string;
  opening_balance: number;
  created_at: string;
  updated_at: string;
  balance?: number;
}

export interface Transaction {
  id: number;
  date: string;
  type: 'income' | 'expense' | 'transfer' | 'purchase_payment' | 'production_cost';
  from_account_id: number | null;
  to_account_id: number | null;
  amount: number;
  currency: string;
  exchange_rate: number;
  amount_base: number;
  reference_type: string | null;
  reference_id: number | null;
  note: string | null;
  created_at: string;
  from_account?: Account;
  to_account?: Account;
}

export interface Supplier {
  id: number;
  name: string;
  country: string;
  currency: string;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  total_purchases?: number;
  total_paid?: number;
  balance?: number;
}

export interface Item {
  id: number;
  name: string;
  category: 'fabric' | 'accessory' | 'other';
  unit: string;
  default_cost: number;
  currency: string;
  reorder_level: number;
  created_at: string;
  updated_at: string;
  stock?: number;
  avg_cost?: number;
  stock_value?: number;
  is_low_stock?: boolean;
}

export interface Purchase {
  id: number;
  supplier_id: number | null;
  date: string;
  invoice_no: string;
  currency: string;
  exchange_rate: number;
  subtotal: number;
  total_base: number;
  paid_amount: number;
  note: string | null;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  items?: PurchaseItem[];
}

export interface PurchaseItem {
  id: number;
  purchase_id: number;
  item_id: number | null;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  created_at: string;
  item?: Item;
}

export interface InventoryMovement {
  id: number;
  date: string;
  item_id: number | null;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  unit_cost: number;
  reference_type: string | null;
  reference_id: number | null;
  note: string | null;
  created_at: string;
  item?: Item;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  target_price: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  bom_items?: BomItem[];
}

export interface BomItem {
  id: number;
  product_id: number;
  item_id: number | null;
  quantity_per_unit: number;
  wastage_percent: number;
  created_at: string;
  item?: Item;
}

export interface ProductionOrder {
  id: number;
  date: string;
  product_id: number | null;
  quantity: number;
  status: 'planned' | 'completed';
  material_cost: number;
  labor_cost: number;
  extra_cost: number;
  total_cost: number;
  cost_per_unit: number;
  note: string | null;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface Expense {
  id: number;
  date: string;
  account_id: number | null;
  category: string;
  amount: number;
  currency: string;
  exchange_rate: number;
  amount_base: number;
  note: string | null;
  created_at: string;
  updated_at: string;
  account?: Account;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  created_at: string;
}

// Dashboard Summary Types
export interface DashboardSummary {
  total_cash: number;
  treasury_x: number;
  treasury_y: number;
  total_supplier_payables: number;
  inventory_value: number;
  monthly_expenses: number;
  production_cost_month: number;
  low_stock_count: number;
  recent_transactions: Transaction[];
  recent_purchases: Purchase[];
  recent_production: ProductionOrder[];
}

// Report Types
export interface FinancialSummary {
  cash_by_account: { account: Account; balance: number }[];
  total_income: number;
  total_expenses: number;
  net_cash_flow: number;
}

export interface SupplierReport {
  supplier: Supplier;
  total_purchases: number;
  total_paid: number;
  outstanding: number;
}

export interface InventoryReport {
  items: Item[];
  total_value: number;
  low_stock_items: Item[];
}

export interface ProductionReport {
  orders: ProductionOrder[];
  total_quantity: number;
  total_material_cost: number;
  total_labor_cost: number;
  total_extra_cost: number;
  total_cost: number;
}

export interface MonthlyActivityReport {
  month: string;
  purchases_count: number;
  purchases_total: number;
  expenses_total: number;
  production_cost: number;
  cash_in: number;
  cash_out: number;
}

// Form Types
export interface TransferFormData {
  from_account_id: number;
  to_account_id: number;
  amount: number;
  currency: string;
  exchange_rate: number;
  note: string;
}

export interface PurchaseFormData {
  supplier_id: number;
  date: string;
  currency: string;
  exchange_rate: number;
  paid_amount: number;
  note: string;
  items: { item_id: number; quantity: number; unit_cost: number }[];
}

export interface ProductionFormData {
  product_id: number;
  quantity: number;
  labor_cost: number;
  extra_cost: number;
  note: string;
}

export interface ExpenseFormData {
  date: string;
  account_id: number;
  category: string;
  amount: number;
  currency: string;
  exchange_rate: number;
  note: string;
}