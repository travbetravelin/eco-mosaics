'use client'

import { useRouter } from 'next/navigation'
import { getCurrentPeriodStart } from '@/lib/payPeriod'

export default function PayPeriodPicker({ value }: { value: string }) {
  const router = useRouter()
  const currentPeriod = getCurrentPeriodStart()
  const isCurrentPeriod = value === currentPeriod

  return (
    <div className="row">
      {!isCurrentPeriod && (
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => router.push('/payroll')}
        >
          Current Period
        </button>
      )}
      <label style={{ fontWeight: 500 }}>Jump to date:</label>
      <input
        type="date"
        defaultValue={value}
        onChange={e => {
          if (e.target.value) router.push(`/payroll?start=${e.target.value}`)
        }}
        style={{ width: 160 }}
      />
    </div>
  )
}
