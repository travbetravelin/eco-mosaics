'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Props {
  entryId: string
  status: string
  reviewerId: string
  currentHours: number
}

export default function TimesheetActions({ entryId, status, reviewerId, currentHours }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [hours, setHours] = useState(String(currentHours))
  const [adminNotes, setAdminNotes] = useState('')

  async function updateStatus(newStatus: 'approved' | 'rejected') {
    setLoading(newStatus)
    const supabase = createClient()
    await supabase.from('time_entries').update({
      status: newStatus,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    }).eq('id', entryId)
    setLoading(null)
    router.refresh()
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    setLoading('edit')
    const supabase = createClient()
    await supabase.from('time_entries').update({
      hours: parseFloat(hours),
      admin_notes: adminNotes || null,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    }).eq('id', entryId)
    setLoading(null)
    setEditing(false)
    router.refresh()
  }

  if (editing) {
    return (
      <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>
        <input type="number" step="0.25" value={hours} onChange={e => setHours(e.target.value)} />
        <input type="text" placeholder="Admin notes" value={adminNotes} onChange={e => setAdminNotes(e.target.value)} />
        <div className="row" style={{ gap: 6 }}>
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
