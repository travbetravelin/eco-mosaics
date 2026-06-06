'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { JOB_ROLE_ORDER } from '@/lib/payroll'

export default function NewUserForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    fullName: '', email: '', password: '',
    appRole: 'crew', jobRole: '', paychexId: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (!res.ok) { setError(data.error); setLoading(false); return }

    setForm({ fullName: '', email: '', password: '', appRole: 'crew', jobRole: '', paychexId: '' })
    setSuccess(true)
    setLoading(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + Add employee
      </button>
    )
  }

  return (
    <div className="card">
      <h2>New employee</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">Employee created successfully.</div>}

      <form onSubmit={handleSubmit} className="stack">
        <div className="form-group">
          <label>Full name</label>
          <input type="text" value={form.fullName} onChange={e => set('fullName', e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Temporary password</label>
          <input
            type="text"
            value={form.password}
            onChange={e => set('password', e.target.value)}
            placeholder="Share this with the employee"
            minLength={8}
            required
          />
        </div>

        <div className="form-group">
          <label>Job role</label>
          <select value={form.jobRole} onChange={e => set('jobRole', e.target.value)}>
            <option value="">— Unassigned —</option>
            {JOB_ROLE_ORDER.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>App role</label>
          <select value={form.appRole} onChange={e => set('appRole', e.target.value)}>
            <option value="crew">Crew</option>
            <option value="crew_lead">Crew Lead</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="form-group">
          <label>Paychex ID</label>
          <input type="text" value={form.paychexId} onChange={e => set('paychexId', e.target.value)} placeholder="Optional" />
        </div>

        <div className="row">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create employee'}
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => { setOpen(false); setError(''); setSuccess(false) }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
