'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Props {
  entryId: string
  status: string
  reviewerId: string
}

export default function TimesheetActions({ entryId, status, reviewerId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [clockIn, setClockIn] = useState('')
  const [clockOut, setClockOut] = useState('')
  const [adminNotes, setAdminNotes] = useState('')

  async function updateStatus(newStatus: 'approved' | 'rejected') {
    setLoading(newStatus)
    const supabase = createClient()
    await supabase
      .from('time_entries')
      .update({ status: newStatus, reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
      .eq('id', entryId)
    setLoading(null)
    router.refresh()
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    setLoading('edit')
    const supabase = createClient()
    await supabase
      .from('time_entries')
      .update({
        clocked_in_at: clockIn || undefined,
        clocked_out_at: clockOut || undefined,
        admin_notes: adminNotes || undefined,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', entryId)
    setLoading(null)
    setEditing(false)
    router.refresh()
  }

  if (editing) {
    return (
      <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 240 }}>
        <input type="datetime-local" value={clockIn} onChange={e => setClockIn(e.target.value)} placeholder="Clock in" />
        <input type="datetime-local" value={clockOut} onChange={e => setClockOut(e.target.value)} placeholder="Clock out" />
        <input type="text" value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Admin notes" />
        <div className="row">
          <button className="btn btn-primary btn-sm" type="submit" disabled={loading === 'edit'}>Save</button>
          <button className="btn btn-secondary btn-sm" type="button" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </form>
    )
  }

  return (
    <div className="row" style={{ gap: 6 }}>
      {status === 'pending' && (
        <>
          <button className="btn btn-primary btn-sm" onClick={() => updateStatus('approved')} disabled={!!loading}>
            {loading === 'approved' ? '…' : 'Approve'}
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => updateStatus('rejected')} disabled={!!loading}>
            {loading === 'rejected' ? '…' : 'Reject'}
          </button>
        </>
      )}
      <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>Edit</button>
    </div>
  )
}
