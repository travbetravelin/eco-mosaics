import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Nav from '@/app/components/Nav'

export default async function SchedulePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  return (
    <>
      <Nav role={profile?.role ?? 'crew'} name={profile?.full_name ?? ''} />
      <main className="page-wide">
        <h1 style={{ marginBottom: 4 }}>Schedule</h1>
        <p className="page-subtitle" style={{ marginBottom: 24 }}>Team calendar</p>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <iframe
            src="https://calendar.google.com/calendar/embed?src=travis.wilsonj%40gmail.com&ctz=America%2FLos_Angeles"
            style={{ border: 0, display: 'block', width: '100%', height: '75vh', minHeight: 500 }}
            frameBorder="0"
            scrolling="no"
          />
        </div>
      </main>
    </>
  )
}
