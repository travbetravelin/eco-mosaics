'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Project { id: string; name: string }
interface Employee { id: string; full_name: string }

interface Props {
  projects: Project[]
  employees: Employee[]
  currentUserId: string
  role: string
}

export default function LogHoursForm({ projects, employees, currentUserId, role }: Props) {
  const router = useRouter()
  const canLogForOthers = role === 'crew_lead' || role === 'admin'

  const today = new Date().toISOString().split('T')[0]
  const [employeeId, setEmployeeId] = useState(currentUserId)
  const [date, setDate] = useState(today)
  const [entryType, setEntryType] = useState<'project' | 'sick' | 'wellness'>('project')
  const [projectId, setProjectId] = useState('')
  const [hours, setHours] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const supabase = createClient()
    const { error } = await supabase.from('time_entries').insert({
      employee_id: employeeId,
      date,
      hours: parseFloat(hours),
      entry_type: entryType,
      project_id: entryType === 'project' ? projectId : null,
      notes: notes || null,
      logged_by: currentUserId,
    })

    if (error) { setError(error.message); setLoading(false); return }
    setHours('')
    setNotes('')
    setSuccess(true)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="card">
      <h2>Log hours</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">Hours logged.</div>}

      <form onSubmit={handleSubmit} className="stack">
        {canLogForOthers && (
          <div className="form-group">
            <label>Employee</label>
            <select value={employeeId} onChange={e => setEmployeeId(e.target.value)} required>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Type</label>
          <select value={entryType} onChange={e => setEntryType(e.target.value as typeof entryType)}>
            <option value="project">Project</option>
            <option value="sick">Sick</option>
            <option value="wellness">Wellness</option>
          </select>
        </div>

        {entryType === 'project' && (
          <div className="form-group">
            <label>Project</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} required>
              <option value="">Select project…</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Hours</label>
          <input
            type="number"
            step="0.25"
            min="0.25"
            max="24"
            value={hours}
            onChange={e => setHours(e.target.value)}
            placeholder="e.g. 8"
            required
          />
        </div>

        <div className="form-group">
          <label>Notes</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Log hours'}
        </button>
      </form>
    </div>
  )
}
