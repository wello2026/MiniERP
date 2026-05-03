'use client'

import { useEffect, useState } from 'react'
import { Plus, Factory, Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import Modal from '@/components/Modal'
import EmptyState from '@/components/EmptyState'
import Badge from '@/components/Badge'
import { Card, FormField, Input, Select, Button } from '@/components/FormComponents'
import { getProducts, getProductionOrders, getItems, createProduct, createBomItem, createProductionOrder, deleteBomItem } from '@/lib/actions'
import { formatMoney, formatDate, generateProductionNumber } from '@/lib/formatters'
import { isConfigured } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

interface Product {
  id: number
  name: string
  sku: string
  target_price: number
  notes: string | null
  bom_items?: { id: number; item_id: number; quantity_per_unit: number; wastage_percent: number; item: { name: string; unit: string; default_cost: number } }[]
}

interface ProductionOrder {
  id: number
  date: string
  product_id: number | null
  quantity: number
  status: 'planned' | 'completed'
  material_cost: number
  labor_cost: number
  extra_cost: number
  total_cost: number
  cost_per_unit: number
  note: string | null
  product?: { name: string; sku: string }
}

interface Item {
  id: number
  name: string
  unit: string
  default_cost: number
  stock?: number
}

// Demo data
const demoProducts: Product[] = [
  {
    id: 1,
    name: 'Classic T-Shirt',
    sku: 'TSH-001',
    target_price: 25.00,
    notes: 'Basic crew neck t-shirt',
    bom_items: [
      { id: 1, item_id: 1, quantity_per_unit: 1.5, wastage_percent: 5, item: { name: 'Cotton Fabric - White', unit: 'meters', default_cost: 4.50 } },
      { id: 2, item_id: 3, quantity_per_unit: 0.2, wastage_percent: 2, item: { name: 'Polyester Thread - Black', unit: 'spools', default_cost: 0.80 } },
      { id: 3, item_id: 4, quantity_per_unit: 1, wastage_percent: 1, item: { name: 'Metal Zipper 20cm', unit: 'pcs', default_cost: 0.35 } },
    ],
  },
  {
    id: 2,
    name: 'Formal Shirt',
    sku: 'SHT-001',
    target_price: 45.00,
    notes: 'Button-down formal shirt',
    bom_items: [
      { id: 4, item_id: 2, quantity_per_unit: 2.2, wastage_percent: 5, item: { name: 'Cotton Fabric - Black', unit: 'meters', default_cost: 4.50 } },
      { id: 5, item_id: 3, quantity_per_unit: 0.3, wastage_percent: 2, item: { name: 'Polyester Thread - Black', unit: 'spools', default_cost: 0.80 } },
      { id: 6, item_id: 5, quantity_per_unit: 10, wastage_percent: 3, item: { name: 'Sewing Buttons - 15mm', unit: 'pcs', default_cost: 0.05 } },
    ],
  },
]

const demoOrders: ProductionOrder[] = [
  { id: 1, date: '2024-05-10', product_id: 1, quantity: 200, status: 'completed', material_cost: 1520.50, labor_cost: 800, extra_cost: 150, total_cost: 2470.50, cost_per_unit: 12.35, note: 'First production batch', product: { name: 'Classic T-Shirt', sku: 'TSH-001' } },
  { id: 2, date: '2024-05-18', product_id: 1, quantity: 150, status: 'planned', material_cost: 0, labor_cost: 0, extra_cost: 0, total_cost: 0, cost_per_unit: 0, note: 'Planned production', product: { name: 'Classic T-Shirt', sku: 'TSH-001' } },
]

const demoItems: Item[] = [
  { id: 1, name: 'Cotton Fabric - White', unit: 'meters', default_cost: 4.50, stock: 2685 },
  { id: 2, name: 'Cotton Fabric - Black', unit: 'meters', default_cost: 4.50, stock: 1850 },
  { id: 3, name: 'Polyester Thread - Black', unit: 'spools', default_cost: 0.80, stock: 459.20 },
  { id: 4, name: 'Metal Zipper 20cm', unit: 'pcs', default_cost: 0.35, stock: 1798 },
  { id: 5, name: 'Sewing Buttons - 15mm', unit: 'pcs', default_cost: 0.05, stock: 4000 },
]

export default function ProductionPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showBomModal, setShowBomModal] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      if (isConfigured()) {
        const [productsData, ordersData, itemsData] = await Promise.all([
          getProducts(),
          getProductionOrders(),
          getItems(),
        ])
        setProducts(productsData)
        setOrders(ordersData)
        setItems(itemsData)
      } else {
        setProducts(demoProducts)
        setOrders(demoOrders)
        setItems(demoItems)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const handleCreateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const result = await createProduct({
      name: formData.get('name') as string,
      sku: formData.get('sku') as string,
      target_price: parseFloat(formData.get('target_price') as string) || 0,
      notes: formData.get('notes') as string,
    })

    if (result.success) {
      showToast('success', 'Product created successfully')
      setShowProductModal(false)
      const productsData = await getProducts()
      setProducts(productsData)
    } else {
      showToast('error', result.error || 'Failed to create product')
    }
  }

  const handleAddBomItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const result = await createBomItem({
      product_id: parseInt(formData.get('product_id') as string),
      item_id: parseInt(formData.get('item_id') as string),
      quantity_per_unit: parseFloat(formData.get('quantity_per_unit') as string) || 0,
      wastage_percent: parseFloat(formData.get('wastage_percent') as string) || 0,
    })

    if (result.success) {
      showToast('success', 'BOM item added')
      setShowBomModal(false)
      const productsData = await getProducts()
      setProducts(productsData)
    } else {
      showToast('error', result.error || 'Failed to add BOM item')
    }
  }

  const handleDeleteBomItem = async (id: number) => {
    const result = await deleteBomItem(id)
    if (result.success) {
      showToast('success', 'BOM item removed')
      const productsData = await getProducts()
      setProducts(productsData)
    } else {
      showToast('error', 'Failed to remove BOM item')
    }
  }

  const handleCreateOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const result = await createProductionOrder({
      date: formData.get('date') as string,
      product_id: parseInt(formData.get('product_id') as string),
      quantity: parseFloat(formData.get('quantity') as string) || 0,
      labor_cost: parseFloat(formData.get('labor_cost') as string) || 0,
      extra_cost: parseFloat(formData.get('extra_cost') as string) || 0,
      note: formData.get('note') as string,
    })

    if (result.success) {
      showToast('success', 'Production order created successfully')
      setShowOrderModal(false)
      const ordersData = await getProductionOrders()
      setOrders(ordersData)
    } else {
      showToast('error', result.error || 'Failed to create order')
    }
  }

  const calculateRequiredMaterials = (product: Product, quantity: number) => {
    if (!product.bom_items) return []
    return product.bom_items.map(bom => {
      const baseQty = bom.quantity_per_unit * quantity
      const wastageQty = baseQty * (bom.wastage_percent / 100)
      const totalQty = baseQty + wastageQty
      const cost = totalQty * bom.item.default_cost
      return {
        ...bom,
        total_qty: totalQty,
        cost,
        available: bom.item_id ? (items.find(i => i.id === bom.item_id)?.stock || 0) : 0,
        sufficient: bom.item_id ? (items.find(i => i.id === bom.item_id)?.stock || 0) >= totalQty : true,
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const completedOrders = orders.filter(o => o.status === 'completed')
  const plannedOrders = orders.filter(o => o.status === 'planned')
  const totalProductionCost = completedOrders.reduce((sum, o) => sum + o.total_cost, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Production Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage products, BOM, and production orders</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setShowProductModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
          <Button onClick={() => setShowOrderModal(true)}>
            <Factory className="w-4 h-4 mr-2" /> New Order
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
              <p className="text-sm text-slate-500">Products</p>
              <p className="text-2xl font-bold text-slate-900">{products.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Completed Orders</p>
              <p className="text-2xl font-bold text-slate-900">{completedOrders.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Planned Orders</p>
              <p className="text-2xl font-bold text-slate-900">{plannedOrders.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Factory className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Production Cost</p>
              <p className="text-xl font-bold text-slate-900">{formatMoney(totalProductionCost)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Products with BOM */}
      <Card title="Products & Bill of Materials">
        {products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products yet"
            description="Create products and define their bill of materials"
            action={{ label: 'Add Product', onClick: () => setShowProductModal(true) }}
          />
        ) : (
          <div className="space-y-6">
            {products.map((product) => (
              <div key={product.id} className="border border-slate-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
                      <Badge variant="gray">{product.sku}</Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      Target Price: {formatMoney(product.target_price)} | Margin: {(product.target_price > 0 ? (product.target_price - (product.bom_items?.reduce((sum, b) => sum + b.quantity_per_unit * b.item.default_cost, 0) || 0)) / product.target_price * 100 : 0).toFixed(0)}%
                    </p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => { setSelectedProduct(product); setShowBomModal(true) }}>
                    <Plus className="w-3 h-3 mr-1" /> Add BOM
                  </Button>
                </div>

                {product.bom_items && product.bom_items.length > 0 ? (
                  <div className="bg-slate-50 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 px-4 font-semibold text-slate-700">Material</th>
                          <th className="text-right py-2 px-4 font-semibold text-slate-700">Qty/Unit</th>
                          <th className="text-right py-2 px-4 font-semibold text-slate-700">Wastage</th>
                          <th className="text-right py-2 px-4 font-semibold text-slate-700">Unit Cost</th>
                          <th className="text-right py-2 px-4 font-semibold text-slate-700">Cost</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.bom_items.map((bom) => (
                          <tr key={bom.id} className="border-b border-slate-200 last:border-0">
                            <td className="py-2 px-4 font-medium">{bom.item.name}</td>
                            <td className="py-2 px-4 text-right">{bom.quantity_per_unit} {bom.item.unit}</td>
                            <td className="py-2 px-4 text-right text-slate-500">{bom.wastage_percent}%</td>
                            <td className="py-2 px-4 text-right">{formatMoney(bom.item.default_cost)}</td>
                            <td className="py-2 px-4 text-right font-medium">{formatMoney(bom.quantity_per_unit * bom.item.default_cost * (1 + bom.wastage_percent / 100))}</td>
                            <td className="py-2 px-4">
                              <button
                                onClick={() => handleDeleteBomItem(bom.id)}
                                className="text-red-500 hover:text-red-700 text-sm"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100">
                          <td colSpan={4} className="py-2 px-4 font-semibold">Material Cost per Unit</td>
                          <td className="py-2 px-4 text-right font-bold">
                            {formatMoney(
                              product.bom_items.reduce((sum, b) =>
                                sum + b.quantity_per_unit * b.item.default_cost * (1 + b.wastage_percent / 100), 0
                              )
                            )}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">No BOM defined yet</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Production Orders */}
      <Card title="Production Orders">
        {orders.length === 0 ? (
          <EmptyState
            icon={Factory}
            title="No production orders"
            description="Create production orders to start manufacturing"
            action={{ label: 'New Order', onClick: () => setShowOrderModal(true) }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Order</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Product</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Quantity</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Material</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Labor</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Extra</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Total</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Cost/Unit</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium">#{order.id}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(order.date)}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-slate-900">{order.product?.name}</p>
                        <p className="text-xs text-slate-500">{order.product?.sku}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{order.quantity}</td>
                    <td className="py-3 px-4 text-right">{formatMoney(order.material_cost)}</td>
                    <td className="py-3 px-4 text-right">{formatMoney(order.labor_cost)}</td>
                    <td className="py-3 px-4 text-right">{formatMoney(order.extra_cost)}</td>
                    <td className="py-3 px-4 text-right font-semibold">{formatMoney(order.total_cost)}</td>
                    <td className="py-3 px-4 text-right font-bold text-blue-600">{formatMoney(order.cost_per_unit)}</td>
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

      {/* Create Product Modal */}
      <Modal isOpen={showProductModal} onClose={() => setShowProductModal(false)} title="Add New Product">
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <FormField label="Product Name" required>
            <Input name="name" placeholder="e.g., Classic T-Shirt" required />
          </FormField>
          <FormField label="SKU" required>
            <Input name="sku" placeholder="e.g., TSH-001" required />
          </FormField>
          <FormField label="Target Price" hint="Expected selling price">
            <Input name="target_price" type="number" step="0.01" placeholder="0.00" />
          </FormField>
          <FormField label="Notes">
            <Input name="notes" placeholder="Product description" />
          </FormField>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowProductModal(false)}>Cancel</Button>
            <Button type="submit">Add Product</Button>
          </div>
        </form>
      </Modal>

      {/* Add BOM Item Modal */}
      <Modal isOpen={showBomModal} onClose={() => setShowBomModal(false)} title="Add BOM Item">
        <form onSubmit={handleAddBomItem} className="space-y-4">
          <input type="hidden" name="product_id" value={selectedProduct?.id || ''} />
          <FormField label="Material" required>
            <Select name="item_id" required>
              {items.map(i => (
                <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
              ))}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Quantity per Unit" required>
              <Input name="quantity_per_unit" type="number" step="0.01" placeholder="1.0" required />
            </FormField>
            <FormField label="Wastage %" hint="Expected material loss">
              <Input name="wastage_percent" type="number" step="0.1" defaultValue="0" />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowBomModal(false)}>Cancel</Button>
            <Button type="submit">Add to BOM</Button>
          </div>
        </form>
      </Modal>

      {/* Create Production Order Modal */}
      <Modal isOpen={showOrderModal} onClose={() => setShowOrderModal(false)} title="Create Production Order" size="lg">
        <form onSubmit={handleCreateOrder} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date" required>
              <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
            </FormField>
            <FormField label="Product" required>
              <Select name="product_id" required>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </Select>
            </FormField>
          </div>

          <FormField label="Production Quantity" required>
            <Input name="quantity" type="number" step="1" placeholder="100" required />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Labor Cost">
              <Input name="labor_cost" type="number" step="0.01" placeholder="0.00" />
            </FormField>
            <FormField label="Extra Costs">
              <Input name="extra_cost" type="number" step="0.01" placeholder="0.00" />
            </FormField>
          </div>

          <FormField label="Note">
            <Input name="note" placeholder="Production notes" />
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => setShowOrderModal(false)}>Cancel</Button>
            <Button type="submit">Create Order</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}