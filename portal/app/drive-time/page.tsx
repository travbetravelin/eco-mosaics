import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Nav from '@/app/components/Nav'
import DriveTimeForm from './DriveTimeForm'

export default async function DriveTimePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('active', true)
    .order('name')

  return (
    <>
      <Nav role={profile?.role ?? 'crew'} name={profile?.full_name ?? ''} />
      <main className="page">
        <h1>Mobe / Extra Time</h1>
        <p className="page-subtitle">Log drive time, camp hours, and other non-field time.</p>

        <DriveTimeForm
          projects={projects ?? []}
          currentUserId={user.id}
        />
      </main>
    </>
  )
}
