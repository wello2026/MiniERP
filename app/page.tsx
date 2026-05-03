'use client'

import { useEffect, useState } from 'react'
import {
  Wallet,
  Building2,
  Users,
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Factory,
} from 'lucide-react'
import StatCard from '@/components/StatCard'
import Badge from '@/components/Badge'
import { Card } from '@/components/FormComponents'
import { getDashboardData } from '@/lib/actions'
import { formatMoney, formatDate, getStatusColor } from '@/lib/formatters'
import { isConfigured } from '@/lib/supabase'

interface DashboardData {
  total_cash: number
  treasury_x: number
  treasury_y: number
  total_supplier_payables: number
  inventory_value: number
  monthly_expenses: number
  production_cost_month: number
  low_stock_count: number
  recent_transactions: any[]
  recent_purchases: any[]
  recent_production: any[]
  settings: any
}

// Demo data when Supabase is not configured
const demoData: DashboardData = {
  total_cash: 75400,
  treasury_x: 53500,
  treasury_y: 21900,
  total_supplier_payables: 4381.95,
  inventory_value: 24500,
  monthly_expenses: 12100,
  production_cost_month: 2470.50,
  low_stock_count: 2,
  recent_transactions: [
    { id: 1, date: '2024-05-15', type: 'income', amount_base: 5000, currency: 'USD', note: 'Product sales revenue' },
    { id: 2, date: '2024-05-14', type: 'expense', amount_base: 800, currency: 'USD', note: 'Online advertising' },
    { id: 3, date: '2024-05-12', type: 'purchase_payment', amount_base: 828.73, currency: 'CNY', note: 'Partial payment PUR-2024-0002' },
    { id: 4, date: '2024-05-10', type: 'production_cost', amount_base: 2470.50, currency: 'USD', note: 'First production batch' },
    { id: 5, date: '2024-05-10', type: 'income', amount_base: 3200, currency: 'USD', note: 'Wholesale order' },
  ],
  recent_purchases: [
    { id: 1, invoice_no: 'PUR-2024-0002', date: '2024-05-14', supplier: { name: 'Guangzhou Accessories Ltd.' }, total_base: 1201.66, paid_amount: 828.73 },
    { id: 2, invoice_no: 'PUR-2024-0001', date: '2024-05-20', supplier: { name: 'Shanghai Textile Co.' }, total_base: 6008.29, paid_amount: 6008.29 },
  ],
  recent_production: [
    { id: 1, date: '2024-05-10', product: { name: 'Classic T-Shirt', sku: 'TSH-001' }, quantity: 200, status: 'completed', cost_per_unit: 12.35 },
  ],
  settings: { company_name: 'Mini ERP Pro', base_currency: 'USD', secondary_currency: 'CNY' },
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [configured, setConfigured] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const isConfig = isConfigured()
      setConfigured(isConfig)

      if (isConfig) {
        const dashboardData = await getDashboardData()
        setData(dashboardData)
      } else {
        setData(demoData)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return <div className="text-center py-12 text-slate-500">No data available</div>
  }

  return (
    <div className="space-y-6">
      {/* Demo Mode Banner */}
      {!configured && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Demo Mode Active</p>
            <p className="text-xs text-yellow-700">
              Supabase is not configured. Showing sample data. Connect your database to enable full functionality.
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Cash Balance"
          value={formatMoney(data.total_cash)}
          subtitle="All treasury accounts"
          icon={Wallet}
          color="blue"
        />
        <StatCard
          title="Treasury X (USD)"
          value={formatMoney(data.treasury_x)}
          subtitle="Main operating account"
          icon={Building2}
          color="green"
        />
        <StatCard
          title="Treasury Y (CNY)"
          value={`¥${(data.treasury_y * 7.24).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="China operations"
          icon={DollarSign}
          color="purple"
        />
        <StatCard
          title="Supplier Payables"
          value={formatMoney(data.total_supplier_payables)}
          subtitle="Outstanding balance"
          icon={Users}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Inventory Value"
          value={formatMoney(data.inventory_value)}
          subtitle="Current stock value"
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Monthly Expenses"
          value={formatMoney(data.monthly_expenses)}
          subtitle="This month's spending"
          icon={TrendingUp}
          color="red"
        />
        <StatCard
          title="Production Cost"
          value={formatMoney(data.production_cost_month)}
          subtitle="This month"
          icon={Factory}
          color="purple"
        />
        <StatCard
          title="Low Stock Alerts"
          value={data.low_stock_count}
          subtitle={data.low_stock_count > 0 ? 'Items need reorder' : 'All items stocked'}
          icon={AlertTriangle}
          color={data.low_stock_count > 0 ? 'yellow' : 'green'}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card title="Recent Transactions">
          {data.recent_transactions.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">No recent transactions</div>
          ) : (
            <div className="space-y-3">
              {data.recent_transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {tx.type === 'income' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{tx.note || tx.type}</p>
                      <p className="text-xs text-slate-500">{formatDate(tx.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount_base, tx.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Purchases */}
        <Card title="Recent Purchases">
          {data.recent_purchases.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">No recent purchases</div>
          ) : (
            <div className="space-y-3">
              {data.recent_purchases.slice(0, 5).map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ShoppingCart className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{purchase.invoice_no}</p>
                      <p className="text-xs text-slate-500">{purchase.supplier?.name || 'Unknown supplier'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{formatMoney(purchase.total_base)}</p>
                    <p className="text-xs text-slate-500">{formatDate(purchase.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Production Orders */}
      <Card title="Recent Production Orders">
        {data.recent_production.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">No production orders</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Order</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Product</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Quantity</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Cost/Unit</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_production.slice(0, 5).map((order) => (
                  <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium">#{order.id}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-slate-900">{order.product?.name}</p>
                        <p className="text-xs text-slate-500">{order.product?.sku}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(order.date)}</td>
                    <td className="py-3 px-4 text-right font-medium">{order.quantity}</td>
                    <td className="py-3 px-4 text-right">{formatMoney(order.cost_per_unit)}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={order.status === 'completed' ? 'success' : 'warning'}>
                        {order.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <a href="/treasury" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Wallet className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">Treasury</p>
            <p className="text-xs text-slate-500">Manage accounts</p>
          </div>
        </a>
        <a href="/purchases" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
          <div className="p-3 bg-green-100 rounded-xl">
            <ShoppingCart className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">New Purchase</p>
            <p className="text-xs text-slate-500">Create invoice</p>
          </div>
        </a>
        <a href="/production" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
          <div className="p-3 bg-purple-100 rounded-xl">
            <Factory className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">Production</p>
            <p className="text-xs text-slate-500">Start new order</p>
          </div>
        </a>
        <a href="/expenses" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
          <div className="p-3 bg-red-100 rounded-xl">
            <TrendingUp className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">Add Expense</p>
            <p className="text-xs text-slate-500">Record spending</p>
          </div>
        </a>
      </div>
    </div>
  )
}