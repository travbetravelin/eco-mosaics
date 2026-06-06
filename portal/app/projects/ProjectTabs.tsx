'use client'

import { useState } from 'react'

interface Props {
  hoursTab: React.ReactNode
  mileageTab: React.ReactNode
  hasMileage: boolean
}

const TABS = [
  { key: 'hours',   label: 'Hours Grid' },
  { key: 'mileage', label: 'Mileage Detail' },
] as const

export default function ProjectTabs({ hoursTab, mileageTab, hasMileage }: Props) {
  const [tab, setTab] = useState<'hours' | 'mileage'>('hours')
  const visibleTabs = TABS.filter(t => t.key === 'hours' || hasMileage)

  return (
    <div>
      <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: 20 }}>
        {visibleTabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.key ? '2px solid #2d6a4f' : '2px solid transparent',
              marginBottom: -2,
              cursor: 'pointer',
              fontWeight: tab === t.key ? 600 : 400,
              fontSize: '1rem',
              color: tab === t.key ? '#2d6a4f' : '#6b7280',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ display: tab === 'hours' ? 'block' : 'none' }}>{hoursTab}</div>
      <div style={{ display: tab === 'mileage' ? 'block' : 'none' }}>{mileageTab}</div>
    </div>
  )
}
