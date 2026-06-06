import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Nav from '@/app/components/Nav'
import DashboardActions from './DashboardActions'
import RecentEntries from './RecentEntries'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const canLogForOthers = profile?.role === 'crew_lead' || profile?.role === 'admin'

  const [{ data: employees }, { data: recentEntries }, { data: projects }, { data: closedPeriods }] = await Promise.all([
    canLogForOthers
      ? supabase.from('profiles').select('id, full_name').eq('active', true).order('full_name')
      : Promise.resolve({ data: [{ id: user.id, full_name: profile?.full_name ?? '' }] }),
    supabase
      .from('time_entries')
      .select('id, date, hours, entry_type, job_code, status, notes, logged_by, project_id, mileage, projects(name)')
      .eq('employee_id', user.id)
      .order('date', { ascending: false })
      .limit(20),
    supabase.from('projects').select('id, name').eq('active', true).order('name'),
    supabase.from('pay_periods').select('start_date').not('closed_at', 'is', null),
  ])

  const closedPeriodStarts = (closedPeriods ?? []).map(p => p.start_date as string)

  const entries = (recentEntries ?? []).map(e => {
    const proj = Array.isArray(e.projects) ? e.projects[0] : e.projects
    return {
      id: e.id,
      date: e.date,
      hours: Number(e.hours),
      entry_type: e.entry_type,
      job_code: e.job_code ?? null,
      status: e.status,
      notes: e.notes ?? null,
      logged_by: e.logged_by,
      project_id: e.project_id ?? null,
      mileage: e.mileage != null ? Number(e.mileage) : null,
      project_name: (proj as { name: string } | null)?.name ?? null,
    }
  })

  return (
    <>
      <Nav role={profile?.role ?? 'crew'} name={profile?.full_name ?? ''} />
      <main className="page">
        <h1>Welcome, {profile?.full_name?.split(' ')[0]}</h1>
        <p className="page-subtitle">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>

        <DashboardActions
          employees={employees ?? []}
          projects={projects ?? []}
          currentUserId={user.id}
          role={profile?.role ?? 'crew'}
        />

        <h2 style={{ marginTop: 40 }}>Recent entries</h2>
        <div className="table-card" style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Job Code</th>
                <th>Hours</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <RecentEntries
                entries={entries}
                currentUserId={user.id}
                closedPeriodStarts={closedPeriodStarts}
                projects={projects ?? []}
              />
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}
