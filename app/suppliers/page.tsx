'use client'

import { useEffect, useState } from 'react'
import { Plus, Users, Phone, MapPin, DollarSign } from 'lucide-react'
import Modal from '@/components/Modal'
import EmptyState from '@/components/EmptyState'
import Badge from '@/components/Badge'
import { Card, FormField, Input, Select, Button } from '@/components/FormComponents'
import { getSuppliers, getPurchases, createSupplier } from '@/lib/actions'
import { formatMoney, formatDate } from '@/lib/formatters'
import { isConfigured } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

interface Supplier {
  id: number
  name: string
  country: string
  currency: string
  phone: string | null
  notes: string | null
  total_purchases?: number
  total_paid?: number
  balance?: number
}

interface Purchase {
  id: number
  invoice_no: string
  date: string
  total_base: number
  paid_amount: number
  note: string | null
}

// Demo data
const demoSuppliers: Supplier[] = [
  { id: 1, name: 'Shanghai Textile Co.', country: 'China', currency: 'CNY', phone: '+86-21-5555-1234', notes: 'Primary fabric supplier', total_purchases: 6008.29, total_paid: 6008.29, balance: 0 },
  { id: 2, name: 'Guangzhou Accessories Ltd.', country: 'China', currency: 'CNY', phone: '+86-20-8888-5678', notes: 'Zippers, buttons, threads', total_purchases: 1201.66, total_paid: 828.73, balance: 372.93 },
]

const demoPurchases: Purchase[] = [
  { id: 1, invoice_no: 'PUR-2024-0001', date: '2024-05-20', total_base: 6008.29, paid_amount: 6008.29, note: 'Cotton fabric order' },
  { id: 2, invoice_no: 'PUR-2024-0002', date: '2024-05-14', total_base: 1201.66, paid_amount: 828.73, note: 'Accessories order' },
]

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      if (isConfigured()) {
        const [suppliersData, purchasesData] = await Promise.all([
          getSuppliers(),
          getPurchases(),
        ])
        setSuppliers(suppliersData)
        setPurchases(purchasesData)
      } else {
        setSuppliers(demoSuppliers)
        setPurchases(demoPurchases)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const handleCreateSupplier = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const result = await createSupplier({
      name: formData.get('name') as string,
      country: formData.get('country') as string,
      currency: formData.get('currency') as string,
      phone: formData.get('phone') as string,
      notes: formData.get('notes') as string,
    })

    if (result.success) {
      showToast('success', 'Supplier created successfully')
      setShowModal(false)
      const suppliersData = await getSuppliers()
      setSuppliers(suppliersData)
    } else {
      showToast('error', result.error || 'Failed to create supplier')
    }
  }

  const supplierPurchases = (supplierId: number) => {
    return purchases.filter(p => {
      return demoSuppliers.find(s => s.id === supplierId)
    })
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Supplier Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage suppliers and track outstanding balances</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Supplier
        </Button>
      </div>

      {/* Supplier Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Suppliers</p>
              <p className="text-2xl font-bold text-slate-900">{suppliers.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Outstanding</p>
              <p className="text-2xl font-bold text-slate-900">
                {formatMoney(suppliers.reduce((sum, s) => sum + (s.balance || 0), 0))}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Countries</p>
              <p className="text-2xl font-bold text-slate-900">
                {new Set(suppliers.map(s => s.country)).size}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Suppliers List */}
      <Card title="All Suppliers">
        {suppliers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No suppliers yet"
            description="Add your first supplier to start managing purchases"
            action={{ label: 'Add Supplier', onClick: () => setShowModal(true) }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((supplier) => (
              <div
                key={supplier.id}
                onClick={() => setSelectedSupplier(supplier)}
                className="p-5 border border-slate-200 rounded-xl hover:shadow-md hover:border-blue-200 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">{supplier.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{supplier.name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {supplier.country}
                      </p>
                    </div>
                  </div>
                  {(supplier.balance || 0) > 0 && (
                    <Badge variant="warning">Outstanding</Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4" />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-slate-500">Total Purchases</span>
                    <span className="font-semibold text-slate-900">{formatMoney(supplier.total_purchases || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Paid</span>
                    <span className="font-medium text-green-600">{formatMoney(supplier.total_paid || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-slate-700 font-medium">Balance Due</span>
                    <span className={`font-bold ${(supplier.balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatMoney(supplier.balance || 0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Supplier Detail Panel */}
      {selectedSupplier && (
        <Card title={`${selectedSupplier.name} - Purchase History`}>
          <button
            onClick={() => setSelectedSupplier(null)}
            className="mb-4 text-sm text-slate-500 hover:text-slate-700"
          >
            ← Back to suppliers
          </button>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Invoice</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Total</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Paid</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 font-medium">{demoPurchases[0]?.invoice_no}</td>
                  <td className="py-3 px-4 text-slate-600">{formatDate(demoPurchases[0]?.date)}</td>
                  <td className="py-3 px-4 text-right">{formatMoney(demoPurchases[0]?.total_base)}</td>
                  <td className="py-3 px-4 text-right text-green-600">{formatMoney(demoPurchases[0]?.paid_amount * 7.24)}</td>
                  <td className="py-3 px-4 text-right text-green-600">$0.00</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 font-medium">{demoPurchases[1]?.invoice_no}</td>
                  <td className="py-3 px-4 text-slate-600">{formatDate(demoPurchases[1]?.date)}</td>
                  <td className="py-3 px-4 text-right">{formatMoney(demoPurchases[1]?.total_base)}</td>
                  <td className="py-3 px-4 text-right text-yellow-600">{formatMoney(demoPurchases[1]?.paid_amount * 7.24)}</td>
                  <td className="py-3 px-4 text-right text-red-600">{formatMoney(372.93)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Supplier Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Supplier">
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <FormField label="Supplier Name" required>
            <Input name="name" placeholder="e.g., Shanghai Textile Co." required />
          </FormField>
          <FormField label="Country" required>
            <Select name="country" required>
              <option value="China">China</option>
              <option value="USA">USA</option>
              <option value="Vietnam">Vietnam</option>
              <option value="India">India</option>
              <option value="Bangladesh">Bangladesh</option>
            </Select>
          </FormField>
          <FormField label="Currency" required>
            <Select name="currency" required>
              <option value="CNY">CNY - Chinese Yuan</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
            </Select>
          </FormField>
          <FormField label="Phone">
            <Input name="phone" placeholder="+86-21-5555-1234" />
          </FormField>
          <FormField label="Notes">
            <Input name="notes" placeholder="Additional notes" />
          </FormField>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">Add Supplier</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}