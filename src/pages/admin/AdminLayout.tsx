// src/pages/admin/AdminLayout.tsx
import { NavLink, Outlet } from 'react-router-dom'

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <span>⚡</span> Admin
        </div>

        <nav className="admin-nav">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `admin-nav-link${isActive ? ' active' : ''}`
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/admin/products"
            className={({ isActive }) =>
              `admin-nav-link${isActive ? ' active' : ''}`
            }
          >
            Products
          </NavLink>

          <NavLink
            to="/admin/orders"
            className={({ isActive }) =>
              `admin-nav-link${isActive ? ' active' : ''}`
            }
          >
            Orders
          </NavLink>
        </nav>

        <NavLink to="/" className="admin-back-link">
          ← Back to store
        </NavLink>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}