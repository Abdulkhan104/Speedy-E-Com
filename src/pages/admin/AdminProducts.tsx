// src/pages/admin/AdminProducts.tsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Product } from '../../lib/types' // <-- FIX: type-only import

type ProductForm = {
  name: string
  description: string
  price: number
  stock: number
  image_url: string
  category: string
  is_active: boolean
}

const EMPTY_FORM: ProductForm = {
  name: '',
  description: '',
  price: 0,
  stock: 0,
  image_url: '',
  category: '',
  is_active: true,
}

const FIELDS: { key: keyof ProductForm; label: string; type: string }[] = [
  { key: 'name',        label: 'Name',       type: 'text'   },
  { key: 'description', label: 'Description',type: 'text'   },
  { key: 'price',       label: 'Price (₹)',  type: 'number' },
  { key: 'stock',       label: 'Stock',      type: 'number' },
  { key: 'category',    label: 'Category',   type: 'text'   },
  { key: 'image_url',   label: 'Image URL',  type: 'text'   },
]

export default function AdminProducts() {
  const [products, setProducts]   = useState<Product[]>([])
  const [loading, setLoading]     = useState(true)
  const [form, setForm]           = useState<ProductForm>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving]       = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    setProducts(data ?? [])
    setLoading(false)
  }

  function openNew() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowModal(true)
  }

  function openEdit(p: Product) {
    setForm({
      name:        p.name,
      description: p.description ?? '',
      price:       p.price,
      stock:       p.stock,
      image_url:   p.image_url ?? '',
      category:    p.category ?? '',
      is_active:   p.is_active,
    })
    setEditingId(p.id)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingId(null)
  }

  function updateField(key: keyof ProductForm, value: string | number | boolean) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function save() {
    if (!form.name.trim()) return alert('Name is required')
    setSaving(true)

    if (editingId) {
      await supabase.from('products').update(form).eq('id', editingId)
    } else {
      await supabase.from('products').insert(form)
    }

    setSaving(false)
    closeModal()
    load()
  }

  async function toggleActive(p: Product) {
    await supabase
      .from('products')
      .update({ is_active: !p.is_active })
      .eq('id', p.id)
    load()
  }

  async function deleteProduct(id: string) {
    if (!window.confirm('Delete this product? This cannot be undone.')) return
    await supabase.from('products').delete().eq('id', id)
    load()
  }

  if (loading) return <p className="admin-loading">Loading products...</p>

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Products</h1>
        <button className="admin-primary-btn" onClick={openNew}>
          + Add product
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 500 }}>{p.name}</td>
                <td>{p.category ?? '—'}</td>
                <td>₹{p.price.toLocaleString('en-IN')}</td>
                <td>
                  <span className={p.stock <= 5 ? 'low-stock-text' : ''}>
                    {p.stock}
                  </span>
                </td>
                <td>
                  <button
                    className={`toggle-btn ${p.is_active ? 'active' : 'inactive'}`}
                    onClick={() => toggleActive(p)}
                  >
                    {p.is_active ? 'Active' : 'Hidden'}
                  </button>
                </td>
                <td>
                  <div className="action-btns">
                    <button className="edit-btn" onClick={() => openEdit(p)}>Edit</button>
                    <button className="delete-btn" onClick={() => deleteProduct(p.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#9ca3af', padding: 32 }}>
                  No products yet. Add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              {editingId ? 'Edit product' : 'Add product'}
            </h2>

            <div className="modal-form">
              {FIELDS.map(({ key, label, type }) => (
                <div key={key} className="form-group">
                  <label>{label}</label>
                  <input
                    type={type}
                    value={form[key] as string | number}
                    min={type === 'number' ? 0 : undefined}
                    onChange={e =>
                      updateField(
                        key,
                        type === 'number' ? Number(e.target.value) : e.target.value
                      )
                    }
                  />
                </div>
              ))}

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, gridColumn: 'span 2' }}>
                <input
                  id="is_active"
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => updateField('is_active', e.target.checked)}
                  style={{ width: 'auto', accentColor: '#f97316' }}
                />
                <label htmlFor="is_active" style={{ marginBottom: 0 }}>
                  Active (visible to customers)
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <button className="admin-secondary-btn" onClick={closeModal}>
                Cancel
              </button>
              <button
                className="admin-primary-btn"
                onClick={save}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}