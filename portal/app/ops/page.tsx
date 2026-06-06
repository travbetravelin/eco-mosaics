import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Nav from '@/app/components/Nav'
import OpsCharts from './OpsCharts'
import { JOB_ROLE_ORDER } from '@/lib/payroll'

function median(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

const DRIVE_CATEGORIES = [
  { key: 'to_hitch',   label: 'To Hitch' },
  { key: 'on_hitch',   label: 'On Hitch' },
  { key: 'from_hitch', label: 'From Hitch' },
]

const ROLE_ORDER = [...JOB_ROLE_ORDER, 'Unassigned'] as string[]

export default async function OpsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['crew_lead', 'admin'].includes(profile.role)) redirect('/dashboard')

  const [{ data: timeEntries }, { data: mileageEntries }] = await Promise.all([
    supabase
      .from('time_entries')
      .select('*'),
    supabase
      .from('time_entries')
      .select('drive_category, mileage')
      .eq('job_code', 'Mobe')
      .not('mileage', 'is', null),
  ])

  // ── Hours by Role ─────────────────────────────────────────────────────────
  const hoursByRole: Record<string, number> = {}
  for (const e of timeEntries ?? []) {
    const role = e.job_role ?? 'Unassigned'
    hoursByRole[role] = (hoursByRole[role] ?? 0) + Number(e.hours)
  }

  const hoursRoleData = Object.entries(hoursByRole)
    .map(([role, hours]) => ({ role, hours }))
    .sort((a, b) => {
      const ai = ROLE_ORDER.indexOf(a.role)
      const bi = ROLE_ORDER.indexOf(b.role)
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })

  // ── Hours by Job Code × Role ──────────────────────────────────────────────
  const codeRoleMap: Record<string, Record<string, number>> = {}
  for (const e of timeEntries ?? []) {
    const code = e.job_code ?? e.entry_type
    const role = e.job_role ?? 'Unassigned'
    if (!codeRoleMap[code]) codeRoleMap[code] = {}
    codeRoleMap[code][role] = (codeRoleMap[code][role] ?? 0) + Number(e.hours)
  }

  const hoursCodeData = Object.entries(codeRoleMap)
    .map(([code, roleData]) => ({ code, ...roleData }))
    .sort((a, b) => {
      const sum = (obj: Record<string, unknown>) =>
        Object.entries(obj).filter(([k]) => k !== 'code').reduce((s, [, v]) => s + Number(v), 0)
      return sum(b) - sum(a)
    })

  // Roles present in data, ordered by JOB_ROLE_ORDER
  const presentRoles = new Set((timeEntries ?? []).map(e => e.job_role ?? 'Unassigned'))
  const roles = ROLE_ORDER.filter(r => presentRoles.has(r))

  // ── Mileage Stats ─────────────────────────────────────────────────────────
  const mileageStats = DRIVE_CATEGORIES.map(cat => {
    const values = (mileageEntries ?? [])
      .filter(e => e.drive_category === cat.key && e.mileage != null)
      .map(e => Number(e.mileage))
    const total = values.reduce((s, v) => s + v, 0)
    const avg = values.length ? total / values.length : 0
    return { category: cat.label, total, avg, median: median(values) }
  })

  return (
    <>
      <Nav role={profile.role} name={profile.full_name} />
      <main className="page">
        <h1 style={{ marginBottom: 4 }}>Ops Metrics</h1>
        <p className="page-subtitle" style={{ marginBottom: 32 }}>
          Hours and mileage across all projects and pay periods.
        </p>
        <OpsCharts
          hoursRoleData={hoursRoleData}
          hoursCodeData={hoursCodeData}
          roles={roles}
          mileageStats={mileageStats}
        />
      </main>
    </>
  )
}
