// src/pages/Cart.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { CartItem, Product } from '../lib/types'
import { useCart } from '../hooks/useCart'

type CartItemWithProduct = CartItem & { product: Product }

interface GuestCartItem {
  productId: string
  qty: number
}

export default function Cart() {
  const navigate = useNavigate()
  const { fetchCartCount } = useCart()
  const [items, setItems] = useState<CartItemWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
    })
  }, [])

  useEffect(() => {
    if (userId !== undefined) loadCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function loadCart() {
    setLoading(true)

    if (userId) {
      // Logged in: fetch from DB, join product details
      const { data } = await supabase
        .from('cart_items')
        .select('*, product:products(*)')
        .eq('user_id', userId)
      setItems((data as CartItemWithProduct[]) || [])
    } else {
      // Guest: load from localStorage, fetch product details
      const local: GuestCartItem[] = JSON.parse(localStorage.getItem('sc_cart') || '[]')
      if (!local.length) { setItems([]); setLoading(false); return }
      const ids = local.map((item) => item.productId)
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .in('id', ids)
      const merged = local.map((item: GuestCartItem, idx: number) => ({
        id: `local-${idx}`,
        user_id: '',
        product_id: item.productId,
        quantity: item.qty,
        product: products?.find((p: Product) => p.id === item.productId),
      }))
      setItems(merged.filter((i) => !!i.product) as CartItemWithProduct[])
    }
    setLoading(false)
  }

  async function updateQty(item: CartItemWithProduct, delta: number) {
    const newQty = item.quantity + delta
    if (newQty < 1) return removeItem(item)

    if (userId) {
      await supabase
        .from('cart_items')
        .update({ quantity: newQty })
        .eq('id', item.id)
    } else {
      const cart: GuestCartItem[] = JSON.parse(localStorage.getItem('sc_cart') || '[]')
      const found = cart.find((i) => i.productId === item.product_id)
      if (found) found.qty = newQty
      localStorage.setItem('sc_cart', JSON.stringify(cart))
    }
    loadCart()
    fetchCartCount()
  }

  async function removeItem(item: CartItemWithProduct) {
    if (userId) {
      await supabase.from('cart_items').delete().eq('id', item.id)
    } else {
      const cart: GuestCartItem[] = JSON.parse(localStorage.getItem('sc_cart') || '[]')
      const updated = cart.filter((i) => i.productId !== item.product_id)
      localStorage.setItem('sc_cart', JSON.stringify(updated))
    }
    loadCart()
    fetchCartCount()
  }

  const total = items.reduce(
    (sum, i) => sum + i.quantity * i.product.price, 0
  )

  if (loading) return <div className="page"><p>Loading cart...</p></div>

  return (
    <div className="page">
      <h1 className="cart-title">Your cart</h1>

      {items.length === 0 ? (
        <div className="empty-state">
          <p>Your cart is empty.</p>
          <button className="nav-btn" onClick={() => navigate('/')}
            style={{marginTop: 16}}>
            Browse products
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Items */}
          <div className="cart-items">
            {items.map(item => (
              <div key={item.id} className="cart-row">
                {/* Image */}
                <div className="cart-img">
                  {item.product.image_url
                    ? <img src={item.product.image_url} alt={item.product.name} />
                    : <span>{item.product.name[0]}</span>}
                </div>

                {/* Details */}
                <div className="cart-details">
                  <p className="cart-name">{item.product.name}</p>
                  <p className="cart-unit-price">
                    ₹{item.product.price.toLocaleString('en-IN')} each
                  </p>
                </div>

                {/* Qty controls */}
                <div className="qty-ctrl">
                  <button onClick={() => updateQty(item, -1)}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQty(item, +1)}>+</button>
                </div>

                {/* Subtotal */}
                <p className="cart-subtotal">
                  ₹{(item.quantity * item.product.price).toLocaleString('en-IN')}
                </p>

                {/* Remove */}
                <button className="cart-remove" onClick={() => removeItem(item)}>
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="cart-summary">
            <h2>Order summary</h2>
            <div className="summary-row">
              <span>Subtotal ({items.length} items)</span>
              <span>₹{total.toLocaleString('en-IN')}</span>
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
              className="checkout-btn"
              onClick={() => userId ? navigate('/checkout') : navigate('/auth')}
            >
              {userId ? 'Proceed to checkout' : 'Login to checkout'}
            </button>
            {!userId && (
              <p className="cart-guest-note">
                Your cart is saved — login to complete your order.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}