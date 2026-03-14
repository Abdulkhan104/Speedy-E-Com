// src/components/ProtectedRoute.tsx
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAuthed(!!data.user)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="page">Loading...</div>
  if (!authed) return <Navigate to="/auth" replace />
  return <>{children}</>
}