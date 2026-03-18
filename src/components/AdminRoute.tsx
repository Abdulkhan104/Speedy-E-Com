// src/components/AdminRoute.tsx
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Props {
  children: React.ReactNode
}

export default function AdminRoute({ children }: Props) {
  const [status, setStatus] = useState<'loading' | 'admin' | 'denied'>('loading')

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setStatus('denied'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      setStatus(profile?.is_admin === true ? 'admin' : 'denied')
    }
    check()
  }, [])

  if (status === 'loading') {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
        Checking access...
      </div>
    )
  }

  if (status === 'denied') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}