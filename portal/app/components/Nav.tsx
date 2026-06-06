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

  const isLead = role === 'crew_lead' || role === 'admin'
  const isAdmin = role === 'admin'

  return (
    <header className="portal-header">
      <span className="brand">Eco Mosaics Portal</span>
      <nav>
        <a href="/dashboard">Dashboard</a>
        {isLead && <a href="/projects">Projects</a>}
        {isLead && <a href="/admin/timesheets">Timesheets</a>}
        {isAdmin && <a href="/payroll">Payroll</a>}
        {isAdmin && <a href="/admin/projects">Manage Projects</a>}
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem' }}>{name}</span>
        <button onClick={handleSignOut} className="btn btn-secondary btn-sm">
          Sign out
        </button>
      </nav>
    </header>
  )
}
