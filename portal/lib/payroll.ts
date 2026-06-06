export interface Employee {
  id: string
  full_name: string
  role: string
  job_role: string | null
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

export const JOB_ROLE_ORDER = [
  'CEO', 'Crew Lead', 'Key Crew', 'General Crew 2', 'General Crew 1', 'Tribal Crew', 'Wilbur Staff',
] as const

export type JobRole = typeof JOB_ROLE_ORDER[number]

export interface EmployeeGroup {
  role: string
  employees: Employee[]
}

export const GROUP_COLORS: Record<string, { bg: string; text: string }> = {
  'CEO':            { bg: '#1b4332', text: 'white' },
  'Crew Lead':      { bg: '#1e3a5f', text: 'white' },
  'Key Crew':       { bg: '#155e75', text: 'white' },
  'General Crew 2': { bg: '#3d5a1e', text: 'white' },
  'General Crew 1': { bg: '#4a7c35', text: 'white' },
  'Tribal Crew':    { bg: '#7c3d28', text: 'white' },
  'Wilbur Staff':   { bg: '#4a1d6b', text: 'white' },
  'Unassigned':     { bg: '#6b7280', text: 'white' },
}

export function groupEmployees(employees: Employee[]): EmployeeGroup[] {
  const groups: EmployeeGroup[] = []
  for (const role of JOB_ROLE_ORDER) {
    const members = employees
      .filter(e => e.job_role === role)
      .sort((a, b) => a.full_name.localeCompare(b.full_name))
    if (members.length > 0) groups.push({ role, employees: members })
  }
  const unassigned = employees
    .filter(e => !e.job_role || !(JOB_ROLE_ORDER as readonly string[]).includes(e.job_role))
    .sort((a, b) => a.full_name.localeCompare(b.full_name))
  if (unassigned.length > 0) groups.push({ role: 'Unassigned', employees: unassigned })
  return groups
}

export function sortedEmployees(employees: Employee[]): Employee[] {
  return groupEmployees(employees).flatMap(g => g.employees)
}

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
