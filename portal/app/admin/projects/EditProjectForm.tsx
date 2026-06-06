'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Props {
  id: string
  name: string
  lat: number | null
  lng: number | null
}

export default function EditProjectForm({ id, name: initialName, lat: initialLat, lng: initialLng }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(initialName)
  const [lat, setLat] = useState(initialLat != null ? String(initialLat) : '')
  const [lng, setLng] = useState(initialLng != null ? String(initialLng) : '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase
      .from('projects')
      .update({
        name: name.trim(),
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
      })
      .eq('id', id)
    if (err) { setError(err.message); setLoading(false); return }
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
    <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 260 }}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Name</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
          <label>Latitude</label>
          <input type="number" step="any" value={lat} onChange={e => setLat(e.target.value)}
            placeholder="e.g. 44.0521" />
        </div>
        <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
          <label>Longitude</label>
          <input type="number" step="any" value={lng} onChange={e => setLng(e.target.value)}
            placeholder="e.g. -121.3153" />
        </div>
      </div>
      <div className="row">
        <button className="btn btn-primary btn-sm" type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  )
}
