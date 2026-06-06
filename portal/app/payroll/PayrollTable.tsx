import {
  type Employee,
  type PayrollData,
  type DayBreakdown,
  groupEmployees,
  sortedEmployees,
  GROUP_COLORS,
  fmt,
  formatDisplayDate,
  dateRange,
} from '@/lib/payroll'

const ROW_TYPES = ['Total', 'Regular', 'OT', 'Bonus', 'Double'] as const
const WEEK_EXTRA = ['Sick', 'Wellness'] as const

const ROW_BG: Record<string, string> = {
  Total:    'white',
  Regular:  '#f0f7f4',
  OT:       '#fef9c3',
  Bonus:    '#ede9fe',
  Double:   '#fee2e2',
  Sick:     '#e0f2fe',
  Wellness: '#f0fdf4',
}

function cellVal(day: DayBreakdown | undefined, type: string): string {
  if (!day) return ''
  switch (type) {
    case 'Total':    return fmt(day.projectHours)
    case 'Regular':  return fmt(day.regular)
    case 'OT':       return fmt(day.ot)
    case 'Bonus':    return fmt(day.bonus)
    case 'Double':   return fmt(day.double)
    case 'Sick':     return fmt(day.sick)
    case 'Wellness': return fmt(day.wellness)
    default: return ''
  }
}

function weekSum(data: PayrollData, empId: string, dates: string[], type: string): string {
  let sum = 0
  for (const date of dates) {
    const day = data[date]?.[empId]
    if (!day) continue
    switch (type) {
      case 'Total':    sum += day.projectHours; break
      case 'Regular':  sum += day.regular; break
      case 'OT':       sum += day.ot; break
      case 'Bonus':    sum += day.bonus; break
      case 'Double':   sum += day.double; break
      case 'Sick':     sum += day.sick; break
      case 'Wellness': sum += day.wellness; break
    }
  }
  return fmt(sum)
}

function grandTotal(data: PayrollData, employees: Employee[], dates: string[], type: string): string {
  let sum = 0
  for (const emp of employees) {
    const v = parseFloat(weekSum(data, emp.id, dates, type))
    if (!isNaN(v)) sum += v
  }
  return fmt(sum)
}

function dayTotal(data: PayrollData, employees: Employee[], date: string, type: string): string {
  let sum = 0
  for (const emp of employees) {
    const v = parseFloat(cellVal(data[date]?.[emp.id], type))
    if (!isNaN(v)) sum += v
  }
  return fmt(sum)
}

interface Props {
  employees: Employee[]
  data: PayrollData
  startDate: string
}

export default function PayrollTable({ employees, data, startDate }: Props) {
  const groups = groupEmployees(employees)
  const ordered = sortedEmployees(employees)
  const week1 = dateRange(startDate, 7)
  const week2 = dateRange(startDate, 14).slice(7)

  const colCount = ordered.length + 4 // Date + Project + Type + Total

  const renderWeek = (dates: string[], weekLabel: string) => (
    <>
      <tr style={{ background: '#2d6a4f', color: 'white' }}>
        <td colSpan={colCount} style={{ fontWeight: 700, padding: '6px 12px' }}>
          {weekLabel}
        </td>
      </tr>

      {dates.flatMap(date => {
        const dayData = data[date]
        const projects = Object.values(dayData ?? {}).flatMap(d => d.projects)
        const uniqueProjects = [...new Set(projects)]

        return ROW_TYPES.map((type, i) => (
          <tr key={`${date}-${type}`} style={{ background: ROW_BG[type] }}>
            {i === 0 && (
              <>
                <td rowSpan={5} className="sticky-col"
                  style={{ fontWeight: 600, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                  {formatDisplayDate(date)}
                </td>
                <td rowSpan={5} style={{ verticalAlign: 'middle', color: '#6b7280' }}>
                  {uniqueProjects.join(', ') || ''}
                </td>
              </>
            )}
            <td style={{ fontWeight: 500, paddingLeft: 12, whiteSpace: 'nowrap' }}>{type}</td>
            {ordered.map(emp => (
              <td key={emp.id} style={{ textAlign: 'center' }}>
                {cellVal(dayData?.[emp.id], type)}
              </td>
            ))}
            <td style={{ textAlign: 'center', fontWeight: 600, background: '#f9fafb' }}>
              {dayTotal(data, ordered, date, type)}
            </td>
          </tr>
        ))
      })}

      {[...ROW_TYPES, ...WEEK_EXTRA].map((type, i) => (
        <tr key={`${weekLabel}-total-${type}`} style={{ background: ROW_BG[type], fontWeight: 600 }}>
          {i === 0 && (
            <>
              <td rowSpan={ROW_TYPES.length + WEEK_EXTRA.length} className="sticky-col"
                style={{ verticalAlign: 'middle', fontWeight: 700, background: '#e8f4ef' }}>
                {weekLabel} Total
              </td>
              <td rowSpan={ROW_TYPES.length + WEEK_EXTRA.length} style={{ background: '#e8f4ef' }} />
            </>
          )}
          <td style={{ paddingLeft: 12 }}>{type}</td>
          {ordered.map(emp => (
            <td key={emp.id} style={{ textAlign: 'center' }}>
              {weekSum(data, emp.id, dates, type)}
            </td>
          ))}
          <td style={{ textAlign: 'center', background: '#e8f4ef' }}>
            {grandTotal(data, ordered, dates, type)}
          </td>
        </tr>
      ))}
    </>
  )

  return (
    <div style={{ overflowX: 'auto', marginTop: 16 }}>
      <table className="grid-table payroll-table">
        <thead>
          {/* Group header row */}
          <tr style={{ background: '#1b4332', color: 'white' }}>
            <th className="sticky-col" rowSpan={2}>Date</th>
            <th rowSpan={2}>Project</th>
            <th rowSpan={2}>Type</th>
            {groups.map(g => {
              const c = GROUP_COLORS[g.role] ?? GROUP_COLORS['Unassigned']
              return (
                <th key={g.role} colSpan={g.employees.length}
                  style={{ background: c.bg, color: c.text, textAlign: 'center', borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
                  {g.role}
                </th>
              )
            })}
            <th rowSpan={2}>Total</th>
          </tr>
          {/* Employee name row */}
          <tr>
            {ordered.map(emp => (
              <th key={emp.id} style={{ whiteSpace: 'nowrap', minWidth: 80, fontWeight: 400, fontSize: '0.875rem' }}>
                {emp.full_name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {renderWeek(week1, 'Week 1')}
          {renderWeek(week2, 'Week 2')}
        </tbody>
      </table>
    </div>
  )
}
