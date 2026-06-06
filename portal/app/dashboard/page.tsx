import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Nav from '@/app/components/Nav'
import LogHoursForm from './LogHoursForm'

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

  const [{ data: employees }, { data: recentEntries }] = await Promise.all([
    canLogForOthers
      ? supabase.from('profiles').select('id, full_name').eq('active', true).order('full_name')
      : Promise.resolve({ data: [{ id: user.id, full_name: profile?.full_name ?? '' }] }),
    supabase
      .from('time_entries')
      .select('id, date, hours, entry_type, job_code, status, notes, projects(name)')
      .eq('employee_id', user.id)
      .order('date', { ascending: false })
      .limit(20),
  ])

  return (
    <>
      <Nav role={profile?.role ?? 'crew'} name={profile?.full_name ?? ''} />
      <main className="page">
        <h1>Welcome, {profile?.full_name?.split(' ')[0]}</h1>
        <p className="page-subtitle">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
          <div className="stack">
            <LogHoursForm
              employees={employees ?? []}
              currentUserId={user.id}
              role={profile?.role ?? 'crew'}
            />
            <a href="/drive-time" className="btn btn-secondary" style={{ textAlign: 'center' }}>
              Log Mobe / Extra Time
            </a>
          </div>

          <div>
            <h2>Recent entries</h2>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Job Code</th>
                    <th>Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!recentEntries?.length && (
                    <tr><td colSpan={5} style={{ color: '#6b7280', textAlign: 'center', padding: 20 }}>No entries yet.</td></tr>
                  )}
                  {recentEntries?.map(e => {
                    const proj = Array.isArray(e.projects) ? e.projects[0] : e.projects
                    return (
                      <tr key={e.id}>
                        <td>{e.date}</td>
                        <td style={{ textTransform: 'capitalize' }}>{e.entry_type}</td>
                        <td style={{ color: '#6b7280' }}>{e.job_code ?? (proj as { name: string } | null)?.name ?? '—'}</td>
                        <td>{e.hours}</td>
                        <td><span className={`badge badge-${e.status}`}>{e.status}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
