'use client'

import { useEffect, useState } from 'react'
import { Plus, Package, AlertTriangle, TrendingUp, ArrowDown, ArrowUp } from 'lucide-react'
import Modal from '@/components/Modal'
import EmptyState from '@/components/EmptyState'
import Badge from '@/components/Badge'
import { Card, FormField, Input, Select, Button } from '@/components/FormComponents'
import { getItems, getInventoryMovements, createItem, createInventoryAdjustment } from '@/lib/actions'
import { formatMoney, formatDate, getCategoryColor } from '@/lib/formatters'
import { isConfigured } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

interface Item {
  id: number
  name: string
  category: 'fabric' | 'accessory' | 'other'
  unit: string
  default_cost: number
  currency: string
  reorder_level: number
  stock?: number
  avg_cost?: number
  stock_value?: number
  is_low_stock?: boolean
}

interface InventoryMovement {
  id: number
  date: string
  item_id: number | null
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  unit_cost: number
  reference_type: string | null
  reference_id: number | null
  note: string | null
  item?: { name: string; unit: string }
}

// Demo data
const demoItems: Item[] = [
  { id: 1, name: 'Cotton Fabric - White', category: 'fabric', unit: 'meters', default_cost: 4.50, currency: 'USD', reorder_level: 500, stock: 2685, avg_cost: 4.50, stock_value: 12082.50 },
  { id: 2, name: 'Cotton Fabric - Black', category: 'fabric', unit: 'meters', default_cost: 4.50, currency: 'USD', reorder_level: 500, stock: 1850, avg_cost: 4.50, stock_value: 8325.00 },
  { id: 3, name: 'Polyester Thread - Black', category: 'accessory', unit: 'spools', default_cost: 0.80, currency: 'USD', reorder_level: 200, stock: 459.20, avg_cost: 0.80, stock_value: 367.36 },
  { id: 4, name: 'Metal Zipper 20cm', category: 'accessory', unit: 'pcs', default_cost: 0.35, currency: 'USD', reorder_level: 500, stock: 1798, avg_cost: 0.35, stock_value: 629.30, is_low_stock: true },
  { id: 5, name: 'Sewing Buttons - 15mm', category: 'accessory', unit: 'pcs', default_cost: 0.05, currency: 'USD', reorder_level: 1000, stock: 4000, avg_cost: 0.05, stock_value: 200.00, is_low_stock: true },
]

const demoMovements: InventoryMovement[] = [
  { id: 1, date: '2024-05-10', item_id: 1, type: 'out', quantity: 315, unit_cost: 4.50, reference_type: 'production', reference_id: 1, note: 'Material used for 200 T-shirts', item: { name: 'Cotton Fabric - White', unit: 'meters' } },
  { id: 2, date: '2024-05-10', item_id: 3, type: 'out', quantity: 40.80, unit_cost: 0.80, reference_type: 'production', reference_id: 1, note: 'Thread for 200 T-shirts', item: { name: 'Polyester Thread - Black', unit: 'spools' } },
  { id: 3, date: '2024-05-10', item_id: 4, type: 'out', quantity: 202, unit_cost: 0.35, reference_type: 'production', reference_id: 1, note: 'Zippers for 200 T-shirts', item: { name: 'Metal Zipper 20cm', unit: 'pcs' } },
  { id: 4, date: '2024-05-14', item_id: 3, type: 'in', quantity: 2000, unit_cost: 0.80, reference_type: 'purchase', reference_id: 2, note: 'PUR-2024-0002', item: { name: 'Polyester Thread - Black', unit: 'spools' } },
  { id: 5, date: '2024-05-14', item_id: 4, type: 'in', quantity: 5000, unit_cost: 0.35, reference_type: 'purchase', reference_id: 2, note: 'PUR-2024-0002', item: { name: 'Metal Zipper 20cm', unit: 'pcs' } },
  { id: 6, date: '2024-05-14', item_id: 5, type: 'in', quantity: 10000, unit_cost: 0.05, reference_type: 'purchase', reference_id: 2, note: 'PUR-2024-0002', item: { name: 'Sewing Buttons - 15mm', unit: 'pcs' } },
]

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [showItemModal, setShowItemModal] = useState(false)
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      if (isConfigured()) {
        const [itemsData, movementsData] = await Promise.all([
          getItems(),
          getInventoryMovements(100),
        ])
        setItems(itemsData)
        setMovements(movementsData)
      } else {
        setItems(demoItems)
        setMovements(demoMovements)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const handleCreateItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const result = await createItem({
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      unit: formData.get('unit') as string,
      default_cost: parseFloat(formData.get('default_cost') as string) || 0,
      currency: formData.get('currency') as string,
      reorder_level: parseFloat(formData.get('reorder_level') as string) || 0,
    })

    if (result.success) {
      showToast('success', 'Item created successfully')
      setShowItemModal(false)
      const itemsData = await getItems()
      setItems(itemsData)
    } else {
      showToast('error', result.error || 'Failed to create item')
    }
  }

  const handleCreateAdjustment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const result = await createInventoryAdjustment({
      date: formData.get('date') as string,
      item_id: parseInt(formData.get('item_id') as string),
      type: formData.get('type') as 'in' | 'out' | 'adjustment',
      quantity: parseFloat(formData.get('quantity') as string) || 0,
      unit_cost: parseFloat(formData.get('unit_cost') as string) || 0,
      note: formData.get('note') as string,
    })

    if (result.success) {
      showToast('success', 'Inventory adjustment recorded')
      setShowMovementModal(false)
      const movementsData = await getInventoryMovements(100)
      setMovements(movementsData)
    } else {
      showToast('error', result.error || 'Failed to record adjustment')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const totalValue = items.reduce((sum, item) => sum + (item.stock_value || 0), 0)
  const lowStockItems = items.filter(item => item.is_low_stock)
  const fabricCount = items.filter(i => i.category === 'fabric').length
  const accessoryCount = items.filter(i => i.category === 'accessory').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Inventory Management</h1>
          <p className="text-sm text-slate-500 mt-1">Track stock levels, values, and movements</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setShowMovementModal(true)}>
            <TrendingUp className="w-4 h-4 mr-2" /> Adjust Stock
          </Button>
          <Button onClick={() => setShowItemModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Items</p>
              <p className="text-2xl font-bold text-slate-900">{items.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Stock Value</p>
              <p className="text-xl font-bold text-slate-900">{formatMoney(totalValue)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Low Stock Alerts</p>
              <p className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Categories</p>
              <p className="text-lg font-bold text-slate-900">
                {fabricCount} fabrics, {accessoryCount} accessories
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Card title="Low Stock Alerts" className="border-yellow-200 bg-yellow-50">
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-yellow-200">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="font-medium text-slate-900">{item.name}</span>
                <span className="text-sm text-slate-500">
                  {item.stock?.toLocaleString()} / {item.reorder_level} {item.unit}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Items Grid */}
      <Card title="All Items">
        {items.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No items in inventory"
            description="Add items to start tracking inventory"
            action={{ label: 'Add Item', onClick: () => setShowItemModal(true) }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Item</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Category</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Stock</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Reorder Level</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Avg Cost</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Stock Value</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">Default: {formatMoney(item.default_cost)} / {item.unit}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={item.category === 'fabric' ? 'info' : item.category === 'accessory' ? 'purple' : 'gray'}>
                        {item.category}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-medium ${item.is_low_stock ? 'text-yellow-600' : 'text-slate-900'}`}>
                        {item.stock?.toLocaleString()} {item.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {item.reorder_level} {item.unit}
                    </td>
                    <td className="py-3 px-4 text-right">{formatMoney(item.avg_cost || item.default_cost)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900">
                      {formatMoney(item.stock_value || 0)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.is_low_stock ? (
                        <Badge variant="warning">Low Stock</Badge>
                      ) : (
                        <Badge variant="success">In Stock</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-semibold">
                  <td className="py-3 px-4" colSpan={5}>Total Stock Value</td>
                  <td className="py-3 px-4 text-right text-lg">{formatMoney(totalValue)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* Recent Movements */}
      <Card title="Recent Inventory Movements">
        {movements.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No movements yet"
            description="Inventory movements will appear here after purchases or production"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Item</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700">Type</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Quantity</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Unit Cost</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Reference</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Note</th>
                </tr>
              </thead>
              <tbody>
                {movements.slice(0, 10).map((mov) => (
                  <tr key={mov.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-600">{formatDate(mov.date)}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-slate-900">{mov.item?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{mov.item?.unit}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={mov.type === 'in' ? 'success' : mov.type === 'out' ? 'danger' : 'info'}>
                        {mov.type === 'in' ? <ArrowUp className="w-3 h-3 mr-1" /> : mov.type === 'out' ? <ArrowDown className="w-3 h-3 mr-1" /> : ''}
                        {mov.type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{mov.quantity}</td>
                    <td className="py-3 px-4 text-right">{formatMoney(mov.unit_cost)}</td>
                    <td className="py-3 px-4">
                      {mov.reference_type && (
                        <Badge variant="gray">{mov.reference_type} #{mov.reference_id}</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{mov.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Item Modal */}
      <Modal isOpen={showItemModal} onClose={() => setShowItemModal(false)} title="Add New Item">
        <form onSubmit={handleCreateItem} className="space-y-4">
          <FormField label="Item Name" required>
            <Input name="name" placeholder="e.g., Cotton Fabric - White" required />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category" required>
              <Select name="category" required>
                <option value="fabric">Fabric</option>
                <option value="accessory">Accessory</option>
                <option value="other">Other</option>
              </Select>
            </FormField>
            <FormField label="Unit" required>
              <Input name="unit" placeholder="e.g., meters, pcs" required />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Default Cost" required>
              <Input name="default_cost" type="number" step="0.01" placeholder="0.00" required />
            </FormField>
            <FormField label="Currency">
              <Select name="currency">
                <option value="USD">USD</option>
                <option value="CNY">CNY</option>
              </Select>
            </FormField>
          </div>
          <FormField label="Reorder Level" hint="Alert when stock falls below this level">
            <Input name="reorder_level" type="number" step="1" placeholder="0" />
          </FormField>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowItemModal(false)}>Cancel</Button>
            <Button type="submit">Add Item</Button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal isOpen={showMovementModal} onClose={() => setShowMovementModal(false)} title="Adjust Stock">
        <form onSubmit={handleCreateAdjustment} className="space-y-4">
          <FormField label="Date" required>
            <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
          </FormField>
          <FormField label="Item" required>
            <Select name="item_id" required>
              {items.map(i => (
                <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Movement Type" required>
            <Select name="type" required>
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
              <option value="adjustment">Adjustment</option>
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Quantity" required>
              <Input name="quantity" type="number" step="0.01" placeholder="0" required />
            </FormField>
            <FormField label="Unit Cost">
              <Input name="unit_cost" type="number" step="0.01" placeholder="0.00" />
            </FormField>
          </div>
          <FormField label="Note">
            <Input name="note" placeholder="Reason for adjustment" />
          </FormField>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowMovementModal(false)}>Cancel</Button>
            <Button type="submit">Record Adjustment</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}