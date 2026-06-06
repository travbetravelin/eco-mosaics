'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const JOB_CODES = ['Mobe', 'Camp Set Up', 'Camp Tear Down', 'Shopping', 'Camp Maintenance'] as const
type JobCode = typeof JOB_CODES[number]

const CATEGORIES = [
  { value: 'to_hitch',   label: 'To Hitch — home to job site' },
  { value: 'from_hitch', label: 'From Hitch — job site to home' },
  { value: 'on_hitch',   label: 'On Hitch — grocery run, camp to site, etc.' },
] as const
type Category = typeof CATEGORIES[number]['value']

interface Project { id: string; name: string }

interface Props {
  projects: Project[]
  currentUserId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export default function DriveTimeForm({ projects, currentUserId, onSuccess, onCancel }: Props) {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]

  const [jobCode, setJobCode] = useState<JobCode>('Mobe')
  const [category, setCategory] = useState<Category>('to_hitch')
  const [date, setDate] = useState(today)
  const [hours, setHours] = useState('')
  const [mileage, setMileage] = useState('')
  const [startLocation, setStartLocation] = useState('')
  const [endLocation, setEndLocation] = useState('')
  const [projectId, setProjectId] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const isMobe = jobCode === 'Mobe'
  const isOtherProject = projectId === 'other'
  const needsStart = isMobe && (category === 'to_hitch' || category === 'on_hitch')
  const needsEnd   = isMobe && (category === 'from_hitch' || category === 'on_hitch')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isOtherProject && !notes.trim()) {
      setError('Notes are required when project is set to Other.')
      return
    }
    setLoading(true)
    setError('')
    setSuccess(false)

    const supabase = createClient()
    const { error } = await supabase.from('time_entries').insert({
      employee_id: currentUserId,
      date,
      hours: parseFloat(hours),
      entry_type: 'project',
      job_code: jobCode,
      project_id: isOtherProject ? null : (projectId || null),
      notes: notes || null,
      logged_by: currentUserId,
      ...(isMobe && {
        drive_category: category,
        mileage: mileage ? parseFloat(mileage) : null,
        start_location: startLocation || null,
        end_location: endLocation || null,
      }),
    })

    if (error) { setError(error.message); setLoading(false); return }

    setHours('')
    setMileage('')
    setStartLocation('')
    setEndLocation('')
    setProjectId('')
    setNotes('')
    setSuccess(true)
    setLoading(false)
    router.refresh()
    onSuccess?.()
  }

  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <h2>Log {jobCode}</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">Entry logged.</div>}

      <form onSubmit={handleSubmit} className="stack">

        {/* Job code — always first */}
        <div className="form-group">
          <label>Job code</label>
          <select value={jobCode} onChange={e => setJobCode(e.target.value as JobCode)} required>
            {JOB_CODES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Mobe-only: category */}
        {isMobe && (
          <div className="form-group">
            <label>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value as Category)} required>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Hours</label>
          <input
            type="number"
            step="0.25"
            min="0.25"
            max="24"
            value={hours}
            onChange={e => setHours(e.target.value)}
            placeholder="0.25 hr increments"
            required
          />
        </div>

        {/* Mobe-only: driving fields */}
        {isMobe && (
          <>
            <div className="form-group">
              <label>Mileage</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={mileage}
                onChange={e => setMileage(e.target.value)}
                placeholder="Miles"
                required
              />
            </div>

            {needsStart && (
              <div className="form-group">
                <label>Start location</label>
                <input
                  type="text"
                  value={startLocation}
                  onChange={e => setStartLocation(e.target.value)}
                  placeholder="e.g. Home, Bend OR"
                  required
                />
              </div>
            )}

            {needsEnd && (
              <div className="form-group">
                <label>End location</label>
                <input
                  type="text"
                  value={endLocation}
                  onChange={e => setEndLocation(e.target.value)}
                  placeholder="e.g. Tasman site, Sisters OR"
                  required
                />
              </div>
            )}
          </>
        )}

        {/* Project — optional for all */}
        <div className="form-group">
          <label>Project <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
          <select value={projectId} onChange={e => setProjectId(e.target.value)}>
            <option value="">— None —</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            Notes{isOtherProject && <span style={{ color: '#dc2626' }}> *</span>}
          </label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={isOtherProject ? 'Required — describe the project' : 'Optional'}
            required={isOtherProject}
          />
        </div>

        <div className="row">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Submit'}
          </button>
          {onCancel
            ? <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
            : <a href="/dashboard" className="btn btn-secondary">Cancel</a>
          }
        </div>
      </form>
    </div>
  )
}
