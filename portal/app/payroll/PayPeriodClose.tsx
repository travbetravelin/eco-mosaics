'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPeriodLabel } from '@/lib/payPeriod'

interface Props {
  startDate: string
  endDate: string
  isClosed: boolean
}

export default function PayPeriodClose({ startDate, endDate, isClosed }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isFuture = startDate > new Date().toISOString().split('T')[0]

  if (isClosed) {
    return <span className="badge badge-rejected">Closed</span>
  }

  async function handleClose() {
    const label = formatPeriodLabel(startDate, endDate)
    if (!confirm(`Close pay period ${label}?\n\nEmployees will no longer be able to edit their entries for this period.`)) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/close-pay-period', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_date: startDate, end_date: endDate }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to close period')
      setLoading(false)
      return
    }
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {error && <span style={{ color: '#dc2626' }}>{error}</span>}
      <button
        className="btn btn-danger btn-sm"
        onClick={handleClose}
        disabled={loading || isFuture}
        title={isFuture ? 'Cannot close a future pay period' : undefined}
      >
        {loading ? 'Closing…' : 'Close Period'}
      </button>
    </div>
  )
}
