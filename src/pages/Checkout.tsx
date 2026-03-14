// src/pages/Checkout.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../hooks/useCart'

type CartItemWithProduct = {
  id: string
  product_id: string
  quantity: number
  product: { name: string; price: number; image_url: string | null }
}

type Address = {
  name: string
  line1: string
  city: string
  state: string
  pincode: string
  phone: string
}

export default function Checkout() {
  const navigate = useNavigate()
  const { fetchCartCount } = useCart()
  const [items, setItems] = useState<CartItemWithProduct[]>([])
  const [userId, setUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [address, setAddress] = useState<Address>({
    name: '', line1: '', city: '', state: '', pincode: '', phone: '',
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { navigate('/auth'); return }
      setUserId(data.user.id)
      loadCart(data.user.id)
    })
  }, [])

  async function loadCart(uid: string) {
    const { data } = await supabase
      .from('cart_items')
      .select('*, product:products(name, price, image_url)')
      .eq('user_id', uid)
    setItems((data as CartItemWithProduct[]) || [])
    setLoading(false)
  }

  const total = items.reduce(
    (sum, i) => sum + i.quantity * i.product.price, 0
  )

  function updateAddress(field: keyof Address, value: string) {
    setAddress(prev => ({ ...prev, [field]: value }))
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault()
    if (!items.length) return
    setPlacing(true)

    // 1. Create the order record
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        status: 'pending',
        total,
        shipping_address: address,
      })
      .select()
      .single()

    if (error || !order) {
      alert('Failed to place order. Please try again.')
      setPlacing(false)
      return
    }

    // 2. Insert order items (snapshot prices)
    await supabase.from('order_items').insert(
      items.map(i => ({
        order_id: order.id,
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.product.price,
      }))
    )

    // 3. Clear cart
    await supabase.from('cart_items').delete().eq('user_id', userId)
    fetchCartCount()

    // 4. Navigate to orders page
    navigate('/orders', { state: { newOrderId: order.id } })
  }

  if (loading) return <div className="page">Loading checkout...</div>

  if (!items.length) return (
    <div className="page">
      <div className="empty-state">
        <p>Your cart is empty.</p>
        <button className="nav-btn" onClick={() => navigate('/')} style={{marginTop:16}}>
          Browse products
        </button>
      </div>
    </div>
  )

  return (
    <div className="page">
      <h1 className="cart-title">Checkout</h1>
      <form onSubmit={placeOrder} className="checkout-layout">

        {/* Shipping address */}
        <div className="checkout-section">
          <h2 className="checkout-section-title">Shipping address</h2>
          <div className="checkout-form">
            {[
              { field: 'name',    label: 'Full name',    type: 'text',  ph: 'Rahul Sharma' },
              { field: 'phone',   label: 'Phone',        type: 'tel',   ph: '9876543210' },
              { field: 'line1',   label: 'Address',      type: 'text',  ph: '123, MG Road, Apt 4B' },
              { field: 'city',    label: 'City',         type: 'text',  ph: 'Hyderabad' },
              { field: 'state',   label: 'State',        type: 'text',  ph: 'Telangana' },
              { field: 'pincode', label: 'PIN code',     type: 'text',  ph: '500001' },
            ].map(({ field, label, type, ph }) => (
              <div key={field} className="form-group">
                <label>{label}</label>
                <input
                  type={type}
                  placeholder={ph}
                  value={address[field as keyof Address]}
                  onChange={e => updateAddress(field as keyof Address, e.target.value)}
                  required
                />
              </div>
            ))}
          </div>
        </div>

        {/* Order summary */}
        <div className="checkout-sidebar">
          <div className="cart-summary">
            <h2>Order summary</h2>
            <div style={{marginBottom:14,display:'flex',flexDirection:'column',gap:10}}>
              {items.map(i => (
                <div key={i.id} style={{display:'flex',justifyContent:'space-between',fontSize:13}}>
                  <span style={{color:'var(--muted)'}}>
                    {i.product.name} × {i.quantity}
                  </span>
                  <span style={{fontWeight:600}}>
                    ₹{(i.product.price * i.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span className="free">FREE</span>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span>₹{total.toLocaleString('en-IN')}</span>
            </div>
            <button
              type="submit"
              className="checkout-btn"
              disabled={placing}
            >
              {placing ? 'Placing order...' : 'Place order'}
            </button>
          </div>
        </div>

      </form>
    </div>
  )
}