'use client'

import { useEffect, useState } from 'react'
import { Settings as SettingsIcon, DollarSign, Building2, Globe } from 'lucide-react'
import { Card, FormField, Input, Select, Button } from '@/components/FormComponents'
import { getSettings, updateSettings, getExchangeRates, upsertExchangeRate, getExpenseCategories, createExpenseCategory } from '@/lib/actions'
import { formatMoney, formatDate } from '@/lib/formatters'
import { isConfigured } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

interface Setting {
  id: number
  company_name: string
  base_currency: string
  secondary_currency: string
}

interface ExchangeRate {
  id: number
  from_currency: string
  to_currency: string
  rate: number
  date: string
}

interface ExpenseCategory {
  id: number
  name: string
}

// Demo data
const demoSettings: Setting = {
  id: 1,
  company_name: 'Mini ERP Pro',
  base_currency: 'USD',
  secondary_currency: 'CNY',
}

const demoExchangeRates: ExchangeRate[] = [
  { id: 1, from_currency: 'USD', to_currency: 'CNY', rate: 7.24, date: '2024-05-15' },
  { id: 2, from_currency: 'CNY', to_currency: 'USD', rate: 0.138, date: '2024-05-15' },
  { id: 3, from_currency: 'USD', to_currency: 'EUR', rate: 0.92, date: '2024-05-15' },
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

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting>(demoSettings)
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>(demoExchangeRates)
  const [categories, setCategories] = useState<ExpenseCategory[]>(demoCategories)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      if (isConfigured()) {
        const [settingsData, ratesData, categoriesData] = await Promise.all([
          getSettings(),
          getExchangeRates(),
          getExpenseCategories(),
        ])
        if (settingsData) setSettings(settingsData)
        setExchangeRates(ratesData)
        setCategories(categoriesData)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const handleUpdateSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)

    const formData = new FormData(e.currentTarget)
    const result = await updateSettings({
      company_name: formData.get('company_name') as string,
      base_currency: formData.get('base_currency') as string,
      secondary_currency: formData.get('secondary_currency') as string,
    })

    setSaving(false)
    if (result.success) {
      showToast('success', 'Settings updated successfully')
      const settingsData = await getSettings()
      if (settingsData) setSettings(settingsData)
    } else {
      showToast('error', result.error || 'Failed to update settings')
    }
  }

  const handleAddExchangeRate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const result = await upsertExchangeRate({
      from_currency: formData.get('from_currency') as string,
      to_currency: formData.get('to_currency') as string,
      rate: parseFloat(formData.get('rate') as string) || 0,
      date: formData.get('date') as string,
    })

    if (result.success) {
      showToast('success', 'Exchange rate saved')
      const ratesData = await getExchangeRates()
      setExchangeRates(ratesData)
    } else {
      showToast('error', result.error || 'Failed to save rate')
    }
  }

  const handleAddCategory = async (name: string) => {
    if (!name.trim()) return
    const result = await createExpenseCategory(name)
    if (result.success) {
      showToast('success', 'Category added')
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">System Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure your company settings and preferences</p>
      </div>

      {/* Company Settings */}
      <Card title="Company Information">
        <form onSubmit={handleUpdateSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Company Name">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-slate-400" />
                <Input name="company_name" defaultValue={settings.company_name} />
              </div>
            </FormField>
            <FormField label="System Status">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700">Active</span>
                <span className="text-xs text-slate-500 ml-2">
                  {isConfigured() ? 'Connected to database' : 'Demo mode - no database'}
                </span>
              </div>
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Base Currency">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-slate-400" />
                <Select name="base_currency" defaultValue={settings.base_currency}>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                </Select>
              </div>
            </FormField>
            <FormField label="Secondary Currency">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-slate-400" />
                <Select name="secondary_currency" defaultValue={settings.secondary_currency}>
                  <option value="CNY">CNY - Chinese Yuan</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="VND">VND - Vietnamese Dong</option>
                </Select>
              </div>
            </FormField>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" loading={saving}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Exchange Rates */}
      <Card
        title="Exchange Rates"
        action={
          <form onSubmit={handleAddExchangeRate} className="flex items-center gap-2">
            <Select name="from_currency" className="text-xs w-20">
              <option value="USD">USD</option>
              <option value="CNY">CNY</option>
              <option value="EUR">EUR</option>
            </Select>
            <span className="text-slate-400">→</span>
            <Select name="to_currency" className="text-xs w-20">
              <option value="CNY">CNY</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </Select>
            <Input name="rate" type="number" step="0.000001" placeholder="Rate" className="w-24 text-xs" />
            <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-32 text-xs" />
            <Button type="submit" size="sm">Add</Button>
          </form>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">From</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">To</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">Rate</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {exchangeRates.map((rate) => (
                <tr key={rate.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-900">{rate.from_currency}</td>
                  <td className="py-3 px-4 text-slate-600">{rate.to_currency}</td>
                  <td className="py-3 px-4 text-right font-semibold">{rate.rate.toFixed(6)}</td>
                  <td className="py-3 px-4 text-slate-500">{formatDate(rate.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Expense Categories */}
      <Card
        title="Expense Categories"
        action={
          <div className="flex gap-2">
            <Input
              placeholder="New category..."
              className="w-40 text-xs"
              id="new-category-input"
            />
            <Button
              size="sm"
              onClick={() => {
                const input = document.getElementById('new-category-input') as HTMLInputElement
                if (input?.value) {
                  handleAddCategory(input.value)
                  input.value = ''
                }
              }}
            >
              Add
            </Button>
          </div>
        }
      >
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg"
            >
              <span className="text-sm font-medium text-slate-700">{category.name}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-slate-500">
          Click Add to create new expense categories. Categories are used to classify and track business expenses.
        </div>
      </Card>

      {/* System Info */}
      <Card title="System Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Application Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Database Status</span>
              <span className={`font-medium ${isConfigured() ? 'text-green-600' : 'text-yellow-600'}`}>
                {isConfigured() ? 'Connected' : 'Demo Mode'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Last Updated</span>
              <span className="font-medium">{new Date().toLocaleDateString()}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Base Currency</span>
              <span className="font-medium">{settings.base_currency}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Secondary Currency</span>
              <span className="font-medium">{settings.secondary_currency}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Exchange Rate (USD/CNY)</span>
              <span className="font-medium">7.24</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}