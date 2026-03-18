// src/pages/admin/AdminOrders.tsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const STATUSES = [
  'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled',
]

type OrderItem = {
  id: string
  quantity: number
  unit_price: number
  product: { name: string } | null
}

type Order = {
  id: string
  status: string
  total: number
  created_at: string
  shipping_address: {
    name: string
    line1: string
    city: string
    pincode: string
    phone: string
  } | null
  order_items: OrderItem[]
}

export default function AdminOrders() {
  const [orders, setOrders]   = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')

  useEffect(() => { load() }, [])

  async function load() {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        total,
        created_at,
        shipping_address,
        order_items (
          id,
          quantity,
          unit_price,
          product:products ( name )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setOrders([])
      setLoading(false)
      return
    }

    // Type conversion/fix: .product comes as array or null from supabase,
    // but we want product: { name } | null
    // So: convert product to single object (first element), or null
    const fixedData: Order[] = (data ?? []).map((order: any) => ({
      ...order,
      order_items: (order.order_items ?? []).map((item: any) => ({
        ...item,
        product: Array.isArray(item.product)
          ? (item.product.length > 0 ? item.product[0] : null)
          : (item.product ?? null)
      }))
    }))
    setOrders(fixedData)
    setLoading(false)
  }

  async function updateStatus(orderId: string, status: string) {
    // Optimistic update — UI changes instantly
    setOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, status } : o)
    )
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
    if (error) {
      console.error(error)
      load() // revert on error
    }
  }

  const filtered = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter)

  if (loading) return <p className="admin-loading">Loading orders...</p>

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Orders</h1>
        <span className="order-count">{filtered.length} orders</span>
      </div>

      {/* Filter tabs */}
      <div className="admin-filter-tabs">
        {['all', ...STATUSES].map(s => (
          <button
            key={s}
            className={`admin-filter-tab${filter === s ? ' active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 && (
          <div className="empty-state">No {filter} orders found.</div>
        )}

        {filtered.map(order => (
          <div key={order.id} className="admin-order-card">
            {/* Header */}
            <div className="admin-order-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span className="mono" style={{ fontWeight: 700, fontSize: 13 }}>
                  #{order.id.slice(0, 8).toUpperCase()}
                </span>
                <span className="admin-order-date">
                  {new Date(order.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </span>
              </div>

              <div className="admin-order-right">
                <span className="admin-order-total">
                  ₹{order.total.toLocaleString('en-IN')}
                </span>
                <select
                  className="status-select"
                  value={order.status}
                  onChange={e => updateStatus(order.id, e.target.value)}
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Items */}
            <div className="admin-order-items">
              {order.order_items.map(item => (
                <span key={item.id} className="admin-order-item-pill">
                  {item.product?.name ?? 'Unknown'} × {item.quantity}
                   (₹{(item.unit_price * item.quantity).toLocaleString('en-IN')})
                </span>
              ))}
            </div>

            {/* Shipping address */}
            {order.shipping_address && (
              <p className="admin-order-addr">
                {order.shipping_address.name} — 
                {order.shipping_address.line1}, 
                {order.shipping_address.city}, 
                {order.shipping_address.pincode} 
                | {order.shipping_address.phone}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}