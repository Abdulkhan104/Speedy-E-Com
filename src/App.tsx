// src/App.tsx — final version
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home          from './pages/Home'
import Auth          from './pages/Auth'
import Cart          from './pages/Cart'
import ProductDetail from './pages/ProductDetail'
import Checkout      from './pages/Checkout'
import Orders        from './pages/Orders'

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/auth"        element={<Auth />} />
          <Route path="/cart"        element={<Cart />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/checkout"    element={
            <ProtectedRoute><Checkout /></ProtectedRoute>
          } />
          <Route path="/orders"      element={
            <ProtectedRoute><Orders /></ProtectedRoute>
          } />
        </Routes>
      </main>
    </>
  )
}