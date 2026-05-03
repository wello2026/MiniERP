-- ============================================================
-- Mini ERP Pro Seed Data
-- ============================================================

-- Exchange Rates
INSERT INTO exchange_rates (from_currency, to_currency, rate, date) VALUES
  ('USD', 'CNY', 7.24, CURRENT_DATE),
  ('CNY', 'USD', 0.138, CURRENT_DATE),
  ('USD', 'EUR', 0.92, CURRENT_DATE),
  ('EUR', 'USD', 1.09, CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- Treasury Accounts
INSERT INTO accounts (name, type, currency, opening_balance) VALUES
  ('Main Treasury - USD', 'treasury', 'USD', 50000.00),
  ('Treasury China - CNY', 'treasury', 'CNY', 120000.00),
  ('Operating Expenses', 'expense', 'USD', 0.00),
  ('Production Account', 'production', 'USD', 0.00)
ON CONFLICT DO NOTHING;

-- Suppliers
INSERT INTO suppliers (name, country, currency, phone, notes) VALUES
  ('Shanghai Textile Co.', 'China', 'CNY', '+86-21-5555-1234', 'Primary fabric supplier'),
  ('Guangzhou Accessories Ltd.', 'China', 'CNY', '+86-20-8888-5678', 'Zippers, buttons, threads')
ON CONFLICT DO NOTHING;

-- Items (Fabrics, Accessories)
INSERT INTO items (name, category, unit, default_cost, currency, reorder_level) VALUES
  ('Cotton Fabric - White', 'fabric', 'meters', 4.50, 'USD', 500),
  ('Cotton Fabric - Black', 'fabric', 'meters', 4.50, 'USD', 500),
  ('Polyester Thread - Black', 'accessory', 'spools', 0.80, 'USD', 200),
  ('Metal Zipper 20cm', 'accessory', 'pcs', 0.35, 'USD', 500),
  ('Sewing Buttons - 15mm', 'accessory', 'pcs', 0.05, 'USD', 1000)
ON CONFLICT DO NOTHING;

-- Products
INSERT INTO products (name, sku, target_price, notes) VALUES
  ('Classic T-Shirt', 'TSH-001', 25.00, 'Basic crew neck t-shirt'),
  ('Formal Shirt', 'SHT-001', 45.00, 'Button-down formal shirt')
ON CONFLICT DO NOTHING;

-- BOM Items (Bill of Materials)
INSERT INTO bom_items (product_id, item_id, quantity_per_unit, wastage_percent) VALUES
  -- Classic T-Shirt
  (1, 1, 1.5, 5.00),  -- 1.5m white cotton fabric
  (1, 3, 0.2, 2.00),  -- 0.2 spools thread
  (1, 4, 1.0, 1.00),  -- 1 zipper
  -- Formal Shirt
  (2, 2, 2.2, 5.00),  -- 2.2m black cotton fabric
  (2, 3, 0.3, 2.00),  -- 0.3 spools thread
  (2, 5, 10.0, 3.00)  -- 10 buttons
ON CONFLICT DO NOTHING;

-- Initial Inventory (via inventory movements)
INSERT INTO inventory_movements (date, item_id, type, quantity, unit_cost, reference_type, reference_id, note) VALUES
  -- Initial stock
  (CURRENT_DATE - 30, 1, 'in', 2000, 4.50, 'initial', NULL, 'Initial stock'),
  (CURRENT_DATE - 30, 2, 'in', 1500, 4.50, 'initial', NULL, 'Initial stock'),
  (CURRENT_DATE - 30, 3, 'in', 500, 0.80, 'initial', NULL, 'Initial stock'),
  (CURRENT_DATE - 30, 4, 'in', 2000, 0.35, 'initial', NULL, 'Initial stock'),
  (CURRENT_DATE - 30, 5, 'in', 5000, 0.05, 'initial', NULL, 'Initial stock')
ON CONFLICT DO NOTHING;

-- Sample Purchases (from suppliers)
INSERT INTO purchases (supplier_id, date, invoice_no, currency, exchange_rate, subtotal, total_base, paid_amount, note) VALUES
  (1, CURRENT_DATE - 20, 'PUR-2024-0001', 'CNY', 7.24, 43500.00, 6008.29, 43500.00, 'Cotton fabric order'),
  (2, CURRENT_DATE - 15, 'PUR-2024-0002', 'CNY', 7.24, 8700.00, 1201.66, 6000.00, 'Accessories order')
ON CONFLICT DO NOTHING;

-- Purchase Items for PUR-2024-0001
INSERT INTO purchase_items (purchase_id, item_id, quantity, unit_cost, total_cost) VALUES
  (1, 1, 6000, 4.50, 27000.00),
  (1, 2, 4000, 4.50, 18000.00)
ON CONFLICT DO NOTHING;

-- Purchase Items for PUR-2024-0002
INSERT INTO purchase_items (purchase_id, item_id, quantity, unit_cost, total_cost) VALUES
  (2, 3, 2000, 0.80, 1600.00),
  (2, 4, 5000, 0.35, 1750.00),
  (2, 5, 10000, 0.05, 500.00)
ON CONFLICT DO NOTHING;

-- Payment transactions for purchases
INSERT INTO transactions (date, type, from_account_id, to_account_id, amount, currency, exchange_rate, amount_base, reference_type, reference_id, note) VALUES
  (CURRENT_DATE - 20, 'purchase_payment', 2, NULL, 43500.00, 'CNY', 7.24, 6008.29, 'purchase', 1, 'Payment for PUR-2024-0001'),
  (CURRENT_DATE - 18, 'purchase_payment', 2, NULL, 6000.00, 'CNY', 7.24, 828.73, 'purchase', 2, 'Partial payment PUR-2024-0002')
ON CONFLICT DO NOTHING;

-- Sample Expenses
INSERT INTO expenses (date, account_id, category, amount, currency, exchange_rate, amount_base, note) VALUES
  (CURRENT_DATE - 25, 1, 'Rent', 2000.00, 'USD', 1.00, 2000.00, 'Monthly rent'),
  (CURRENT_DATE - 22, 1, 'Utilities', 350.00, 'USD', 1.00, 350.00, 'Electricity and water'),
  (CURRENT_DATE - 18, 1, 'Salaries', 8500.00, 'USD', 1.00, 8500.00, 'Staff salaries'),
  (CURRENT_DATE - 12, 1, 'Transportation', 450.00, 'USD', 1.00, 450.00, 'Shipping costs'),
  (CURRENT_DATE - 5, 1, 'Marketing', 800.00, 'USD', 1.00, 800.00, 'Online advertising')
ON CONFLICT DO NOTHING;

-- Sample Production Order
INSERT INTO production_orders (date, product_id, quantity, status, material_cost, labor_cost, extra_cost, total_cost, cost_per_unit, note) VALUES
  (CURRENT_DATE - 10, 1, 200, 'completed', 1520.50, 800.00, 150.00, 2470.50, 12.35, 'First production batch')
ON CONFLICT DO NOTHING;

-- Inventory OUT movements for production
INSERT INTO inventory_movements (date, item_id, type, quantity, unit_cost, reference_type, reference_id, note) VALUES
  (CURRENT_DATE - 10, 1, 'out', 315, 4.50, 'production', 1, 'Material used for 200 T-shirts'),
  (CURRENT_DATE - 10, 3, 'out', 40.8, 0.80, 'production', 1, 'Thread for 200 T-shirts'),
  (CURRENT_DATE - 10, 4, 'out', 202, 0.35, 'production', 1, 'Zippers for 200 T-shirts')
ON CONFLICT DO NOTHING;

-- Income transaction (from sales)
INSERT INTO transactions (date, type, from_account_id, to_account_id, amount, currency, exchange_rate, amount_base, reference_type, reference_id, note) VALUES
  (CURRENT_DATE - 5, 'income', NULL, 1, 5000.00, 'USD', 1.00, 5000.00, 'sales', NULL, 'Product sales revenue')
ON CONFLICT DO NOTHING;