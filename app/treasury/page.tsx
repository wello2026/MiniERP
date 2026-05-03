'use client'

import { useEffect, useState } from 'react'
import { Plus, Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import StatCard from '@/components/StatCard'
import Badge from '@/components/Badge'
import Modal from '@/components/Modal'
import EmptyState from '@/components/EmptyState'
import { Card, FormField, Input, Select, Button } from '@/components/FormComponents'
import { getAccounts, getTransactions, createAccount, createTransaction } from '@/lib/actions'
import { formatMoney, formatDate, getStatusColor } from '@/lib/formatters'
import { isConfigured } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

interface Account {
  id: number
  name: string
  type: string
  currency: string
  opening_balance: number
  balance?: number
}

interface Transaction {
  id: number
  date: string
  type: string
  from_account_id: number | null
  to_account_id: number | null
  amount: number
  currency: string
  amount_base: number
  note: string | null
  from_account?: { name: string }
  to_account?: { name: string }
}

// Demo accounts
const demoAccounts: Account[] = [
  { id: 1, name: 'Main Treasury - USD', type: 'treasury', currency: 'USD', opening_balance: 50000, balance: 53500 },
  { id: 2, name: 'Treasury China - CNY', type: 'treasury', currency: 'CNY', opening_balance: 120000, balance: 125000 },
  { id: 3, name: 'Operating Expenses', type: 'expense', currency: 'USD', opening_balance: 0, balance: 0 },
  { id: 4, name: 'Production Account', type: 'production', currency: 'USD', opening_balance: 0, balance: 0 },
]

const demoTransactions: Transaction[] = [
  { id: 1, date: '2024-05-15', type: 'income', from_account_id: null, to_account_id: 1, amount: 5000, currency: 'USD', amount_base: 5000, note: 'Product sales revenue', to_account: { name: 'Main Treasury - USD' } },
  { id: 2, date: '2024-05-14', type: 'expense', from_account_id: 1, to_account_id: null, amount: 800, currency: 'USD', amount_base: 800, note: 'Online advertising', from_account: { name: 'Main Treasury - USD' } },
  { id: 3, date: '2024-05-12', type: 'purchase_payment', from_account_id: 2, to_account_id: null, amount: 828.73, currency: 'CNY', amount_base: 828.73, note: 'Partial payment PUR-2024-0002', from_account: { name: 'Treasury China - CNY' } },
  { id: 4, date: '2024-05-10', type: 'production_cost', from_account_id: 1, to_account_id: null, amount: 2470.50, currency: 'USD', amount_base: 2470.50, note: 'First production batch', from_account: { name: 'Main Treasury - USD' } },
  { id: 5, date: '2024-05-08', type: 'expense', from_account_id: 1, to_account_id: null, amount: 2000, currency: 'USD', amount_base: 2000, note: 'Monthly rent', from_account: { name: 'Main Treasury - USD' } },
  { id: 6, date: '2024-05-05', type: 'income', from_account_id: null, to_account_id: 1, amount: 3200, currency: 'USD', amount_base: 3200, note: 'Wholesale order', to_account: { name: 'Main Treasury - USD' } },
]

export default function TreasuryPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [configured, setConfigured] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income')
  const { showToast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      const isConfig = isConfigured()
      setConfigured(isConfig)

      if (isConfig) {
        const [accountsData, transactionsData] = await Promise.all([
          getAccounts(),
          getTransactions(50),
        ])
        setAccounts(accountsData)
        setTransactions(transactionsData)
      } else {
        setAccounts(demoAccounts)
        setTransactions(demoTransactions)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const treasuryAccounts = accounts.filter(a => a.type === 'treasury')
  const totalBalance = treasuryAccounts.reduce((sum, a) => sum + (a.balance || a.opening_balance), 0)
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount_base, 0)
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount_base, 0)

  const handleCreateAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const result = await createAccount({
      name: formData.get('name') as string,
      type: 'treasury',
      currency: formData.get('currency') as string,
      opening_balance: parseFloat(formData.get('opening_balance') as string) || 0,
    })

    if (result.success) {
      showToast('success', 'Account created successfully')
      setShowAccountModal(false)
      const accountsData = await getAccounts()
      setAccounts(accountsData)
    } else {
      showToast('error', result.error || 'Failed to create account')
    }
  }

  const handleCreateTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const result = await createTransaction({
      date: formData.get('date') as string,
      type: transactionType,
      to_account_id: transactionType === 'income' ? parseInt(formData.get('account_id') as string) : null,
      from_account_id: transactionType === 'expense' ? parseInt(formData.get('account_id') as string) : null,
      amount: parseFloat(formData.get('amount') as string) || 0,
      currency: formData.get('currency') as string,
      exchange_rate: parseFloat(formData.get('exchange_rate') as string) || 1,
      amount_base: parseFloat(formData.get('amount') as string) || 0,
      note: formData.get('note') as string,
    })

    if (result.success) {
      showToast('success', `${transactionType === 'income' ? 'Income' : 'Expense'} recorded successfully`)
      setShowTransactionModal(false)
      const transactionsData = await getTransactions(50)
      setTransactions(transactionsData)
    } else {
      showToast('error', result.error || 'Failed to record transaction')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Treasury Balance"
          value={formatMoney(totalBalance)}
          subtitle={`${treasuryAccounts.length} accounts`}
          icon={Wallet}
          color="blue"
        />
        <StatCard
          title="Total Income"
          value={formatMoney(totalIncome)}
          subtitle="All time"
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Total Expenses"
          value={formatMoney(totalExpenses)}
          subtitle="All time"
          icon={TrendingDown}
          color="red"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={() => { setTransactionType('income'); setShowTransactionModal(true) }}>
          <Plus className="w-4 h-4 mr-2" /> Add Income
        </Button>
        <Button variant="secondary" onClick={() => { setTransactionType('expense'); setShowTransactionModal(true) }}>
          <Plus className="w-4 h-4 mr-2" /> Add Expense
        </Button>
        <Button variant="ghost" onClick={() => setShowAccountModal(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Account
        </Button>
      </div>

      {/* Accounts */}
      <Card title="Treasury Accounts">
        {treasuryAccounts.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No treasury accounts"
            description="Create your first treasury account to start tracking cash flow"
            action={{ label: 'Create Account', onClick: () => setShowAccountModal(true) }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {treasuryAccounts.map((account) => (
              <div key={account.id} className="p-4 border border-slate-200 rounded-xl hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Wallet className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{account.name}</p>
                      <p className="text-xs text-slate-500">{account.currency}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-slate-500">Opening Balance</p>
                    <p className="text-sm text-slate-700">{formatMoney(account.opening_balance, account.currency)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Current Balance</p>
                    <p className="text-lg font-bold text-slate-900">{formatMoney(account.balance || account.opening_balance, account.currency)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Transactions */}
      <Card title="Transaction History">
        {transactions.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No transactions yet"
            description="Record income and expenses to track your cash flow"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Account</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Note</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 15).map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-600">{formatDate(tx.date)}</td>
                    <td className="py-3 px-4">
                      <Badge variant={tx.type === 'income' ? 'success' : tx.type === 'expense' ? 'danger' : 'info'}>
                        {tx.type.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-900">
                      {tx.type === 'income' ? tx.to_account?.name : tx.from_account?.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{tx.note || '-'}</td>
                    <td className={`py-3 px-4 text-right font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount_base, tx.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Account Modal */}
      <Modal isOpen={showAccountModal} onClose={() => setShowAccountModal(false)} title="Create Treasury Account">
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <FormField label="Account Name" required>
            <Input name="name" placeholder="e.g., Main Treasury - USD" required />
          </FormField>
          <FormField label="Currency" required>
            <Select name="currency" required>
              <option value="USD">USD - US Dollar</option>
              <option value="CNY">CNY - Chinese Yuan</option>
              <option value="EUR">EUR - Euro</option>
            </Select>
          </FormField>
          <FormField label="Opening Balance">
            <Input name="opening_balance" type="number" step="0.01" defaultValue="0" />
          </FormField>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAccountModal(false)}>Cancel</Button>
            <Button type="submit">Create Account</Button>
          </div>
        </form>
      </Modal>

      {/* Create Transaction Modal */}
      <Modal isOpen={showTransactionModal} onClose={() => setShowTransactionModal(false)} title={transactionType === 'income' ? 'Record Income' : 'Record Expense'}>
        <form onSubmit={handleCreateTransaction} className="space-y-4">
          <FormField label="Date" required>
            <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
          </FormField>
          <FormField label="Account" required>
            <Select name="account_id" required>
              {treasuryAccounts.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Amount" required>
            <Input name="amount" type="number" step="0.01" placeholder="0.00" required />
          </FormField>
          <FormField label="Currency" required>
            <Select name="currency" required>
              <option value="USD">USD</option>
              <option value="CNY">CNY</option>
            </Select>
          </FormField>
          <FormField label="Exchange Rate" hint="Used for CNY to USD conversion">
            <Input name="exchange_rate" type="number" step="0.000001" defaultValue="1" />
          </FormField>
          <FormField label="Note">
            <Input name="note" placeholder="Description or reference" />
          </FormField>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowTransactionModal(false)}>Cancel</Button>
            <Button type="submit">{transactionType === 'income' ? 'Record Income' : 'Record Expense'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}