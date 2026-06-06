'use client'

import { useState } from 'react'
import LogHoursForm from './LogHoursForm'
import DriveTimeForm from '@/app/drive-time/DriveTimeForm'

interface Employee { id: string; full_name: string }
interface Project { id: string; name: string }

interface Props {
  employees: Employee[]
  projects: Project[]
  currentUserId: string
  role: string
}

export default function DashboardActions({ employees, projects, currentUserId, role }: Props) {
  const [activeForm, setActiveForm] = useState<null | 'sick' | 'mobe'>(null)

  if (activeForm === null) {
    return (
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          className="btn btn-secondary"
          style={{ flex: '1 1 180px' }}
          onClick={() => setActiveForm('sick')}
        >
          Log Sick / Wellness Time
        </button>
        <button
          className="btn btn-secondary"
          style={{ flex: '1 1 180px' }}
          onClick={() => setActiveForm('mobe')}
        >
          Log Mobe / Extra Time
        </button>
      </div>
    )
  }

  if (activeForm === 'sick') {
    return (
      <LogHoursForm
        employees={employees}
        currentUserId={currentUserId}
        role={role}
        onSuccess={() => setActiveForm(null)}
        onCancel={() => setActiveForm(null)}
      />
    )
  }

  return (
    <DriveTimeForm
      projects={projects}
      currentUserId={currentUserId}
      onSuccess={() => setActiveForm(null)}
      onCancel={() => setActiveForm(null)}
    />
  )
}
