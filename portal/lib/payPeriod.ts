// All pay periods are 14-day windows derived from this base date.
export const PAYROLL_BASE_DATE = '2025-01-01'

export function getPeriodStart(dateStr: string): string {
  const base = new Date(PAYROLL_BASE_DATE + 'T00:00:00')
  const d = new Date(dateStr + 'T00:00:00')
  const diffDays = Math.round((d.getTime() - base.getTime()) / 86_400_000)
  const periodNum = Math.floor(diffDays / 14)
  const start = new Date(base)
  start.setDate(base.getDate() + periodNum * 14)
  return start.toISOString().split('T')[0]
}

export function getPeriodEnd(periodStart: string): string {
  const d = new Date(periodStart + 'T00:00:00')
  d.setDate(d.getDate() + 13)
  return d.toISOString().split('T')[0]
}

export function getCurrentPeriodStart(): string {
  return getPeriodStart(new Date().toISOString().split('T')[0])
}

export function formatPeriodLabel(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const fmtStart = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const fmtEnd = e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${fmtStart} – ${fmtEnd}`
}

export function isDateLocked(dateStr: string, closedPeriodStarts: string[]): boolean {
  return closedPeriodStarts.includes(getPeriodStart(dateStr))
}
