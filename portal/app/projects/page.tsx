import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Nav from '@/app/components/Nav'
import ProjectGrid from './ProjectGrid'
import ProjectPicker from './ProjectPicker'
import { getPeriodStart } from '@/lib/payPeriod'

function getLastNDays(n: number): string[] {
  const today = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (n - 1 - i))
    return d.toISOString().split('T')[0]
  })
}

function buildDateList(entryDates: string[]): string[] {
  const unique = new Set(entryDates)
  getLastNDays(7).forEach(d => unique.add(d))
  return [...unique].sort()
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { project?: string }
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['crew_lead', 'admin'].includes(profile.role)) redirect('/dashboard')

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('active', true)
    .order('name')

  const selectedProjectId = searchParams.project ?? projects?.[0]?.id ?? null

  const [{ data: activeEmployees }, { data: entries }, { data: closedPeriods }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, role, job_role').eq('active', true).order('full_name'),
    selectedProjectId
      ? supabase
          .from('time_entries')
          .select('id, employee_id, date, hours, job_code')
          .eq('project_id', selectedProjectId)
          .eq('entry_type', 'project')
      : Promise.resolve({ data: [] }),
    supabase
      .from('pay_periods')
      .select('start_date')
      .not('closed_at', 'is', null),
  ])

  const dates = buildDateList((entries ?? []).map(e => e.date))

  const activeIds = new Set((activeEmployees ?? []).map(e => e.id))
  const inactiveIdsWithHours = [...new Set((entries ?? []).map(e => e.employee_id))]
    .filter(id => !activeIds.has(id))

  const { data: inactiveWithHours } = inactiveIdsWithHours.length
    ? await supabase.from('profiles').select('id, full_name, role, job_role').in('id', inactiveIdsWithHours)
    : { data: [] }

  const employees = [...(activeEmployees ?? []), ...(inactiveWithHours ?? [])]
  const closedPeriodStarts = (closedPeriods ?? []).map(p => p.start_date as string)
  const canEdit = profile.role === 'crew_lead' || profile.role === 'admin'
  const isAdmin = profile.role === 'admin'

  return (
    <>
      <Nav role={profile.role} name={profile.full_name} />
      <main className="page-wide">
        <div className="row" style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0 }}>Project Hours</h1>
          <div className="spacer" />
          <ProjectPicker projects={projects ?? []} selected={selectedProjectId ?? ''} />
        </div>

        {!selectedProjectId ? (
          <div className="card" style={{ color: '#6b7280' }}>Select a project to view hours.</div>
        ) : (
          <ProjectGrid
            projectId={selectedProjectId}
            dates={dates}
            employees={employees}
            entries={(entries ?? []) as { id: string; employee_id: string; date: string; hours: number; job_code: string | null }[]}
            canEdit={canEdit}
            isAdmin={isAdmin}
            currentUserId={user.id}
            closedPeriodStarts={closedPeriodStarts}
          />
        )}
      </main>
    </>
  )
}
