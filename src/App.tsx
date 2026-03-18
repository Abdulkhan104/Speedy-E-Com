// src/App.tsx — corrected final version
import { Routes, Route, Outlet } from 'react-router-dom'
import Navbar         from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute     from './components/AdminRoute'
import Home           from './pages/Home'
import Auth           from './pages/Auth'
import Cart           from './pages/Cart'
import ProductDetail  from './pages/ProductDetail'
import Checkout       from './pages/Checkout'
import Orders         from './pages/Orders'
import AdminLayout    from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts  from './pages/admin/AdminProducts'
import AdminOrders    from './pages/admin/AdminOrders'

// Shared layout for all public pages (has Navbar)
function PublicLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
    </>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Public pages — all share the Navbar */}
      <Route element={<PublicLayout />}>
        <Route path="/"            element={<Home />} />
        <Route path="/auth"        element={<Auth />} />
        <Route path="/cart"        element={<Cart />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Admin pages — own sidebar layout, no Navbar */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index          element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders"   element={<AdminOrders />} />
      </Route>
    </Routes>
  )
}