import type { Employee } from '@/lib/payroll'

interface MileageEntry {
  employee_id: string
  drive_category: string | null
  mileage: number
}

interface Props {
  employees: Employee[]
  mileageEntries: MileageEntry[]
}

const CATEGORIES = [
  { key: 'to_hitch',   label: 'To Hitch' },
  { key: 'on_hitch',   label: 'On Hitch' },
  { key: 'from_hitch', label: 'From Hitch' },
] as const

export default function MileageSummary({ employees, mileageEntries }: Props) {
  // Build per-employee, per-category totals
  const totals: Record<string, Record<string, number>> = {}
  for (const e of mileageEntries) {
    if (!e.drive_category || !e.mileage) continue
    if (!totals[e.employee_id]) totals[e.employee_id] = {}
    totals[e.employee_id][e.drive_category] = (totals[e.employee_id][e.drive_category] ?? 0) + e.mileage
  }

  const activeEmployees = employees.filter(e => totals[e.id])
  if (!activeEmployees.length) return null

  const grandTotals = CATEGORIES.map(c =>
    activeEmployees.reduce((sum, e) => sum + (totals[e.id]?.[c.key] ?? 0), 0)
  )
  const grandTotal = grandTotals.reduce((a, b) => a + b, 0)

  function fmt(n: number) { return n > 0 ? n.toFixed(1).replace(/\.0$/, '') : '' }

  return (
    <div style={{ marginTop: 40 }}>
      <h2 style={{ marginBottom: 16 }}>Mileage</h2>
      <div className="grid-container">
        <table className="grid-table">
          <thead>
            <tr>
              <th className="sticky-col" style={{ minWidth: 160 }}>Employee</th>
              {CATEGORIES.map(c => <th key={c.key} style={{ textAlign: 'center', minWidth: 90 }}>{c.label}</th>)}
              <th style={{ textAlign: 'center', minWidth: 80 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {activeEmployees.map((emp, rowIdx) => {
              const empTotals = CATEGORIES.map(c => totals[emp.id]?.[c.key] ?? 0)
              const empTotal = empTotals.reduce((a, b) => a + b, 0)
              return (
                <tr key={emp.id} style={{ background: rowIdx % 2 === 0 ? 'white' : '#fcfcfc' }}>
                  <td className="sticky-col" style={{ fontWeight: 500, background: rowIdx % 2 === 0 ? 'white' : '#fcfcfc' }}>
                    {emp.full_name}
                  </td>
                  {empTotals.map((v, i) => (
                    <td key={i} style={{ textAlign: 'center', color: v > 0 ? '#374151' : '#d1d5db' }}>
                      {fmt(v)}
                    </td>
                  ))}
                  <td style={{ textAlign: 'center', fontWeight: 700, color: '#1b4332', background: '#f0f7f4' }}>
                    {fmt(empTotal)}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="sticky-col" style={{ fontWeight: 700, background: '#e8f4ef', color: '#1b4332' }}>
                TOTAL
              </td>
              {grandTotals.map((v, i) => (
                <td key={i} style={{ textAlign: 'center', fontWeight: 700, background: '#e8f4ef', color: v > 0 ? '#1b4332' : '#d1d5db' }}>
                  {fmt(v)}
                </td>
              ))}
              <td style={{ textAlign: 'center', fontWeight: 700, background: '#c8e8d8', color: '#1b4332' }}>
                {fmt(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
