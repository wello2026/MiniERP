'use client'

import { useEffect, useState } from 'react'
import { ArrowLeftRight, ArrowRight } from 'lucide-react'
import Modal from '@/components/Modal'
import EmptyState from '@/components/EmptyState'
import Badge from '@/components/Badge'
import { Card, FormField, Input, Select, Button } from '@/components/FormComponents'
import { getAccounts, createTransaction } from '@/lib/actions'
import { formatMoney, formatDate } from '@/lib/formatters'
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

// Demo data
const demoAccounts: Account[] = [
  { id: 1, name: 'Main Treasury - USD', type: 'treasury', currency: 'USD', opening_balance: 50000, balance: 53500 },
  { id: 2, name: 'Treasury China - CNY', type: 'treasury', currency: 'CNY', opening_balance: 120000, balance: 125000 },
]

const demoTransfers = [
  { id: 1, date: '2024-05-12', from_account: 'Treasury China - CNY', to_account: 'Main Treasury - USD', amount: 6000, currency: 'CNY', exchange_rate: 7.24, note: 'Monthly transfer for operations' },
]

export default function TransfersPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      if (isConfigured()) {
        const accountsData = await getAccounts()
        setAccounts(accountsData)
      } else {
        setAccounts(demoAccounts)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const handleCreateTransfer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    // Create transfer (expense from source, income to destination)
    const amount = parseFloat(formData.get('amount') as string) || 0
    const fromAccountId = parseInt(formData.get('from_account_id') as string)
    const toAccountId = parseInt(formData.get('to_account_id') as string)
    const exchangeRate = parseFloat(formData.get('exchange_rate') as string) || 1

    // Create expense transaction (from source)
    const expenseResult = await createTransaction({
      date: formData.get('date') as string,
      type: 'transfer',
      from_account_id: fromAccountId,
      amount,
      currency: formData.get('currency') as string,
      exchange_rate: exchangeRate,
      amount_base: amount * exchangeRate,
      note: `Transfer to ${accounts.find(a => a.id === toAccountId)?.name}: ${formData.get('note')}`,
    })

    // Create income transaction (to destination)
    const incomeResult = await createTransaction({
      date: formData.get('date') as string,
      type: 'transfer',
      to_account_id: toAccountId,
      amount,
      currency: formData.get('currency') as string,
      exchange_rate: exchangeRate,
      amount_base: amount * exchangeRate,
      note: `Transfer from ${accounts.find(a => a.id === fromAccountId)?.name}: ${formData.get('note')}`,
    })

    if (expenseResult.success && incomeResult.success) {
      showToast('success', 'Transfer completed successfully')
      setShowModal(false)
    } else {
      showToast('error', 'Failed to create transfer')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const treasuryAccounts = accounts.filter(a => a.type === 'treasury')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Money Transfers</h1>
          <p className="text-sm text-slate-500 mt-1">Transfer funds between treasury accounts</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <ArrowLeftRight className="w-4 h-4 mr-2" /> New Transfer
        </Button>
      </div>

      {/* Accounts Comparison */}
      {treasuryAccounts.length >= 2 && (
        <Card title="Treasury Overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {treasuryAccounts.map((account) => (
              <div key={account.id} className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Account</p>
                    <p className="font-medium text-slate-900">{account.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Balance</p>
                    <p className="text-xl font-bold text-slate-900">{formatMoney(account.balance || account.opening_balance, account.currency)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Transfer Visual */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <ArrowLeftRight className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-blue-700">Transfer Funds</span>
            </div>
          </div>
        </Card>
      )}

      {/* Transfer History */}
      <Card title="Transfer History">
        {demoTransfers.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="No transfers yet"
            description="Create your first transfer to move funds between accounts"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">From</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700"></th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">To</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Amount</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Rate</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Note</th>
                </tr>
              </thead>
              <tbody>
                {demoTransfers.map((transfer) => (
                  <tr key={transfer.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-600">{formatDate(transfer.date)}</td>
                    <td className="py-3 px-4 text-slate-900">{transfer.from_account}</td>
                    <td className="py-3 px-4 text-center">
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </td>
                    <td className="py-3 px-4 text-slate-900">{transfer.to_account}</td>
                    <td className="py-3 px-4 text-right font-semibold">{formatMoney(transfer.amount, transfer.currency)}</td>
                    <td className="py-3 px-4 text-right text-slate-500">{transfer.exchange_rate}</td>
                    <td className="py-3 px-4 text-slate-600">{transfer.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Transfer Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Transfer" size="lg">
        <form onSubmit={handleCreateTransfer} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date" required>
              <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
            </FormField>
            <FormField label="Currency" required>
              <Select name="currency" required>
                <option value="USD">USD</option>
                <option value="CNY">CNY</option>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="From Account" required>
              <Select name="from_account_id" required>
                {treasuryAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="To Account" required>
              <Select name="to_account_id" required>
                {treasuryAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
            </FormField>
          </div>

          <FormField label="Amount" required>
            <Input name="amount" type="number" step="0.01" placeholder="0.00" required />
          </FormField>

          <FormField label="Exchange Rate" hint="For currency conversion tracking">
            <Input name="exchange_rate" type="number" step="0.000001" defaultValue="1" />
          </FormField>

          <FormField label="Note">
            <Input name="note" placeholder="Transfer description or reference" />
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">Create Transfer</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}