// src/App.tsx
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Auth from './pages/Auth'
import Cart from './pages/Cart'

// Placeholders — build these next
const ProductDetail = () => <div className="page">Product detail — coming next</div>
const Checkout      = () => <div className="page">Checkout — coming next</div>
const Orders        = () => <div className="page">Orders — coming next</div>

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