'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Employee { id: string; full_name: string }

export default function AddShiftForm({ employees, createdBy }: { employees: Employee[]; createdBy: string }) {
  const router = useRouter()
  const [form, setForm] = useState({ employee_id: '', date: '', start_time: '', end_time: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase
      .from('shifts')
      .insert({ ...form, created_by: createdBy })

    if (error) { setError(error.message); setLoading(false); return }
    setForm({ employee_id: '', date: '', start_time: '', end_time: '', notes: '' })
    setSuccess(true)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="card">
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">Shift added.</div>}

      <form onSubmit={handleSubmit} className="stack">
        <div className="form-group">
          <label>Employee</label>
          <select value={form.employee_id} onChange={e => set('employee_id', e.target.value)} required>
            <option value="">Select employee…</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.full_name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Date</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label>Start</label>
            <input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>End</label>
            <input type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} required />
          </div>
        </div>

        <div className="form-group">
          <label>Notes</label>
          <input type="text" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional" />
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Adding…' : 'Add shift'}
        </button>
      </form>
    </div>
  )
}
