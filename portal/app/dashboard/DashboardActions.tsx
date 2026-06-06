'use client'

import { useState } from 'react'
import LogHoursForm from './LogHoursForm'

interface Employee { id: string; full_name: string }

interface Props {
  employees: Employee[]
  currentUserId: string
  role: string
}

export default function DashboardActions({ employees, currentUserId, role }: Props) {
  const [showSickForm, setShowSickForm] = useState(false)

  return (
    <div className="stack">
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          className={`btn ${showSickForm ? 'btn-secondary' : 'btn-secondary'}`}
          style={{ flex: '1 1 180px' }}
          onClick={() => setShowSickForm(s => !s)}
        >
          {showSickForm ? 'Cancel' : 'Log Sick / Wellness Time'}
        </button>
        <a href="/drive-time" className="btn btn-secondary" style={{ flex: '1 1 180px', textAlign: 'center' }}>
          Log Mobe / Extra Time
        </a>
      </div>

      {showSickForm && (
        <LogHoursForm
          employees={employees}
          currentUserId={currentUserId}
          role={role}
          onSuccess={() => setShowSickForm(false)}
        />
      )}
    </div>
  )
}
