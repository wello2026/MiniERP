'use client'

import { useEffect, useState } from 'react'
import { Plus, ShoppingCart, FileText, DollarSign, Package } from 'lucide-react'
import Modal from '@/components/Modal'
import EmptyState from '@/components/EmptyState'
import Badge from '@/components/Badge'
import { Card, FormField, Input, Select, Button } from '@/components/FormComponents'
import { getPurchases, getSuppliers, getItems, createPurchase } from '@/lib/actions'
import { formatMoney, formatDate, generateInvoiceNumber } from '@/lib/formatters'
import { isConfigured } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

interface Purchase {
  id: number
  invoice_no: string
  date: string
  currency: string
  exchange_rate: number
  subtotal: number
  total_base: number
  paid_amount: number
  note: string | null
  supplier?: { name: string; country: string }
  items?: { item: { name: string; unit: string }; quantity: number; unit_cost: number; total_cost: number }[]
}

interface Supplier {
  id: number
  name: string
  country: string
  currency: string
}

interface Item {
  id: number
  name: string
  category: string
  unit: string
  default_cost: number
}

// Demo data
const demoPurchases: Purchase[] = [
  {
    id: 1,
    invoice_no: 'PUR-2024-0001',
    date: '2024-05-20',
    currency: 'CNY',
    exchange_rate: 7.24,
    subtotal: 43500,
    total_base: 6008.29,
    paid_amount: 43500,
    note: 'Cotton fabric order',
    supplier: { name: 'Shanghai Textile Co.', country: 'China' },
    items: [
      { item: { name: 'Cotton Fabric - White', unit: 'meters' }, quantity: 6000, unit_cost: 4.50, total_cost: 27000 },
      { item: { name: 'Cotton Fabric - Black', unit: 'meters' }, quantity: 4000, unit_cost: 4.50, total_cost: 18000 },
    ],
  },
  {
    id: 2,
    invoice_no: 'PUR-2024-0002',
    date: '2024-05-14',
    currency: 'CNY',
    exchange_rate: 7.24,
    subtotal: 8700,
    total_base: 1201.66,
    paid_amount: 6000,
    note: 'Accessories order',
    supplier: { name: 'Guangzhou Accessories Ltd.', country: 'China' },
    items: [
      { item: { name: 'Polyester Thread - Black', unit: 'spools' }, quantity: 2000, unit_cost: 0.80, total_cost: 1600 },
      { item: { name: 'Metal Zipper 20cm', unit: 'pcs' }, quantity: 5000, unit_cost: 0.35, total_cost: 1750 },
      { item: { item: { name: 'Sewing Buttons - 15mm', unit: 'pcs' }, quantity: 10000, unit_cost: 0.05, total_cost: 500 },
    ],
  },
]

const demoSuppliers: Supplier[] = [
  { id: 1, name: 'Shanghai Textile Co.', country: 'China', currency: 'CNY' },
  { id: 2, name: 'Guangzhou Accessories Ltd.', country: 'China', currency: 'CNY' },
]

const demoItems: Item[] = [
  { id: 1, name: 'Cotton Fabric - White', category: 'fabric', unit: 'meters', default_cost: 4.50 },
  { id: 2, name: 'Cotton Fabric - Black', category: 'fabric', unit: 'meters', default_cost: 4.50 },
  { id: 3, name: 'Polyester Thread - Black', category: 'accessory', unit: 'spools', default_cost: 0.80 },
  { id: 4, name: 'Metal Zipper 20cm', category: 'accessory', unit: 'pcs', default_cost: 0.35 },
  { id: 5, name: 'Sewing Buttons - 15mm', category: 'accessory', unit: 'pcs', default_cost: 0.05 },
]

interface PurchaseItemRow {
  item_id: number
  quantity: number
  unit_cost: number
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItemRow[]>([
    { item_id: 0, quantity: 1, unit_cost: 0 },
  ])
  const { showToast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      if (isConfigured()) {
        const [purchasesData, suppliersData, itemsData] = await Promise.all([
          getPurchases(),
          getSuppliers(),
          getItems(),
        ])
        setPurchases(purchasesData)
        setSuppliers(suppliersData)
        setItems(itemsData)
      } else {
        setPurchases(demoPurchases)
        setSuppliers(demoSuppliers)
        setItems(demoItems)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const handleCreatePurchase = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const validItems = purchaseItems.filter(i => i.item_id > 0 && i.quantity > 0)

    const result = await createPurchase({
      supplier_id: parseInt(formData.get('supplier_id') as string),
      date: formData.get('date') as string,
      currency: formData.get('currency') as string,
      exchange_rate: parseFloat(formData.get('exchange_rate') as string) || 1,
      paid_amount: parseFloat(formData.get('paid_amount') as string) || 0,
      note: formData.get('note') as string,
      items: validItems.map(i => ({
        item_id: i.item_id,
        quantity: i.quantity,
        unit_cost: i.unit_cost,
      })),
    })

    if (result.success) {
      showToast('success', `Purchase ${result.invoice_no} created successfully`)
      setShowModal(false)
      setPurchaseItems([{ item_id: 0, quantity: 1, unit_cost: 0 }])
      const purchasesData = await getPurchases()
      setPurchases(purchasesData)
    } else {
      showToast('error', result.error || 'Failed to create purchase')
    }
  }

  const addPurchaseItem = () => {
    setPurchaseItems([...purchaseItems, { item_id: 0, quantity: 1, unit_cost: 0 }])
  }

  const removePurchaseItem = (index: number) => {
    if (purchaseItems.length > 1) {
      setPurchaseItems(purchaseItems.filter((_, i) => i !== index))
    }
  }

  const updatePurchaseItem = (index: number, field: string, value: number) => {
    const updated = [...purchaseItems]
    if (field === 'item_id') updated[index].item_id = value
    if (field === 'quantity') updated[index].quantity = value
    if (field === 'unit_cost') updated[index].unit_cost = value
    setPurchaseItems(updated)
  }

  const calculateSubtotal = () => {
    return purchaseItems.reduce((sum, item) => {
      return sum + (item.quantity || 0) * (item.unit_cost || 0)
    }, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const totalPurchases = purchases.reduce((sum, p) => sum + (p.total_base || 0), 0)
  const totalPaid = purchases.reduce((sum, p) => sum + (p.paid_amount || 0) * (p.exchange_rate || 1), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Purchase Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">Manage purchase orders and track supplier payments</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Purchase
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Purchases</p>
              <p className="text-2xl font-bold text-slate-900">{purchases.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Value</p>
              <p className="text-xl font-bold text-slate-900">{formatMoney(totalPurchases)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Paid</p>
              <p className="text-xl font-bold text-green-600">{formatMoney(totalPaid)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Outstanding</p>
              <p className="text-xl font-bold text-red-600">{formatMoney(totalPurchases - totalPaid)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Purchases List */}
      <Card title="All Purchases">
        {purchases.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No purchases yet"
            description="Create your first purchase invoice to start tracking"
            action={{ label: 'Create Purchase', onClick: () => setShowModal(true) }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Invoice</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Supplier</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Currency</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Subtotal</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">USD Value</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Paid</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Balance</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => {
                  const balance = (purchase.total_base || 0) - (purchase.paid_amount || 0) * (purchase.exchange_rate || 1)
                  const isPaid = balance <= 0
                  return (
                    <tr
                      key={purchase.id}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                      onClick={() => {
                        setSelectedPurchase(purchase)
                        setShowDetailModal(true)
                      }}
                    >
                      <td className="py-3 px-4 font-medium text-blue-600">{purchase.invoice_no}</td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(purchase.date)}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-slate-900">{purchase.supplier?.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{purchase.supplier?.country}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{purchase.currency}</td>
                      <td className="py-3 px-4 text-right">{formatMoney(purchase.subtotal, purchase.currency)}</td>
                      <td className="py-3 px-4 text-right font-medium">{formatMoney(purchase.total_base)}</td>
                      <td className="py-3 px-4 text-right text-green-600">{formatMoney((purchase.paid_amount || 0) * (purchase.exchange_rate || 1))}</td>
                      <td className={`py-3 px-4 text-right font-semibold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatMoney(balance)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={isPaid ? 'success' : 'warning'}>
                          {isPaid ? 'Paid' : 'Partial'}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Purchase Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Purchase Invoice" size="xl">
        <form onSubmit={handleCreatePurchase} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Supplier" required>
              <Select name="supplier_id" required>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Date" required>
              <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Currency" required>
              <Select name="currency" required>
                <option value="CNY">CNY - Yuan</option>
                <option value="USD">USD - Dollar</option>
              </Select>
            </FormField>
            <FormField label="Exchange Rate" hint="CNY to USD">
              <Input name="exchange_rate" type="number" step="0.000001" defaultValue="7.24" />
            </FormField>
            <FormField label="Amount Paid">
              <Input name="paid_amount" type="number" step="0.01" placeholder="0.00" />
            </FormField>
          </div>

          {/* Purchase Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-700">Purchase Items</label>
              <Button type="button" size="sm" variant="secondary" onClick={addPurchaseItem}>
                <Plus className="w-3 h-3 mr-1" /> Add Item
              </Button>
            </div>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">Item</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-700 w-24">Quantity</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-700 w-32">Unit Cost</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-700 w-32">Total</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseItems.map((item, index) => {
                    const selectedItem = items.find(i => i.id === item.item_id)
                    return (
                      <tr key={index} className="border-t border-slate-100">
                        <td className="py-2 px-3">
                          <select
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                            value={item.item_id}
                            onChange={(e) => {
                              const itemId = parseInt(e.target.value)
                              updatePurchaseItem(index, 'item_id', itemId)
                              const itemData = items.find(i => i.id === itemId)
                              if (itemData) {
                                updatePurchaseItem(index, 'unit_cost', itemData.default_cost)
                              }
                            }}
                          >
                            <option value={0}>Select item...</option>
                            {items.map(i => (
                              <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                            value={item.quantity}
                            onChange={(e) => updatePurchaseItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            min="0"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            step="0.01"
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                            value={item.unit_cost}
                            onChange={(e) => updatePurchaseItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                            min="0"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-medium">
                          {formatMoney(item.quantity * item.unit_cost, purchaseItems[0]?.item_id ? items.find(i => i.id === purchaseItems[0].item_id)?.name ? 'CNY' : 'USD' : 'USD')}
                        </td>
                        <td className="py-2 px-3">
                          <button
                            type="button"
                            onClick={() => removePurchaseItem(index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-2">
              <div className="text-right">
                <p className="text-sm text-slate-500">Subtotal ({purchaseItems[0]?.item_id ? 'CNY' : 'USD'})</p>
                <p className="text-xl font-bold text-slate-900">{formatMoney(calculateSubtotal(), purchaseItems[0]?.item_id ? 'CNY' : 'USD')}</p>
              </div>
            </div>
          </div>

          <FormField label="Note">
            <Input name="note" placeholder="Purchase notes or reference" />
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">Create Purchase</Button>
          </div>
        </form>
      </Modal>

      {/* Purchase Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedPurchase(null)
        }}
        title={`Purchase ${selectedPurchase?.invoice_no}`}
        size="lg"
      >
        {selectedPurchase && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Supplier</p>
                <p className="font-medium">{selectedPurchase.supplier?.name}</p>
              </div>
              <div>
                <p className="text-slate-500">Date</p>
                <p className="font-medium">{formatDate(selectedPurchase.date)}</p>
              </div>
              <div>
                <p className="text-slate-500">Currency</p>
                <p className="font-medium">{selectedPurchase.currency} @ {selectedPurchase.exchange_rate}</p>
              </div>
              <div>
                <p className="text-slate-500">Total in USD</p>
                <p className="font-bold">{formatMoney(selectedPurchase.total_base)}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Items</h4>
              <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left py-2 px-3">Item</th>
                    <th className="text-right py-2 px-3">Qty</th>
                    <th className="text-right py-2 px-3">Unit Cost</th>
                    <th className="text-right py-2 px-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPurchase.items?.map((item, index) => (
                    <tr key={index} className="border-t border-slate-100">
                      <td className="py-2 px-3">{item.item?.name || 'Item'}</td>
                      <td className="py-2 px-3 text-right">{item.quantity}</td>
                      <td className="py-2 px-3 text-right">{formatMoney(item.unit_cost)}</td>
                      <td className="py-2 px-3 text-right font-medium">{formatMoney(item.total_cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between border-t pt-4">
              <div>
                <p className="text-sm text-slate-500">Paid</p>
                <p className="text-green-600 font-semibold">{formatMoney((selectedPurchase.paid_amount || 0) * selectedPurchase.exchange_rate)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Balance</p>
                <p className="text-red-600 font-bold">{formatMoney((selectedPurchase.total_base || 0) - (selectedPurchase.paid_amount || 0) * selectedPurchase.exchange_rate)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}