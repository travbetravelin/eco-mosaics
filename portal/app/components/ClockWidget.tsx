'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface OpenEntry {
  id: string
  clocked_in_at: string
}

interface ClockWidgetProps {
  openEntry: OpenEntry | null
  userId: string
}

export default function ClockWidget({ openEntry: initial, userId }: ClockWidgetProps) {
  const [openEntry, setOpenEntry] = useState<OpenEntry | null>(initial)
  const [now, setNow] = useState(new Date())
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  function elapsed() {
    if (!openEntry) return ''
    const ms = now.getTime() - new Date(openEntry.clocked_in_at).getTime()
    const h = Math.floor(ms / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    return `${h}h ${m}m ${s}s`
  }

  async function clockIn() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error } = await supabase
      .from('time_entries')
      .insert({ employee_id: userId, clocked_in_at: new Date().toISOString(), notes })
      .select('id, clocked_in_at')
      .single()

    if (error) { setError(error.message); setLoading(false); return }
    setOpenEntry(data)
    setNotes('')
    setLoading(false)
  }

  async function clockOut() {
    if (!openEntry) return
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase
      .from('time_entries')
      .update({ clocked_out_at: new Date().toISOString() })
      .eq('id', openEntry.id)

    if (error) { setError(error.message); setLoading(false); return }
    setOpenEntry(null)
    setLoading(false)
  }

  return (
    <div className="clock-widget">
      {error && <div className="alert alert-error" style={{ textAlign: 'left' }}>{error}</div>}

      {openEntry ? (
        <>
          <div className="clock-status">Clocked in</div>
          <div className="clock-time">{elapsed()}</div>
          <div style={{ color: '#6b7280', fontSize: '1rem', marginBottom: 16 }}>
            Since {new Date(openEntry.clocked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button className="btn btn-danger" onClick={clockOut} disabled={loading}>
            {loading ? 'Clocking out…' : 'Clock out'}
          </button>
        </>
      ) : (
        <>
          <div className="clock-status" style={{ marginBottom: 16 }}>Not clocked in</div>
          <div className="form-group" style={{ textAlign: 'left', marginBottom: 12 }}>
            <label>Notes (optional)</label>
            <input
              type="text"
              placeholder="e.g. Site A — invasive removal"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={clockIn} disabled={loading}>
            {loading ? 'Clocking in…' : 'Clock in'}
          </button>
        </>
      )}
    </div>
  )
}
