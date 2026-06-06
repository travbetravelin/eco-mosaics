import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Nav from '@/app/components/Nav'
import ProjectActions from './ProjectActions'
import ProjectRow from './ProjectRow'

export default async function ManageProjectsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, active, created_at, lat, lng')
    .order('name')

  return (
    <>
      <Nav role={profile.role} name={profile.full_name} />
      <main className="page">
        <h1>Manage Projects</h1>
        <p className="page-subtitle">Create and archive projects used for time tracking.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}>
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!projects?.length && (
                  <tr><td colSpan={4} style={{ color: '#6b7280', textAlign: 'center', padding: 24 }}>No projects yet.</td></tr>
                )}
                {projects?.map(p => (
                  <ProjectRow
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    lat={p.lat ?? null}
                    lng={p.lng ?? null}
                    active={p.active}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <ProjectActions mode="create" />
        </div>
      </main>
    </>
  )
}
