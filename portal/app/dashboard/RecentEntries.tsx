'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { isDateLocked } from '@/lib/payPeriod'

interface Entry {
  id: string
  date: string
  hours: number
  entry_type: string
  job_code: string | null
  status: string
  notes: string | null
  logged_by: string
  project_id: string | null
  mileage: number | null
  project_name: string | null
}

interface Project { id: string; name: string }

interface Props {
  entries: Entry[]
  currentUserId: string
  closedPeriodStarts: string[]
  projects: Project[]
}

const SICK_WELLNESS = ['sick', 'wellness'] as const

export default function RecentEntries({ entries, currentUserId, closedPeriodStarts, projects }: Props) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Edit field state
  const [editDate, setEditDate] = useState('')
  const [editType, setEditType] = useState('')
  const [editHours, setEditHours] = useState('')
  const [editMileage, setEditMileage] = useState('')
  const [editNotes, setEditNotes] = useState('')

  function canEditEntry(e: Entry): boolean {
    return e.logged_by === currentUserId && !isDateLocked(e.date, closedPeriodStarts)
  }

  function startEdit(e: Entry) {
    setEditingId(e.id)
    setEditDate(e.date)
    setEditType(e.entry_type)
    setEditHours(String(e.hours))
    setEditMileage(e.mileage != null ? String(e.mileage) : '')
    setEditNotes(e.notes ?? '')
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setError('')
  }

  async function saveEdit(entry: Entry) {
    const parsedHours = parseFloat(editHours)
    if (isNaN(parsedHours) || parsedHours <= 0) {
      setError('Hours must be a positive number.')
      return
    }
    setSaving(true)
    setError('')
    const supabase = createClient()
    const updates: Record<string, unknown> = {
      date: editDate,
      hours: parsedHours,
      notes: editNotes || null,
      status: 'pending',
    }
    if (SICK_WELLNESS.includes(editType as typeof SICK_WELLNESS[number])) {
      updates.entry_type = editType
    }
    if (entry.job_code === 'Mobe' && editMileage) {
      updates.mileage = parseFloat(editMileage) || null
    }
    const { error: err } = await supabase
      .from('time_entries')
      .update(updates)
      .eq('id', entry.id)
      .eq('logged_by', currentUserId)

    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }
    setSaving(false)
    setEditingId(null)
    router.refresh()
  }

  if (!entries.length) {
    return (
      <tr>
        <td colSpan={6} style={{ color: '#6b7280', textAlign: 'center', padding: 20 }}>
          No entries yet.
        </td>
      </tr>
    )
  }

  return (
    <>
      {entries.map(e => {
        const isEditing = editingId === e.id
        const editable = canEditEntry(e)
        const isMobe = e.job_code === 'Mobe'
        const isSickWellness = e.entry_type === 'sick' || e.entry_type === 'wellness'

        return (
          <>
            <tr key={e.id}>
              <td style={{ whiteSpace: 'nowrap' }}>{e.date}</td>
              <td style={{ textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{e.entry_type}</td>
              <td style={{ color: '#6b7280' }}>{e.job_code ?? e.project_name ?? '—'}</td>
              <td>{e.hours}</td>
              <td><span className={`badge badge-${e.status}`}>{e.status}</span></td>
              <td>
                {editable && !isEditing && (
                  <button className="btn btn-secondary btn-sm" onClick={() => startEdit(e)}>
                    Edit
                  </button>
                )}
                {isEditing && (
                  <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>
                    Cancel
                  </button>
                )}
              </td>
            </tr>

            {isEditing && (
              <tr key={`${e.id}-edit`} style={{ background: '#f8faf9' }}>
                <td colSpan={6} style={{ padding: '12px 16px' }}>
                  {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ marginBottom: 0, minWidth: 130 }}>
                      <label>Date</label>
                      <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
                    </div>

                    {isSickWellness && (
                      <div className="form-group" style={{ marginBottom: 0, minWidth: 130 }}>
                        <label>Type</label>
                        <select value={editType} onChange={e => setEditType(e.target.value)}>
                          <option value="sick">Sick</option>
                          <option value="wellness">Wellness</option>
                        </select>
                      </div>
                    )}

                    <div className="form-group" style={{ marginBottom: 0, minWidth: 90 }}>
                      <label>Hours</label>
                      <input type="number" step="0.25" min="0.25" max="24"
                        value={editHours} onChange={e => setEditHours(e.target.value)} />
                    </div>

                    {isMobe && (
                      <div className="form-group" style={{ marginBottom: 0, minWidth: 100 }}>
                        <label>Mileage</label>
                        <input type="number" step="0.1" min="0"
                          value={editMileage} onChange={e => setEditMileage(e.target.value)} />
                      </div>
                    )}

                    <div className="form-group" style={{ marginBottom: 0, flex: '1 1 180px' }}>
                      <label>Notes</label>
                      <input type="text" value={editNotes} onChange={e => setEditNotes(e.target.value)}
                        placeholder="Optional" />
                    </div>

                    <button className="btn btn-primary btn-sm" onClick={() => saveEdit(e)} disabled={saving}
                      style={{ marginBottom: 1 }}>
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </>
        )
      })}
    </>
  )
}
