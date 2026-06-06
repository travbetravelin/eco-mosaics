import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Nav from '@/app/components/Nav'
import ClockWidget from '@/app/components/ClockWidget'

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const today = new Date().toISOString().split('T')[0]
  const sevenDaysOut = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

  const [{ data: shifts }, { data: openEntry }, { data: recentEntries }] = await Promise.all([
    supabase
      .from('shifts')
      .select('id, date, start_time, end_time, notes')
      .eq('employee_id', user.id)
      .gte('date', today)
      .lte('date', sevenDaysOut)
      .order('date'),
    supabase
      .from('time_entries')
      .select('id, clocked_in_at')
      .eq('employee_id', user.id)
      .is('clocked_out_at', null)
      .maybeSingle(),
    supabase
      .from('time_entries')
      .select('id, clocked_in_at, clocked_out_at, status, notes')
      .eq('employee_id', user.id)
      .not('clocked_out_at', 'is', null)
      .order('clocked_in_at', { ascending: false })
      .limit(10),
  ])

  return (
    <>
      <Nav role={profile?.role ?? 'employee'} name={profile?.full_name ?? ''} />
      <main className="page">
        <h1>Welcome, {profile?.full_name?.split(' ')[0]}</h1>
        <p className="page-subtitle">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
          <div>
            <h2>Time clock</h2>
            <ClockWidget openEntry={openEntry ?? null} userId={user.id} />
          </div>

          <div>
            <h2>Upcoming shifts</h2>
            <div className="stack">
              {!shifts?.length && (
                <div className="card" style={{ color: '#6b7280' }}>No shifts scheduled in the next 7 days.</div>
              )}
              {shifts?.map(shift => (
                <div className="card" key={shift.id}>
                  <div style={{ fontWeight: 600 }}>{formatDate(shift.date)}</div>
                  <div style={{ color: '#6b7280', marginTop: 2 }}>
                    {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
                  </div>
                  {shift.notes && <div style={{ marginTop: 6, fontSize: '1rem' }}>{shift.notes}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <h2>Recent time entries</h2>
        {!recentEntries?.length ? (
          <div className="card" style={{ color: '#6b7280' }}>No time entries yet.</div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Clock in</th>
                  <th>Clock out</th>
                  <th>Hours</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.map(entry => {
                  const inTime = new Date(entry.clocked_in_at)
                  const outTime = entry.clocked_out_at ? new Date(entry.clocked_out_at) : null
                  const hours = outTime ? ((outTime.getTime() - inTime.getTime()) / 3600000).toFixed(2) : '—'
                  return (
                    <tr key={entry.id}>
                      <td>{inTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                      <td>{inTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td>{outTime ? outTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td>{hours}</td>
                      <td><span className={`badge badge-${entry.status}`}>{entry.status}</span></td>
                      <td style={{ color: '#6b7280' }}>{entry.notes ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  )
}
