'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Props {
  id: string
  name: string
  lat: number | null
  lng: number | null
  active: boolean
}

export default function ProjectRow({ id, name: initialName, lat: initialLat, lng: initialLng, active }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [lat, setLat] = useState(initialLat != null ? String(initialLat) : '')
  const [lng, setLng] = useState(initialLng != null ? String(initialLng) : '')
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [error, setError] = useState('')

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
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
    if (err) { setError(err.message); setSaving(false); return }
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  async function toggleActive() {
    setToggling(true)
    const supabase = createClient()
    await supabase.from('projects').update({ active: !active }).eq('id', id)
    setToggling(false)
    router.refresh()
  }

  return (
    <>
      <tr>
        <td style={{ fontWeight: 500 }}>{initialName}</td>
        <td style={{ color: '#6b7280' }}>
          {initialLat != null && initialLng != null
            ? `${Number(initialLat).toFixed(4)}, ${Number(initialLng).toFixed(4)}`
            : <span style={{ color: '#d1d5db' }}>—</span>}
        </td>
        <td>
          <span className={`badge ${active ? 'badge-approved' : 'badge-rejected'}`}>
            {active ? 'Active' : 'Archived'}
          </span>
        </td>
        <td>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(e => !e)}>
              {editing ? 'Cancel' : 'Edit'}
            </button>
            <button
              className={`btn btn-sm ${active ? 'btn-secondary' : 'btn-primary'}`}
              onClick={toggleActive}
              disabled={toggling}
            >
              {active ? 'Archive' : 'Restore'}
            </button>
          </div>
        </td>
      </tr>

      {editing && (
        <tr style={{ background: '#f8faf9' }}>
          <td colSpan={4} style={{ padding: '12px 16px' }}>
            {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
            <form onSubmit={save}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ marginBottom: 0, flex: '2 1 200px' }}>
                  <label>Project name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0, flex: '1 1 140px' }}>
                  <label>Latitude</label>
                  <input type="number" step="any" value={lat}
                    onChange={e => setLat(e.target.value)} placeholder="e.g. 44.0521" />
                </div>
                <div className="form-group" style={{ marginBottom: 0, flex: '1 1 140px' }}>
                  <label>Longitude</label>
                  <input type="number" step="any" value={lng}
                    onChange={e => setLng(e.target.value)} placeholder="e.g. -121.3153" />
                </div>
                <button className="btn btn-primary btn-sm" type="submit" disabled={saving}
                  style={{ marginBottom: 1 }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </td>
        </tr>
      )}
    </>
  )
}
