// src/components/ProductCard.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Product } from '../lib/types'
import { useCart } from '../hooks/useCart'

interface Props { product: Product }

export default function ProductCard({ product }: Props) {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  async function handleAdd(e: React.MouseEvent) {
    e.stopPropagation()
    setAdding(true)
    await addToCart(product.id, 1)
    setAdding(false)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  const outOfStock = product.stock === 0

  return (
    <div
      className="product-card"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      {/* Image */}
      <div className="product-img-wrap">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="product-img" />
        ) : (
          <div className="product-img-placeholder">
            <span>{product.name[0]}</span>
          </div>
        )}
        {outOfStock && <span className="badge out-of-stock">Out of stock</span>}
        {!outOfStock && product.stock <= 5 && (
          <span className="badge low-stock">Only {product.stock} left</span>
        )}
      </div>

      {/* Details */}
      <div className="product-info">
        {product.category && (
          <span className="product-category">{product.category}</span>
        )}
        <h3 className="product-name">{product.name}</h3>
        <p className="product-desc">{product.description}</p>
        <div className="product-footer">
          <span className="product-price">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          <button
            className={`add-btn ${added ? 'added' : ''}`}
            onClick={handleAdd}
            disabled={outOfStock || adding}
          >
            {adding ? '...' : added ? '✓ Added' : '+ Cart'}
          </button>
        </div>
      </div>
    </div>
  )
}