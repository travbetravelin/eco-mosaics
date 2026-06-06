'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface NavProps {
  role: string
  name: string
}

export default function Nav({ role, name }: NavProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="portal-header">
      <span className="brand">Eco Mosaics Portal</span>
      <nav>
        <a href="/dashboard">Dashboard</a>
        {(role === 'manager' || role === 'admin') && (
          <>
            <a href="/admin/timesheets">Timesheets</a>
            <a href="/admin/schedule">Schedule</a>
          </>
        )}
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem' }}>{name}</span>
        <button
          onClick={handleSignOut}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '1rem' }}
        >
          Sign out
        </button>
      </nav>
    </header>
  )
}
