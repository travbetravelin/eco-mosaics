'use client'

import { useRouter } from 'next/navigation'

export default function PayPeriodPicker({ value }: { value: string }) {
  const router = useRouter()
  return (
    <div className="row">
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
