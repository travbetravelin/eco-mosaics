'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface CreateProps { mode: 'create'; id?: never; active?: never }
interface RowProps { mode?: never; id: string; active: boolean }
type Props = CreateProps | RowProps

export default function ProjectActions(props: Props) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.from('projects').insert({
      name: name.trim(),
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
    })
    if (error) { setError(error.message); setLoading(false); return }
    setName('')
    setLat('')
    setLng('')
    setSuccess(true)
    setLoading(false)
    router.refresh()
  }

  async function toggleActive() {
    if (!props.id) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('projects').update({ active: !props.active }).eq('id', props.id)
    setLoading(false)
    router.refresh()
  }

  if (props.mode === 'create') {
    return (
      <div className="card">
        <h2>New project</h2>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">Project created.</div>}
        <form onSubmit={create} className="stack">
          <div className="form-group">
            <label>Project name</label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setSuccess(false) }}
              placeholder="e.g. Crane Valley Restoration"
              required
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <label>Latitude <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
              <input type="number" step="any" value={lat}
                onChange={e => setLat(e.target.value)} placeholder="e.g. 44.0521" />
            </div>
            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <label>Longitude <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
              <input type="number" step="any" value={lng}
                onChange={e => setLng(e.target.value)} placeholder="e.g. -121.3153" />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create project'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <button
      className={`btn btn-sm ${props.active ? 'btn-secondary' : 'btn-primary'}`}
      onClick={toggleActive}
      disabled={loading}
    >
      {props.active ? 'Archive' : 'Restore'}
    </button>
  )
}
