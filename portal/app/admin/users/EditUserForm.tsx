'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Props {
  userId: string
  fullName: string
  appRole: string
  jobRole: string
  paychexId: string
  jobRoleOptions: string[]
}

export default function EditUserForm({ userId, fullName, appRole, jobRole, paychexId, jobRoleOptions }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ fullName, appRole, jobRole, paychexId })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({
      full_name: form.fullName,
      role: form.appRole,
      job_role: form.jobRole || null,
      paychex_employee_id: form.paychexId || null,
    }).eq('id', userId)

    if (error) { setError(error.message); setLoading(false); return }
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button className="btn btn-secondary btn-sm" onClick={() => setOpen(true)}>
        Edit
      </button>
    )
  }

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 260 }}>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Name</label>
        <input type="text" value={form.fullName} onChange={e => set('fullName', e.target.value)} required />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Job role</label>
        <select value={form.jobRole} onChange={e => set('jobRole', e.target.value)}>
          <option value="">— Unassigned —</option>
          {jobRoleOptions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>App role</label>
        <select value={form.appRole} onChange={e => set('appRole', e.target.value)}>
          <option value="crew">Crew</option>
          <option value="crew_lead">Crew Lead</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Paychex ID</label>
        <input type="text" value={form.paychexId} onChange={e => set('paychexId', e.target.value)} placeholder="Optional" />
      </div>

      <div className="row" style={{ gap: 8 }}>
        <button className="btn btn-primary btn-sm" type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Save'}
        </button>
        <button className="btn btn-secondary btn-sm" type="button" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  )
}
