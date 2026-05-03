-- ============================================================
-- Mini ERP Pro Database Schema
-- ============================================================

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  company_name TEXT NOT NULL DEFAULT 'Mini ERP Pro',
  base_currency TEXT NOT NULL DEFAULT 'USD',
  secondary_currency TEXT NOT NULL DEFAULT 'CNY',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exchange Rates
CREATE TABLE IF NOT EXISTS exchange_rates (
  id SERIAL PRIMARY KEY,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate DECIMAL(18, 6) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_currency, to_currency, date)
);

-- Accounts (Treasury, Supplier, Expense, Production)
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('treasury', 'supplier', 'expense', 'production')),
  currency TEXT NOT NULL,
  opening_balance DECIMAL(18, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'purchase_payment', 'production_cost')),
  from_account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  to_account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  amount DECIMAL(18, 2) NOT NULL,
  currency TEXT NOT NULL,
  exchange_rate DECIMAL(18, 6) NOT NULL DEFAULT 1,
  amount_base DECIMAL(18, 2) NOT NULL,
  reference_type TEXT,
  reference_id INTEGER,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  currency TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('fabric', 'accessory', 'other')),
  unit TEXT NOT NULL DEFAULT 'pcs',
  default_cost DECIMAL(18, 4) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  reorder_level DECIMAL(18, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchases
CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  invoice_no TEXT NOT NULL,
  currency TEXT NOT NULL,
  exchange_rate DECIMAL(18, 6) NOT NULL DEFAULT 1,
  subtotal DECIMAL(18, 2) NOT NULL,
  total_base DECIMAL(18, 2) NOT NULL,
  paid_amount DECIMAL(18, 2) NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Items
CREATE TABLE IF NOT EXISTS purchase_items (
  id SERIAL PRIMARY KEY,
  purchase_id INTEGER REFERENCES purchases(id) ON DELETE CASCADE,
  item_id INTEGER REFERENCES items(id) ON DELETE SET NULL,
  quantity DECIMAL(18, 4) NOT NULL,
  unit_cost DECIMAL(18, 4) NOT NULL,
  total_cost DECIMAL(18, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Movements
CREATE TABLE IF NOT EXISTS inventory_movements (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  item_id INTEGER REFERENCES items(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
  quantity DECIMAL(18, 4) NOT NULL,
  unit_cost DECIMAL(18, 4) NOT NULL,
  reference_type TEXT,
  reference_id INTEGER,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  target_price DECIMAL(18, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BOM Items (Bill of Materials)
CREATE TABLE IF NOT EXISTS bom_items (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
  quantity_per_unit DECIMAL(18, 4) NOT NULL,
  wastage_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, item_id)
);

-- Production Orders
CREATE TABLE IF NOT EXISTS production_orders (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  quantity DECIMAL(18, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'completed')),
  material_cost DECIMAL(18, 2) NOT NULL DEFAULT 0,
  labor_cost DECIMAL(18, 2) NOT NULL DEFAULT 0,
  extra_cost DECIMAL(18, 2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(18, 2) NOT NULL DEFAULT 0,
  cost_per_unit DECIMAL(18, 2) NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  amount DECIMAL(18, 2) NOT NULL,
  currency TEXT NOT NULL,
  exchange_rate DECIMAL(18, 6) NOT NULL DEFAULT 1,
  amount_base DECIMAL(18, 2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expense Categories
CREATE TABLE IF NOT EXISTS expense_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Initial Settings Row
-- ============================================================
INSERT INTO settings (company_name, base_currency, secondary_currency)
VALUES ('Mini ERP Pro', 'USD', 'CNY')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Initial Expense Categories
-- ============================================================
INSERT INTO expense_categories (name) VALUES
  ('Rent'),
  ('Utilities'),
  ('Salaries'),
  ('Transportation'),
  ('Marketing'),
  ('Equipment'),
  ('Maintenance'),
  ('Insurance'),
  ('Legal'),
  ('Miscellaneous')
ON CONFLICT DO NOTHING;