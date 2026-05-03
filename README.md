# Mini ERP Pro

A lightweight, professional ERP system for businesses operating between Country X and Country Y. Manage treasury, suppliers, purchases, inventory, production, and expenses with multi-currency support.

## Features

- **Dashboard** - Overview of business health, KPIs, and recent activity
- **Treasury** - Manage accounts, track income and expenses
- **Transfers** - Move funds between treasury accounts with currency conversion
- **Suppliers** - Manage suppliers and track outstanding balances
- **Purchases** - Create purchase invoices, track payments, manage inventory
- **Inventory** - Track stock levels, values, and movements
- **Production** - Bill of Materials (BOM), production orders, cost tracking
- **Expenses** - Categorize and track business expenses
- **Reports** - Financial summaries, supplier reports, inventory valuation
- **Settings** - Company settings, exchange rates, expense categories

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Supabase PostgreSQL
- Tailwind CSS
- Server Actions
- Lucide Icons

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase Database

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Copy and run the contents of `database/schema.sql`
4. Copy and run the contents of `database/seed.sql` (optional, for demo data)

### 3. Configure Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Find these values in your Supabase project: Settings > API

### 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Mode

If Supabase is not configured, the app runs in demo mode with sample data. This allows you to explore the UI and functionality without setting up a database.

## Database Schema

The system uses these main tables:

- `settings` - Company configuration
- `accounts` - Treasury accounts
- `transactions` - Financial transactions
- `suppliers` - Supplier records
- `items` - Inventory items
- `purchases` - Purchase invoices
- `purchase_items` - Line items for purchases
- `inventory_movements` - Stock movements
- `products` - Product definitions
- `bom_items` - Bill of Materials
- `production_orders` - Manufacturing orders
- `expenses` - Expense records
- `exchange_rates` - Currency conversion rates

## Business Logic

### Account Balance
```
Balance = Opening Balance + Incoming Transactions - Outgoing Transactions
```

### Supplier Balance
```
Balance = Total Purchases - Paid Amounts
```

### Inventory Stock
```
Stock = SUM(In Movements) - SUM(Out Movements) + Adjustments
```

### Production Flow
1. Select product with defined BOM
2. Enter production quantity
3. System calculates required materials (with wastage)
4. Checks available stock
5. Deducts inventory on order completion
6. Calculates material, labor, and extra costs
7. Records cost per unit

### Currency Conversion
Every financial record stores:
- Original currency
- Exchange rate
- Amount in base currency (USD)

## Project Structure

```
/app
  /dashboard          - Dashboard page
  /treasury           - Treasury management
  /transfers          - Money transfers
  /suppliers          - Supplier management
  /purchases          - Purchase invoices
  /inventory          - Inventory tracking
  /production         - Production orders
  /expenses           - Expense tracking
  /reports            - Business reports
  /settings           - System settings
  layout.tsx          - Root layout
  page.tsx            - Dashboard page

/components
  Sidebar.tsx         - Navigation sidebar
  Header.tsx          - Page header
  StatCard.tsx        - Statistics card component
  DataTable.tsx       - Reusable table component
  Badge.tsx           - Status badge component
  EmptyState.tsx      - Empty state component
  Modal.tsx           - Modal dialog component
  FormComponents.tsx  - Form field components
  Toast.tsx           - Toast notification system

/lib
  types.ts            - TypeScript type definitions
  supabase.ts         - Supabase client
  calculations.ts     - Business calculation functions
  formatters.ts       - Formatting utilities
  actions.ts          - Server actions

/database
  schema.sql          - Database schema
  seed.sql            - Sample data
```

## Version 2 Improvements

Potential enhancements for future versions:

1. **Authentication** - User login, roles, and permissions
2. **Multi-tenancy** - Support for multiple companies
3. **Reports Export** - PDF/Excel export functionality
4. **Charts** - Visual charts for reports (revenue trends, etc.)
5. **Notifications** - Email alerts for low stock, payment due
6. **Attachments** - Upload invoices, receipts
7. **API Integration** - Connect with shipping/accounting APIs
8. **Mobile Responsive** - Better mobile experience
9. **Audit Trail** - Track all changes with user info
10. **Batch Operations** - Bulk create/update records

## License

MIT License