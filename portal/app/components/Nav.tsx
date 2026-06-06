'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface NavProps {
  role: string
  name: string
}

export default function Nav({ role, name }: NavProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isLead = role === 'crew_lead' || role === 'admin'
  const isAdmin = role === 'admin'

  const navLinks = (
    <>
      <a href="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</a>
      {isLead && <a href="/projects" onClick={() => setMenuOpen(false)}>Projects</a>}
      {isLead && <a href="/admin/timesheets" onClick={() => setMenuOpen(false)}>Timesheets</a>}
      {isLead && <a href="/ops" onClick={() => setMenuOpen(false)}>Ops</a>}
      {isAdmin && <a href="/payroll" onClick={() => setMenuOpen(false)}>Payroll</a>}
      {isAdmin && <a href="/admin/projects" onClick={() => setMenuOpen(false)}>Manage Projects</a>}
      {isAdmin && <a href="/admin/users" onClick={() => setMenuOpen(false)}>Manage Users</a>}
      <a href="/account" onClick={() => setMenuOpen(false)} style={{ color: 'rgba(255,255,255,0.85)' }}>{name}</a>
      <button onClick={handleSignOut} className="btn btn-secondary btn-sm">Sign out</button>
    </>
  )

  return (
    <>
      <header className="portal-header">
        <span className="brand">Eco Mosaics Portal</span>

        {/* Desktop nav */}
        <nav className="nav-desktop">{navLinks}</nav>

        {/* Hamburger button — mobile only */}
        <button
          className="nav-hamburger"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(o => !o)}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="nav-drawer">
          <nav className="nav-drawer-links">{navLinks}</nav>
        </div>
      )}
    </>
  )
}
