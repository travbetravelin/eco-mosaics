'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  userId: string
  active: boolean
  name: string
}

export default function ToggleActiveButton({ userId, active, name }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    const label = active ? 'deactivate' : 'reactivate'
    if (!confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} ${name}?`)) return

    setLoading(true)
    const res = await fetch('/api/toggle-user-active', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, active: !active }),
    })

    if (!res.ok) {
      const data = await res.json()
      alert(`Error: ${data.error}`)
    }

    setLoading(false)
    router.refresh()
  }

  return (
    <button
      className={`btn btn-sm ${active ? 'btn-danger' : 'btn-primary'}`}
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? '…' : active ? 'Deactivate' : 'Reactivate'}
    </button>
  )
}
