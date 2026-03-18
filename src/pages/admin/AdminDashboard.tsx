// src/pages/admin/AdminDashboard.tsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type RecentOrder = {
  id: string
  total: number
  status: string
  created_at: string
}

type Stats = {
  totalOrders: number
  totalRevenue: number
  activeProducts: number
  pendingOrders: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalRevenue: 0,
    activeProducts: 0,
    pendingOrders: 0,
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [ordersRes, productsRes, pendingRes, recentRes] = await Promise.all([
        supabase.from('orders').select('total'),
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('orders')
          .select('id, total, status, created_at')
          .order('created_at', { ascending: false })
          .limit(6),
      ])

      const revenue = (ordersRes.data ?? []).reduce(
        (sum, o) => sum + (o.total ?? 0), 0
      )

      setStats({
        totalOrders:    ordersRes.data?.length ?? 0,
        totalRevenue:   revenue,
        activeProducts: productsRes.count ?? 0,
        pendingOrders:  pendingRes.count ?? 0,
      })

      setRecentOrders((recentRes.data ?? []) as RecentOrder[])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return <p className="admin-loading">Loading dashboard...</p>
  }

  const statCards = [
    { label: 'Total orders',    value: stats.totalOrders,    color: 'blue'   },
    { label: 'Total revenue',   value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, color: 'green' },
    { label: 'Active products', value: stats.activeProducts, color: 'purple' },
    { label: 'Pending orders',  value: stats.pendingOrders,  color: 'amber'  },
  ]

  return (
    <div>
      <h1 className="admin-page-title">Dashboard</h1>

      <div className="admin-stat-grid">
        {statCards.map(s => (
          <div key={s.label} className={`admin-stat-card stat-${s.color}`}>
            <p className="stat-label">{s.label}</p>
            <p className="stat-value">{s.value}</p>
          </div>
        ))}
      </div>

      <h2 className="admin-section-title">Recent orders</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map(o => (
              <tr key={o.id}>
                <td className="mono">#{o.id.slice(0, 8).toUpperCase()}</td>
                <td>₹{o.total.toLocaleString('en-IN')}</td>
                <td>
                  <span className={`status-badge status-${o.status}`}>
                    {o.status}
                  </span>
                </td>
                <td>
                  {new Date(o.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}