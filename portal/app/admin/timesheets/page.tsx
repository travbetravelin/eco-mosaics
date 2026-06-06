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

  if (!profile || !['manager', 'admin'].includes(profile.role)) redirect('/dashboard')

  const { data: entries } = await supabase
    .from('time_entries')
    .select(`
      id, clocked_in_at, clocked_out_at, status, notes, admin_notes,
      profiles!time_entries_employee_id_fkey(full_name)
    `)
    .order('clocked_in_at', { ascending: false })
    .limit(100)

  return (
    <>
      <Nav role={profile.role} name={profile.full_name} />
      <main className="page-wide">
        <h1>Timesheets</h1>
        <p className="page-subtitle">Review, approve, or adjust employee time entries.</p>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Clock in</th>
                <th>Clock out</th>
                <th>Hours</th>
                <th>Notes</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries?.map(entry => {
                const inTime = new Date(entry.clocked_in_at)
                const outTime = entry.clocked_out_at ? new Date(entry.clocked_out_at) : null
                const hours = outTime ? ((outTime.getTime() - inTime.getTime()) / 3600000).toFixed(2) : '—'
                const emp = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles
                return (
                  <tr key={entry.id}>
                    <td style={{ fontWeight: 500 }}>{(emp as { full_name: string } | null)?.full_name ?? '—'}</td>
                    <td>{inTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                    <td>{inTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{outTime ? outTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td>{hours}</td>
                    <td style={{ color: '#6b7280', maxWidth: 180 }}>{entry.notes ?? '—'}</td>
                    <td><span className={`badge badge-${entry.status}`}>{entry.status}</span></td>
                    <td>
                      <TimesheetActions entryId={entry.id} status={entry.status} reviewerId={user.id} />
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
