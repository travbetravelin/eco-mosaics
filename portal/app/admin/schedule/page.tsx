import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Nav from '@/app/components/Nav'
import AddShiftForm from './AddShiftForm'

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

export default async function SchedulePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['manager', 'admin'].includes(profile.role)) redirect('/dashboard')

  const today = new Date().toISOString().split('T')[0]

  const [{ data: shifts }, { data: employees }] = await Promise.all([
    supabase
      .from('shifts')
      .select(`
        id, date, start_time, end_time, notes,
        profiles!shifts_employee_id_fkey(id, full_name)
      `)
      .gte('date', today)
      .order('date')
      .order('start_time')
      .limit(50),
    supabase
      .from('profiles')
      .select('id, full_name')
      .order('full_name'),
  ])

  return (
    <>
      <Nav role={profile.role} name={profile.full_name} />
      <main className="page-wide">
        <h1>Schedule</h1>
        <p className="page-subtitle">Manage upcoming shifts.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>
          <div>
            <h2>Upcoming shifts</h2>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {!shifts?.length && (
                    <tr><td colSpan={5} style={{ color: '#6b7280', textAlign: 'center', padding: 24 }}>No upcoming shifts.</td></tr>
                  )}
                  {shifts?.map(shift => {
                    const emp = Array.isArray(shift.profiles) ? shift.profiles[0] : shift.profiles
                    return (
                      <tr key={shift.id}>
                        <td style={{ fontWeight: 500 }}>{(emp as { full_name: string } | null)?.full_name ?? '—'}</td>
                        <td>{formatDate(shift.date)}</td>
                        <td>{formatTime(shift.start_time)}</td>
                        <td>{formatTime(shift.end_time)}</td>
                        <td style={{ color: '#6b7280' }}>{shift.notes ?? '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2>Add shift</h2>
            <AddShiftForm employees={employees ?? []} createdBy={user.id} />
          </div>
        </div>
      </main>
    </>
  )
}
