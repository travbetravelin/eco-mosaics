export interface Employee {
  id: string
  full_name: string
  role: string
}

export interface RawEntry {
  employee_id: string
  date: string
  hours: number
  entry_type: 'project' | 'sick' | 'wellness'
  project_id: string | null
  project_name: string | null
}

export interface DayBreakdown {
  projectHours: number
  regular: number
  bonus: number
  ot: number
  double: number
  sick: number
  wellness: number
  projects: string[]
}

export type PayrollData = Record<string, Record<string, DayBreakdown>>

// Formulas from the Google Sheets payroll template
export function calcRegular(h: number) { return Math.min(h, 7) }
export function calcBonus(h: number)   { return Math.max(Math.min(h, 8) - 7, 0) }
export function calcOT(h: number)      { return Math.max(Math.min(h, 12) - 8, 0) }
export function calcDouble(h: number)  { return Math.max(h - 12, 0) }

export function buildPayrollData(entries: RawEntry[]): PayrollData {
  const data: PayrollData = {}

  for (const e of entries) {
    if (!data[e.date]) data[e.date] = {}
    if (!data[e.date][e.employee_id]) {
      data[e.date][e.employee_id] = {
        projectHours: 0, regular: 0, bonus: 0, ot: 0, double: 0,
        sick: 0, wellness: 0, projects: [],
      }
    }
    const day = data[e.date][e.employee_id]
    if (e.entry_type === 'sick') {
      day.sick += e.hours
    } else if (e.entry_type === 'wellness') {
      day.wellness += e.hours
    } else {
      day.projectHours += e.hours
      if (e.project_name && !day.projects.includes(e.project_name)) {
        day.projects.push(e.project_name)
      }
    }
  }

  for (const date of Object.keys(data)) {
    for (const empId of Object.keys(data[date])) {
      const day = data[date][empId]
      day.regular = calcRegular(day.projectHours)
      day.bonus   = calcBonus(day.projectHours)
      day.ot      = calcOT(day.projectHours)
      day.double  = calcDouble(day.projectHours)
    }
  }

  return data
}

export function addDays(date: string, n: number): string {
  const d = new Date(date + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

export function dateRange(start: string, days: number): string[] {
  return Array.from({ length: days }, (_, i) => addDays(start, i))
}

export function fmt(n: number): string {
  return n === 0 ? '' : String(n % 1 === 0 ? n : n.toFixed(2))
}

export function formatDisplayDate(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${m}/${d}`
}
