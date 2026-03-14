// src/pages/ProductDetail.tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Product } from '../lib/types'
import { useCart } from '../hooks/useCart'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!id) return
    supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) navigate('/')
        else setProduct(data)
        setLoading(false)
      })
  }, [id])

  async function handleAddToCart() {
    if (!product) return
    setAdding(true)
    await addToCart(product.id, qty)
    setAdding(false)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) return <div className="page"><p>Loading...</p></div>
  if (!product) return null

  const outOfStock = product.stock === 0

  return (
    <div className="page">
      {/* Back */}
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="detail-layout">
        {/* Image */}
        <div className="detail-img-wrap">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="detail-img" />
          ) : (
            <div className="detail-img-placeholder">
              {product.name[0]}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="detail-info">
          {product.category && (
            <span className="product-category">{product.category}</span>
          )}
          <h1 className="detail-title">{product.name}</h1>
          <p className="detail-price">
            ₹{product.price.toLocaleString('en-IN')}
          </p>

          {product.description && (
            <p className="detail-desc">{product.description}</p>
          )}

          {/* Stock status */}
          <div className="detail-stock">
            {outOfStock ? (
              <span className="stock-pill out">Out of stock</span>
            ) : product.stock <= 5 ? (
              <span className="stock-pill low">Only {product.stock} left</span>
            ) : (
              <span className="stock-pill ok">In stock</span>
            )}
          </div>

          {/* Qty picker */}
          {!outOfStock && (
            <div className="detail-qty">
              <label>Quantity</label>
              <div className="qty-ctrl">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span>{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))}>+</button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="detail-actions">
            <button
              className={`detail-add-btn ${added ? 'added' : ''}`}
              onClick={handleAddToCart}
              disabled={outOfStock || adding}
            >
              {adding ? 'Adding...' : added ? '✓ Added to cart' : 'Add to cart'}
            </button>
            <button
              className="detail-buy-btn"
              onClick={async () => {
                await handleAddToCart()
                navigate('/cart')
              }}
              disabled={outOfStock}
            >
              Buy now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}