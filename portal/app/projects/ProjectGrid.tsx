'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { groupEmployees, GROUP_COLORS, type Employee } from '@/lib/payroll'

interface Entry { employee_id: string; date: string; hours: number; id: string }

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

  const [cells, setCells] = useState<Record<string, { id: string | null; hours: number }>>(() => {
    const map: Record<string, { id: string | null; hours: number }> = {}
    for (const e of initial) map[`${e.employee_id}|${e.date}`] = { id: e.id, hours: e.hours }
    return map
  })
  const [editing, setEditing] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')

  function cellKey(empId: string, date: string) { return `${empId}|${date}` }

  function startEdit(empId: string, date: string) {
    if (!canEdit) return
    const key = cellKey(empId, date)
    setEditing(key)
    setEditVal(String(cells[key]?.hours ?? ''))
  }

  const save = useCallback(async (empId: string, date: string) => {
    const key = cellKey(empId, date)
    const parsed = parseFloat(editVal)
    setEditing(null)
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
        entry_type: 'project', project_id: projectId, logged_by: currentUserId,
      }).select('id').single()
      if (data) setCells(prev => ({ ...prev, [key]: { id: data.id, hours: parsed } }))
    }
  }, [editVal, cells, projectId, currentUserId])

  const colTotal = (empId: string) =>
    dates.reduce((sum, d) => sum + (cells[cellKey(empId, d)]?.hours ?? 0), 0)

  const rowTotal = (date: string) =>
    ordered.reduce((sum, e) => sum + (cells[cellKey(e.id, date)]?.hours ?? 0), 0)

  const grandTotal = ordered.reduce((sum, e) => sum + colTotal(e.id), 0)

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="grid-table">
        <thead>
          <tr>
            <th className="sticky-col" rowSpan={2}>Date</th>
            {groups.map(g => {
              const c = GROUP_COLORS[g.role] ?? GROUP_COLORS['Unassigned']
              return (
                <th key={g.role} colSpan={g.employees.length}
                  style={{ background: c.bg, color: c.text, textAlign: 'center' }}>
                  {g.role}
                </th>
              )
            })}
            <th rowSpan={2}>Total</th>
          </tr>
          <tr>
            {ordered.map(emp => (
              <th key={emp.id} style={{ fontWeight: 400, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                {emp.full_name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dates.map(date => {
            const rt = rowTotal(date)
            return (
              <tr key={date}>
                <td className="sticky-col" style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                </td>
                {ordered.map(emp => {
                  const key = cellKey(emp.id, date)
                  const val = cells[key]?.hours
                  const isEditing = editing === key
                  return (
                    <td key={emp.id}
                      onClick={() => startEdit(emp.id, date)}
                      style={{ cursor: canEdit ? 'pointer' : 'default', minWidth: 60, textAlign: 'center' }}
                      className={canEdit ? 'editable-cell' : ''}>
                      {isEditing ? (
                        <input autoFocus type="number" step="0.25" value={editVal}
                          onChange={e => setEditVal(e.target.value)}
                          onBlur={() => save(emp.id, date)}
                          onKeyDown={e => { if (e.key === 'Enter') save(emp.id, date) }}
                          style={{ width: 60, textAlign: 'center', fontSize: '1rem', padding: '2px 4px' }} />
                      ) : (
                        val ? String(val) : <span style={{ color: '#d1d5db' }}>—</span>
                      )}
                    </td>
                  )
                })}
                <td style={{ fontWeight: 600, textAlign: 'center', background: '#f9fafb' }}>
                  {rt > 0 ? rt : ''}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr style={{ background: '#f0f7f4', fontWeight: 600 }}>
            <td className="sticky-col">Total</td>
            {ordered.map(e => (
              <td key={e.id} style={{ textAlign: 'center' }}>
                {colTotal(e.id) > 0 ? colTotal(e.id) : ''}
              </td>
            ))}
            <td style={{ textAlign: 'center' }}>{grandTotal > 0 ? grandTotal : ''}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
