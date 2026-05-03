'use client'

import { useEffect, useState } from 'react'
import { Plus, Receipt, DollarSign, TrendingUp, Calendar, PieChart } from 'lucide-react'
import Modal from '@/components/Modal'
import EmptyState from '@/components/EmptyState'
import Badge from '@/components/Badge'
import { Card, FormField, Input, Select, Button } from '@/components/FormComponents'
import { getExpenses, getAccounts, getExpenseCategories, createExpense, createExpenseCategory } from '@/lib/actions'
import { formatMoney, formatDate, getCurrentMonth, getMonthName } from '@/lib/formatters'
import { isConfigured } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

interface Expense {
  id: number
  date: string
  account_id: number | null
  category: string
  amount: number
  currency: string
  exchange_rate: number
  amount_base: number
  note: string | null
  account?: { name: string }
}

interface Account {
  id: number
  name: string
  currency: string
}

interface ExpenseCategory {
  id: number
  name: string
}

// Demo data
const demoExpenses: Expense[] = [
  { id: 1, date: '2024-05-25', account_id: 1, category: 'Rent', amount: 2000, currency: 'USD', exchange_rate: 1, amount_base: 2000, note: 'Monthly rent', account: { name: 'Main Treasury - USD' } },
  { id: 2, date: '2024-05-22', account_id: 1, category: 'Utilities', amount: 350, currency: 'USD', exchange_rate: 1, amount_base: 350, note: 'Electricity and water', account: { name: 'Main Treasury - USD' } },
  { id: 3, date: '2024-05-18', account_id: 1, category: 'Salaries', amount: 8500, currency: 'USD', exchange_rate: 1, amount_base: 8500, note: 'Staff salaries', account: { name: 'Main Treasury - USD' } },
  { id: 4, date: '2024-05-12', account_id: 1, category: 'Transportation', amount: 450, currency: 'USD', exchange_rate: 1, amount_base: 450, note: 'Shipping costs', account: { name: 'Main Treasury - USD' } },
  { id: 5, date: '2024-05-05', account_id: 1, category: 'Marketing', amount: 800, currency: 'USD', exchange_rate: 1, amount_base: 800, note: 'Online advertising', account: { name: 'Main Treasury - USD' } },
]

const demoAccounts: Account[] = [
  { id: 1, name: 'Main Treasury - USD', currency: 'USD' },
  { id: 2, name: 'Treasury China - CNY', currency: 'CNY' },
]

const demoCategories: ExpenseCategory[] = [
  { id: 1, name: 'Rent' },
  { id: 2, name: 'Utilities' },
  { id: 3, name: 'Salaries' },
  { id: 4, name: 'Transportation' },
  { id: 5, name: 'Marketing' },
  { id: 6, name: 'Equipment' },
  { id: 7, name: 'Maintenance' },
  { id: 8, name: 'Insurance' },
  { id: 9, name: 'Legal' },
  { id: 10, name: 'Miscellaneous' },
]

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const { showToast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      if (isConfigured()) {
        const [expensesData, accountsData, categoriesData] = await Promise.all([
          getExpenses(),
          getAccounts(),
          getExpenseCategories(),
        ])
        setExpenses(expensesData)
        setAccounts(accountsData.filter((a: Account) => a.type === 'treasury'))
        setCategories(categoriesData)
      } else {
        setExpenses(demoExpenses)
        setAccounts(demoAccounts)
        setCategories(demoCategories)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const handleCreateExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const result = await createExpense({
      date: formData.get('date') as string,
      account_id: parseInt(formData.get('account_id') as string),
      category: formData.get('category') as string,
      amount: parseFloat(formData.get('amount') as string) || 0,
      currency: formData.get('currency') as string,
      exchange_rate: parseFloat(formData.get('exchange_rate') as string) || 1,
      note: formData.get('note') as string,
    })

    if (result.success) {
      showToast('success', 'Expense recorded successfully')
      setShowExpenseModal(false)
      const expensesData = await getExpenses()
      setExpenses(expensesData)
    } else {
      showToast('error', result.error || 'Failed to record expense')
    }
  }

  const handleCreateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.preventDefault()
    const result = await createExpenseCategory(newCategory)
    if (result.success) {
      showToast('success', 'Category added')
      setShowCategoryModal(false)
      setNewCategory('')
      const categoriesData = await getExpenseCategories()
      setCategories(categoriesData)
    } else {
      showToast('error', 'Failed to add category')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const currentMonth = getCurrentMonth()
  const monthlyExpenses = expenses.filter(e => e.date?.startsWith(currentMonth))
  const monthlyTotal = monthlyExpenses.reduce((sum, e) => sum + (e.amount_base || 0), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount_base || 0), 0)

  // Category breakdown
  const categoryTotals = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + (exp.amount_base || 0)
    return acc
  }, {} as Record<string, number>)
  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Expense Tracking</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor and manage business expenses</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setShowCategoryModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Category
          </Button>
          <Button onClick={() => setShowExpenseModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Expense
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Expenses</p>
              <p className="text-2xl font-bold text-slate-900">{formatMoney(totalExpenses)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{getMonthName(currentMonth)}</p>
              <p className="text-2xl font-bold text-red-600">{formatMoney(monthlyTotal)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">This Month</p>
              <p className="text-xl font-bold text-slate-900">{monthlyExpenses.length} expenses</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <PieChart className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Categories</p>
              <p className="text-xl font-bold text-slate-900">{categories.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Expenses by Category">
          {topCategories.length === 0 ? (
            <EmptyState
              icon={PieChart}
              title="No category data"
              description="Add expenses to see category breakdown"
            />
          ) : (
            <div className="space-y-4">
              {topCategories.map(([category, amount]) => {
                const percentage = (amount / totalExpenses * 100).toFixed(1)
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="font-medium text-slate-900">{category}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{formatMoney(amount)}</p>
                        <p className="text-xs text-slate-500">{percentage}%</p>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Monthly Summary */}
        <Card title="This Month">
          <div className="space-y-4">
            {monthlyExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Receipt className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{expense.category}</p>
                    <p className="text-xs text-slate-500">{formatDate(expense.date)} • {expense.note}</p>
                  </div>
                </div>
                <p className="font-semibold text-red-600">{formatMoney(expense.amount_base)}</p>
              </div>
            ))}
            {monthlyExpenses.length === 0 && (
              <p className="text-center text-slate-500 py-4">No expenses this month</p>
            )}
          </div>
        </Card>
      </div>

      {/* All Expenses */}
      <Card title="All Expenses">
        {expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses recorded"
            description="Add your first expense to start tracking"
            action={{ label: 'Add Expense', onClick: () => setShowExpenseModal(true) }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Account</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Note</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Amount</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">USD Value</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-600">{formatDate(expense.date)}</td>
                    <td className="py-3 px-4">
                      <Badge variant="danger">{expense.category}</Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{expense.account?.name || '-'}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{expense.note || '-'}</td>
                    <td className="py-3 px-4 text-right">{formatMoney(expense.amount, expense.currency)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-red-600">{formatMoney(expense.amount_base)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Expense Modal */}
      <Modal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Add New Expense">
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date" required>
              <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
            </FormField>
            <FormField label="Account" required>
              <Select name="account_id" required>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
            </FormField>
          </div>
          <FormField label="Category" required>
            <Select name="category" required>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </Select>
          </FormField>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Amount" required>
              <Input name="amount" type="number" step="0.01" placeholder="0.00" required />
            </FormField>
            <FormField label="Currency">
              <Select name="currency">
                <option value="USD">USD</option>
                <option value="CNY">CNY</option>
              </Select>
            </FormField>
            <FormField label="Exchange Rate">
              <Input name="exchange_rate" type="number" step="0.000001" defaultValue="1" />
            </FormField>
          </div>
          <FormField label="Note">
            <Input name="note" placeholder="Expense description" />
          </FormField>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowExpenseModal(false)}>Cancel</Button>
            <Button type="submit">Add Expense</Button>
          </div>
        </form>
      </Modal>

      {/* Add Category Modal */}
      <Modal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} title="Add Expense Category">
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <FormField label="Category Name" required>
            <Input
              name="name"
              placeholder="e.g., Office Supplies"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              required
            />
          </FormField>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowCategoryModal(false)}>Cancel</Button>
            <Button type="submit">Add Category</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}