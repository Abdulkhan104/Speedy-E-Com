// src/pages/Orders.tsx
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const STATUS_COLORS: Record<string, string> = {
  pending:    'status-pending',
  paid:       'status-paid',
  processing: 'status-processing',
  shipped:    'status-shipped',
  delivered:  'status-delivered',
  cancelled:  'status-cancelled',
}

export default function Orders() {
  const location = useLocation()
  const newOrderId = (location.state as any)?.newOrderId
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase
        .from('orders')
        .select('*, order_items(*, product:products(name, image_url))')
        .eq('user_id', data.user.id)
        .order('created_at', { ascending: false })
        .then(({ data: orders }) => {
          setOrders(orders || [])
          setLoading(false)
        })
    })
  }, [])

  if (loading) return <div className="page">Loading orders...</div>

  return (
    <div className="page">
      <h1 className="cart-title">Your orders</h1>

      {orders.length === 0 ? (
        <div className="empty-state"><p>No orders yet.</p></div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {orders.map(order => (
            <div
              key={order.id}
              className={`order-card ${order.id === newOrderId ? 'order-new' : ''}`}
            >
              {/* Header */}
              <div className="order-header">
                <div>
                  <p className="order-id">
                    Order #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="order-date">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <span className={`status-badge ${STATUS_COLORS[order.status] || ''}`}>
                    {order.status}
                  </span>
                  <span className="order-total">
                    ₹{order.total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="order-items">
                {order.order_items.map((item: any) => (
                  <div key={item.id} className="order-item-row">
                    <div className="order-item-img">
                      {item.product?.image_url
                        ? <img src={item.product.image_url} alt="" />
                        : <span>{item.product?.name?.[0] ?? '?'}</span>}
                    </div>
                    <span className="order-item-name">
                      {item.product?.name ?? 'Product'}
                    </span>
                    <span className="order-item-qty">× {item.quantity}</span>
                    <span className="order-item-price">
                      ₹{(item.unit_price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Address */}
              {order.shipping_address && (
                <p className="order-address">
                  Deliver to: {order.shipping_address.line1}, 
                  {order.shipping_address.city}, 
                  {order.shipping_address.pincode}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}