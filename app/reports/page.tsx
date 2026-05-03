'use client'

import { useEffect, useState } from 'react'
import { BarChart3, Download, FileText, PieChart, TrendingUp, Package, Users, Factory } from 'lucide-react'
import Badge from '@/components/Badge'
import { Card, Button } from '@/components/FormComponents'
import { getDashboardData } from '@/lib/actions'
import { formatMoney, formatDate, getCurrentMonth, getMonthName } from '@/lib/formatters'
import { isConfigured } from '@/lib/supabase'

interface ReportData {
  financial: {
    totalIncome: number
    totalExpenses: number
    netCashFlow: number
    accounts: { name: string; currency: string; balance: number }[]
  }
  suppliers: { name: string; country: string; totalPurchases: number; paid: number; balance: number }[]
  inventory: { name: string; category: string; stock: number; value: number; lowStock: boolean }[]
  production: { product: string; quantity: number; materialCost: number; laborCost: number; costPerUnit: number }[]
}

// Demo report data
const demoReportData: ReportData = {
  financial: {
    totalIncome: 8200,
    totalExpenses: 12100,
    netCashFlow: -3900,
    accounts: [
      { name: 'Main Treasury - USD', currency: 'USD', balance: 53500 },
      { name: 'Treasury China - CNY', currency: 'CNY', balance: 125000 },
    ],
  },
  suppliers: [
    { name: 'Shanghai Textile Co.', country: 'China', totalPurchases: 6008.29, paid: 6008.29, balance: 0 },
    { name: 'Guangzhou Accessories Ltd.', country: 'China', totalPurchases: 1201.66, paid: 828.73, balance: 372.93 },
  ],
  inventory: [
    { name: 'Cotton Fabric - White', category: 'fabric', stock: 2685, value: 12082.50, lowStock: false },
    { name: 'Cotton Fabric - Black', category: 'fabric', stock: 1850, value: 8325.00, lowStock: false },
    { name: 'Polyester Thread - Black', category: 'accessory', stock: 459, value: 367.20, lowStock: false },
    { name: 'Metal Zipper 20cm', category: 'accessory', stock: 1798, value: 629.30, lowStock: true },
    { name: 'Sewing Buttons - 15mm', category: 'accessory', stock: 4000, value: 200.00, lowStock: true },
  ],
  production: [
    { product: 'Classic T-Shirt', quantity: 200, materialCost: 1520.50, laborCost: 800, costPerUnit: 12.35 },
  ],
}

type ReportType = 'financial' | 'supplier' | 'inventory' | 'production' | 'monthly'

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('financial')
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (isConfigured()) {
        const data = await getDashboardData()
        // Transform dashboard data to report format
        if (data) {
          setReportData({
            financial: {
              totalIncome: data.recent_transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount_base || 0), 0) || 0,
              totalExpenses: data.monthly_expenses || 0,
              netCashFlow: (data.total_cash || 0) - 50000,
              accounts: [],
            },
            suppliers: [],
            inventory: [],
            production: [],
          })
        }
      } else {
        setReportData(demoReportData)
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

  if (!reportData) {
    return <div className="text-center py-12 text-slate-500">Unable to load report data</div>
  }

  const reportTypes = [
    { id: 'financial', label: 'Financial Summary', icon: BarChart3 },
    { id: 'supplier', label: 'Supplier Report', icon: Users },
    { id: 'inventory', label: 'Inventory Report', icon: Package },
    { id: 'production', label: 'Production Cost', icon: Factory },
    { id: 'monthly', label: 'Monthly Activity', icon: TrendingUp },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Business Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Comprehensive financial and operational reports</p>
        </div>
        <Button variant="secondary">
          <Download className="w-4 h-4 mr-2" /> Export Report
        </Button>
      </div>

      {/* Report Type Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {reportTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setReportType(type.id as ReportType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              reportType === type.id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <type.icon className="w-4 h-4" />
            {type.label}
          </button>
        ))}
      </div>

      {/* Financial Summary Report */}
      {reportType === 'financial' && (
        <div className="space-y-6">
          <Card title="Financial Summary Report">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <p className="text-sm text-green-700 font-medium">Total Income</p>
                <p className="text-2xl font-bold text-green-800 mt-1">{formatMoney(reportData.financial.totalIncome)}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <p className="text-sm text-red-700 font-medium">Total Expenses</p>
                <p className="text-2xl font-bold text-red-800 mt-1">{formatMoney(reportData.financial.totalExpenses)}</p>
              </div>
              <div className={`p-4 rounded-xl border ${reportData.financial.netCashFlow >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <p className={`text-sm font-medium ${reportData.financial.netCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>Net Cash Flow</p>
                <p className={`text-2xl font-bold mt-1 ${reportData.financial.netCashFlow >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  {formatMoney(reportData.financial.netCashFlow)}
                </p>
              </div>
            </div>
          </Card>

          <Card title="Treasury Account Balances">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Account</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Currency</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Balance</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">USD Value</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.financial.accounts.map((account, index) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="py-3 px-4 font-medium text-slate-900">{account.name}</td>
                      <td className="py-3 px-4 text-slate-600">{account.currency}</td>
                      <td className="py-3 px-4 text-right">{formatMoney(account.balance, account.currency)}</td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {account.currency === 'CNY' ? formatMoney(account.balance / 7.24) : formatMoney(account.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Supplier Report */}
      {reportType === 'supplier' && (
        <Card title="Supplier Report">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Supplier</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Country</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Total Purchases</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Paid Amount</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Outstanding</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.suppliers.map((supplier, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    <td className="py-3 px-4 font-medium text-slate-900">{supplier.name}</td>
                    <td className="py-3 px-4 text-slate-600">{supplier.country}</td>
                    <td className="py-3 px-4 text-right">{formatMoney(supplier.totalPurchases)}</td>
                    <td className="py-3 px-4 text-right text-green-600">{formatMoney(supplier.paid)}</td>
                    <td className={`py-3 px-4 text-right font-semibold ${supplier.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatMoney(supplier.balance)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={supplier.balance > 0 ? 'warning' : 'success'}>
                        {supplier.balance > 0 ? 'Outstanding' : 'Paid'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-semibold">
                  <td className="py-3 px-4">Total</td>
                  <td></td>
                  <td className="py-3 px-4 text-right">
                    {formatMoney(reportData.suppliers.reduce((sum, s) => sum + s.totalPurchases, 0))}
                  </td>
                  <td className="py-3 px-4 text-right text-green-600">
                    {formatMoney(reportData.suppliers.reduce((sum, s) => sum + s.paid, 0))}
                  </td>
                  <td className="py-3 px-4 text-right text-red-600">
                    {formatMoney(reportData.suppliers.reduce((sum, s) => sum + s.balance, 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {/* Inventory Report */}
      {reportType === 'inventory' && (
        <div className="space-y-6">
          <Card title="Inventory Valuation Report">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Item</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Category</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Stock</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Value</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.inventory.map((item, index) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="py-3 px-4 font-medium text-slate-900">{item.name}</td>
                      <td className="py-3 px-4">
                        <Badge variant={item.category === 'fabric' ? 'info' : 'purple'}>{item.category}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">{item.stock.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-semibold">{formatMoney(item.value)}</td>
                      <td className="py-3 px-4 text-center">
                        {item.lowStock ? (
                          <Badge variant="warning">Low Stock</Badge>
                        ) : (
                          <Badge variant="success">OK</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold">
                    <td className="py-3 px-4" colSpan={3}>Total Inventory Value</td>
                    <td className="py-3 px-4 text-right text-lg">
                      {formatMoney(reportData.inventory.reduce((sum, i) => sum + i.value, 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Low Stock Alert */}
          {reportData.inventory.filter(i => i.lowStock).length > 0 && (
            <Card title="Low Stock Alert" className="border-yellow-200 bg-yellow-50">
              <div className="space-y-2">
                {reportData.inventory.filter(i => i.lowStock).map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm text-yellow-700">Stock: {item.stock}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Production Cost Report */}
      {reportType === 'production' && (
        <Card title="Production Cost Report">
          {reportData.production.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No production records</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Product</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Quantity</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Material Cost</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Labor Cost</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Total Cost</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Cost/Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.production.map((order, index) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="py-3 px-4 font-medium text-slate-900">{order.product}</td>
                      <td className="py-3 px-4 text-right">{order.quantity}</td>
                      <td className="py-3 px-4 text-right">{formatMoney(order.materialCost)}</td>
                      <td className="py-3 px-4 text-right">{formatMoney(order.laborCost)}</td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {formatMoney(order.materialCost + order.laborCost)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-600">{formatMoney(order.costPerUnit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Monthly Activity Report */}
      {reportType === 'monthly' && (
        <Card title="Monthly Activity Report">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-700 font-medium">Purchases</p>
              <p className="text-2xl font-bold text-blue-800 mt-1">2</p>
            </div>
            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
              <p className="text-sm text-red-700 font-medium">Expenses</p>
              <p className="text-2xl font-bold text-red-800 mt-1">{formatMoney(12100)}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
              <p className="text-sm text-purple-700 font-medium">Production Cost</p>
              <p className="text-2xl font-bold text-purple-800 mt-1">{formatMoney(2470.50)}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <p className="text-sm text-green-700 font-medium">Cash In</p>
              <p className="text-2xl font-bold text-green-800 mt-1">{formatMoney(8200)}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium text-slate-900 mb-3">Monthly Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Total Revenue</span>
                <span className="font-semibold text-green-600">{formatMoney(8200)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Total Expenses</span>
                <span className="font-semibold text-red-600">{formatMoney(12100)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Production Costs</span>
                <span className="font-semibold text-purple-600">{formatMoney(2470.50)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Net Cash Flow</span>
                <span className="font-bold text-red-600">{formatMoney(-6370.50)}</span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}