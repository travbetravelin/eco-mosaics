'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { groupEmployees, GROUP_COLORS, type Employee } from '@/lib/payroll'

export const JOB_CODE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Field':            { bg: '#dcfce7', text: '#14532d', border: '#86efac' },
  'Mobe':             { bg: '#dbeafe', text: '#1e3a8a', border: '#93c5fd' },
  'Camp Set Up':      { bg: '#fef9c3', text: '#713f12', border: '#fde047' },
  'Camp Tear Down':   { bg: '#ffedd5', text: '#7c2d12', border: '#fdba74' },
  'Shopping':         { bg: '#f3e8ff', text: '#581c87', border: '#d8b4fe' },
  'Camp Maintenance': { bg: '#e0f2fe', text: '#0c4a6e', border: '#7dd3fc' },
}

interface Entry { employee_id: string; date: string; hours: number; id: string; job_code: string | null }

interface Props {
  projectId: string
  dates: string[]
  employees: Employee[]
  entries: Entry[]
  canEdit: boolean
  currentUserId: string
}

export default function ProjectGrid({ projectId, dates, employees, entries: initial, canEdit, currentUserId }: Props) {
  const groups = groupEmployees(employees)
  const ordered = groups.flatMap(g => g.employees)

  const [cells, setCells] = useState<Record<string, { id: string | null; hours: number; job_code: string }>>(() => {
    const map: Record<string, { id: string | null; hours: number; job_code: string }> = {}
    for (const e of initial) {
      map[`${e.employee_id}|${e.date}`] = { id: e.id, hours: e.hours, job_code: e.job_code ?? 'Field' }
    }
    return map
  })
  const [isEditMode, setIsEditMode] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')
  const skipBlurRef = useRef(false)

  function exitEditMode() {
    setEditing(null)
    setIsEditMode(false)
  }

  // Flat list of all cell positions in tab order (left-to-right across each row)
  const allCellPositions = dates.flatMap(date => ordered.map(emp => ({ empId: emp.id, date })))

  function cellKey(empId: string, date: string) { return `${empId}|${date}` }

  function startEdit(empId: string, date: string) {
    if (!canEdit || !isEditMode) return
    const key = cellKey(empId, date)
    setEditing(key)
    setEditVal(String(cells[key]?.hours ?? ''))
  }

  async function saveCellValue(empId: string, date: string, val: string) {
    const key = cellKey(empId, date)
    const parsed = parseFloat(val)
    const existing = cells[key]
    if (isNaN(parsed) || parsed <= 0) {
      if (existing?.id) {
        const supabase = createClient()
        await supabase.from('time_entries').delete().eq('id', existing.id)
        setCells(prev => { const next = { ...prev }; delete next[key]; return next })
      }
      return
    }
    const supabase = createClient()
    if (existing?.id) {
      await supabase.from('time_entries').update({ hours: parsed }).eq('id', existing.id)
      setCells(prev => ({ ...prev, [key]: { ...prev[key], hours: parsed } }))
    } else {
      const { data } = await supabase.from('time_entries').insert({
        employee_id: empId, date, hours: parsed,
        entry_type: 'project', project_id: projectId, job_code: 'Field', logged_by: currentUserId,
      }).select('id').single()
      if (data) setCells(prev => ({ ...prev, [key]: { id: data.id, hours: parsed, job_code: 'Field' } }))
    }
  }

  async function save(empId: string, date: string) {
    setEditing(null)
    await saveCellValue(empId, date, editVal)
  }

  function handleKeyDown(e: React.KeyboardEvent, empId: string, date: string) {
    if (e.key === 'Enter') {
      save(empId, date)
      return
    }
    if (e.key === 'Escape') {
      setEditing(null)
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      const capturedVal = editVal
      const currentIdx = allCellPositions.findIndex(p => p.empId === empId && p.date === date)
      const nextIdx = e.shiftKey ? currentIdx - 1 : currentIdx + 1

      // Suppress the blur that fires when focus moves away
      skipBlurRef.current = true
      setTimeout(() => { skipBlurRef.current = false }, 0)

      if (nextIdx >= 0 && nextIdx < allCellPositions.length) {
        const next = allCellPositions[nextIdx]
        const nextKey = cellKey(next.empId, next.date)
        setEditing(nextKey)
        setEditVal(String(cells[nextKey]?.hours ?? ''))
      } else {
        setEditing(null)
      }

      saveCellValue(empId, date, capturedVal)
    }
  }

  const colTotal = (empId: string) =>
    dates.reduce((sum, d) => sum + (cells[cellKey(empId, d)]?.hours ?? 0), 0)
  const rowTotal = (date: string) =>
    ordered.reduce((sum, e) => sum + (cells[cellKey(e.id, date)]?.hours ?? 0), 0)
  const grandTotal = ordered.reduce((sum, e) => sum + colTotal(e.id), 0)

  const presentCodes = [...new Set(Object.values(cells).map(c => c.job_code))]
  const legendEntries = Object.entries(JOB_CODE_COLORS).filter(([code]) => presentCodes.includes(code))

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        {legendEntries.length > 0 && (
          <>
            <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 500 }}>Job codes:</span>
            {legendEntries.map(([code, colors]) => (
              <span key={code} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '3px 10px', borderRadius: 999,
                background: colors.bg, color: colors.text,
                border: `1px solid ${colors.border}`,
                fontSize: '1rem', fontWeight: 500,
              }}>
                {code}
              </span>
            ))}
          </>
        )}
        <div style={{ flex: 1 }} />
        {canEdit && !isEditMode && (
          <button className="btn btn-secondary btn-sm" onClick={() => setIsEditMode(true)}>
            Edit Hours
          </button>
        )}
        {canEdit && isEditMode && (
          <button className="btn btn-primary btn-sm" onClick={exitEditMode}>
            Done Editing
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)' }}>
        <table className="grid-table">
          <thead>
            <tr>
              <th className="sticky-col" rowSpan={2} style={{ minWidth: 120 }}>Date</th>
              {groups.map(g => {
                const c = GROUP_COLORS[g.role] ?? GROUP_COLORS['Unassigned']
                return (
                  <th key={g.role} colSpan={g.employees.length}
                    style={{ background: c.bg, color: c.text, textAlign: 'center', letterSpacing: '0.02em' }}>
                    {g.role}
                  </th>
                )
              })}
              <th rowSpan={2} style={{ minWidth: 64 }}>Total</th>
            </tr>
            <tr>
              {ordered.map(emp => (
                <th key={emp.id} style={{ fontWeight: 500, fontSize: '1rem', whiteSpace: 'nowrap', letterSpacing: '0.01em', opacity: 0.9 }}>
                  {emp.full_name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dates.map((date, rowIdx) => {
              const rt = rowTotal(date)
              const d = new Date(date + 'T00:00:00')
              const isToday = date === new Date().toISOString().split('T')[0]
              const isWeekend = d.getDay() === 0 || d.getDay() === 6
              return (
                <tr key={date} style={{ background: isToday ? '#f0fdf4' : isWeekend ? '#fafafa' : rowIdx % 2 === 0 ? 'white' : '#fcfcfc' }}>
                  <td className="sticky-col" style={{
                    fontWeight: isToday ? 700 : 500,
                    whiteSpace: 'nowrap',
                    color: isToday ? '#15803d' : isWeekend ? '#9ca3af' : '#374151',
                    background: isToday ? '#f0fdf4' : isWeekend ? '#fafafa' : rowIdx % 2 === 0 ? 'white' : '#fcfcfc',
                    fontSize: '1rem',
                    letterSpacing: '0.01em',
                  }}>
                    {isToday && <span style={{ marginRight: 5, fontSize: '1rem', background: '#15803d', color: 'white', borderRadius: 4, padding: '1px 5px', verticalAlign: 'middle' }}>Today</span>}
                    {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </td>
                  {ordered.map(emp => {
                    const key = cellKey(emp.id, date)
                    const cell = cells[key]
                    const isEditing = editing === key
                    const colors = cell ? (JOB_CODE_COLORS[cell.job_code] ?? JOB_CODE_COLORS['Field']) : null
                    return (
                      <td key={emp.id}
                        onClick={() => startEdit(emp.id, date)}
                        title={cell ? `${cell.job_code} · ${cell.hours}h` : (canEdit && isEditMode) ? 'Click to add' : ''}
                        style={{
                          cursor: (canEdit && isEditMode) ? 'pointer' : 'default',
                          minWidth: 56,
                          textAlign: 'center',
                          transition: 'background 0.1s',
                          background: colors ? colors.bg : 'transparent',
                          color: colors ? colors.text : undefined,
                          fontWeight: cell ? 600 : 400,
                          borderLeft: colors ? `3px solid ${colors.border}` : undefined,
                        }}>
                        {isEditing ? (
                          <input autoFocus type="number" step="0.25" value={editVal}
                            onChange={e => setEditVal(e.target.value)}
                            onBlur={() => { if (!skipBlurRef.current) save(emp.id, date) }}
                            onKeyDown={e => handleKeyDown(e, emp.id, date)}
                            style={{ width: 52, textAlign: 'center', fontSize: '1rem', padding: '2px 4px', borderRadius: 4 }} />
                        ) : cell ? (
                          String(cell.hours)
                        ) : (
                          <span style={{ color: '#e5e7eb', fontSize: '1rem' }}>·</span>
                        )}
                      </td>
                    )
                  })}
                  <td style={{
                    fontWeight: 700, textAlign: 'center',
                    color: rt > 0 ? '#1b4332' : '#d1d5db',
                    background: rt > 0 ? '#f0f7f4' : 'transparent',
                    fontSize: '1rem',
                  }}>
                    {rt > 0 ? rt : ''}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="sticky-col" style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '0.02em', color: '#1b4332', background: '#e8f4ef' }}>
                TOTAL
              </td>
              {ordered.map(e => (
                <td key={e.id} style={{
                  textAlign: 'center', fontWeight: 700, fontSize: '1rem',
                  background: '#e8f4ef', color: colTotal(e.id) > 0 ? '#1b4332' : '#d1d5db',
                }}>
                  {colTotal(e.id) > 0 ? colTotal(e.id) : ''}
                </td>
              ))}
              <td style={{ textAlign: 'center', fontWeight: 700, background: '#c8e8d8', color: '#1b4332', fontSize: '1rem' }}>
                {grandTotal > 0 ? grandTotal : ''}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
