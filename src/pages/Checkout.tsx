// src/pages/Checkout.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../hooks/useCart'

// Tell TypeScript about Razorpay global loaded from index.html script tag
declare global {
  interface Window {
    Razorpay: any
  }
}

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
  const [userEmail, setUserEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [address, setAddress] = useState<Address>({
    name: '', line1: '', city: '', state: '', pincode: '', phone: '',
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { navigate('/auth'); return }
      setUserId(data.user.id)
      setUserEmail(data.user.email ?? '')
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

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault()
    if (!items.length) return
    setPaying(true)

    try {
      // Step 1 — Create order in Supabase with status "pending"
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
        alert('Failed to create order. Please try again.')
        setPaying(false)
        return
      }

      // Step 2 — Insert order items (price snapshot)
      await supabase.from('order_items').insert(
        items.map(i => ({
          order_id: order.id,
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.product.price,
        }))
      )

      // Step 3 — Call Edge Function to get Razorpay order ID
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'create-razorpay-order',
        {
          body: {
            amount: total,
            currency: 'INR',
            receipt: `order_${order.id.slice(0, 8)}`,
          },
        }
      )

      if (fnError || !fnData?.razorpay_order_id) {
        alert('Payment initiation failed. Please try again.')
        // Clean up the pending order
        await supabase.from('order_items').delete().eq('order_id', order.id)
        await supabase.from('orders').delete().eq('id', order.id)
        setPaying(false)
        return
      }

      // Step 4 — Open Razorpay payment modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: fnData.amount,            // in paise
        currency: fnData.currency,
        name: 'SpeedyCart',
        description: `Order #${order.id.slice(0, 8).toUpperCase()}`,
        order_id: fnData.razorpay_order_id,
        prefill: {
          name: address.name,
          email: userEmail,
          contact: address.phone,
        },
        theme: { color: '#f97316' },

        // Step 5 — On payment success, verify server-side
        handler: async (response: {
          razorpay_payment_id: string
          razorpay_order_id: string
          razorpay_signature: string
        }) => {
          const { data: verifyData, error: verifyError } =
            await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id: order.id,
                user_id: userId,
              },
            })

          if (verifyError || !verifyData?.success) {
            alert(
              'Payment verification failed. Contact support with payment ID: ' +
              response.razorpay_payment_id
            )
            setPaying(false)
            return
          }

          // Verified — Edge Function already cleared the cart
          fetchCartCount()
          navigate('/orders', { state: { newOrderId: order.id } })
        },

        // User dismissed modal without paying — clean up
        modal: {
          ondismiss: async () => {
            await supabase.from('order_items').delete().eq('order_id', order.id)
            await supabase.from('orders').delete().eq('id', order.id)
            setPaying(false)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()

    } catch (err) {
      console.error(err)
      alert('Something went wrong. Please try again.')
      setPaying(false)
    }
  }

  if (loading) return <div className="page">Loading checkout...</div>

  if (!items.length) return (
    <div className="page">
      <div className="empty-state">
        <p>Your cart is empty.</p>
        <button className="nav-btn" onClick={() => navigate('/')} style={{ marginTop: 16 }}>
          Browse products
        </button>
      </div>
    </div>
  )

  return (
    <div className="page">
      <h1 className="cart-title">Checkout</h1>
      <form onSubmit={handlePayment} className="checkout-layout">

        {/* Shipping address — same as your original */}
        <div className="checkout-section">
          <h2 className="checkout-section-title">Shipping address</h2>
          <div className="checkout-form">
            {[
              { field: 'name',    label: 'Full name', type: 'text', ph: 'Rahul Sharma'       },
              { field: 'phone',   label: 'Phone',     type: 'tel',  ph: '9876543210'          },
              { field: 'line1',   label: 'Address',   type: 'text', ph: '123, MG Road, Apt 4B'},
              { field: 'city',    label: 'City',      type: 'text', ph: 'Hyderabad'           },
              { field: 'state',   label: 'State',     type: 'text', ph: 'Telangana'           },
              { field: 'pincode', label: 'PIN code',  type: 'text', ph: '500001'              },
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

        {/* Order summary sidebar — same layout as your original */}
        <div className="checkout-sidebar">
          <div className="cart-summary">
            <h2>Order summary</h2>
            <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map(i => (
                <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--muted)' }}>
                    {i.product.name} × {i.quantity}
                  </span>
                  <span style={{ fontWeight: 600 }}>
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
              disabled={paying}
            >
              {paying ? 'Opening payment...' : `Pay ₹${total.toLocaleString('en-IN')}`}
            </button>
            <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 10 }}>
              Secured by Razorpay
            </p>
          </div>
        </div>

      </form>
    </div>
  )
}