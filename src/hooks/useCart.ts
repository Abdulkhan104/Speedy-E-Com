// src/hooks/useCart.ts
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useCart() {
  const [cartCount, setCartCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
    })
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_, session) => setUserId(session?.user?.id ?? null)
    )
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (userId) {
      fetchCartCount()
    } else {
      // guest: count from localStorage
      const local = JSON.parse(localStorage.getItem('sc_cart') || '[]')
      setCartCount(local.reduce((sum: number, i: any) => sum + i.qty, 0))
    }
  }, [userId])

  async function fetchCartCount() {
    const { count } = await supabase
      .from('cart_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId!)
    setCartCount(count ?? 0)
  }

  async function addToCart(productId: string, quantity: number) {
    if (!userId) {
      // guest: save to localStorage
      const cart = JSON.parse(localStorage.getItem('sc_cart') || '[]')
      const existing = cart.find((i: any) => i.productId === productId)
      if (existing) {
        existing.qty += quantity
      } else {
        cart.push({ productId, qty: quantity })
      }
      localStorage.setItem('sc_cart', JSON.stringify(cart))
      setCartCount(cart.reduce((s: number, i: any) => s + i.qty, 0))
      return
    }

    // logged in: upsert to DB
    await supabase.from('cart_items').upsert(
      { user_id: userId, product_id: productId, quantity },
      { onConflict: 'user_id,product_id', ignoreDuplicates: false }
    )
    fetchCartCount()
  }

  async function removeFromCart(cartItemId: string) {
    await supabase.from('cart_items').delete().eq('id', cartItemId)
    fetchCartCount()
  }

  return { cartCount, addToCart, removeFromCart, fetchCartCount }
}