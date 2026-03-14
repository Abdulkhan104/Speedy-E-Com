// src/components/Navbar.tsx
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../hooks/useCart'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const navigate = useNavigate()
  const { cartCount } = useCart()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_, session) => setUser(session?.user ?? null)
    )
    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="nav-inner">
        {/* Logo */}
        <button className="nav-logo" onClick={() => navigate('/')}>
          <span className="logo-bolt">⚡</span> SpeedyCart
        </button>

        {/* Right side */}
        <div className="nav-actions">
          {/* Cart */}
          <button className="nav-icon-btn" onClick={() => navigate('/cart')}>
            <span className="cart-icon">🛒</span>
            {cartCount > 0 && (
              <span className="cart-badge">{cartCount}</span>
            )}
          </button>

          {/* Auth */}
          {user ? (
            <div className="nav-user">
              <button className="nav-btn" onClick={() => navigate('/orders')}>
                Orders
              </button>
              <button className="nav-btn outline" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <button className="nav-btn" onClick={() => navigate('/auth')}>
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}