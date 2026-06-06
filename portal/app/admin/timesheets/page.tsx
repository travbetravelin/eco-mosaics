import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Nav from '@/app/components/Nav'
import TimesheetActions from './TimesheetActions'

export default async function TimesheetsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['crew_lead', 'admin'].includes(profile.role)) redirect('/dashboard')

  const { data: entries } = await supabase
    .from('time_entries')
    .select(`
      id, date, hours, entry_type, status, notes, admin_notes,
      profiles!time_entries_employee_id_fkey(full_name),
      projects(name)
    `)
    .order('date', { ascending: false })
    .limit(200)

  return (
    <>
      <Nav role={profile.role} name={profile.full_name} />
      <main className="page-wide">
        <h1>Timesheets</h1>
        <p className="page-subtitle">Review and approve employee hour entries.</p>

        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Type</th>
                <th>Project</th>
                <th>Hours</th>
                <th>Notes</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!entries?.length && (
                <tr><td colSpan={8} style={{ color: '#6b7280', textAlign: 'center', padding: 24 }}>No entries.</td></tr>
              )}
              {entries?.map(entry => {
                const emp = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles
                const proj = Array.isArray(entry.projects) ? entry.projects[0] : entry.projects
                return (
                  <tr key={entry.id}>
                    <td style={{ fontWeight: 500 }}>{(emp as { full_name: string } | null)?.full_name ?? '—'}</td>
                    <td>{entry.date}</td>
                    <td style={{ textTransform: 'capitalize' }}>{entry.entry_type}</td>
                    <td style={{ color: '#6b7280' }}>{(proj as { name: string } | null)?.name ?? '—'}</td>
                    <td>{entry.hours}</td>
                    <td style={{ color: '#6b7280', maxWidth: 160 }}>{entry.notes ?? '—'}</td>
                    <td><span className={`badge badge-${entry.status}`}>{entry.status}</span></td>
                    <td>
                      <TimesheetActions
                        entryId={entry.id}
                        status={entry.status}
                        reviewerId={user.id}
                        currentHours={Number(entry.hours)}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}
