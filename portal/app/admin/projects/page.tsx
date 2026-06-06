import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Nav from '@/app/components/Nav'
import ProjectActions from './ProjectActions'

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
    .select('id, name, active, created_at')
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
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!projects?.length && (
                  <tr><td colSpan={3} style={{ color: '#6b7280', textAlign: 'center', padding: 24 }}>No projects yet.</td></tr>
                )}
                {projects?.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td>
                      <span className={`badge ${p.active ? 'badge-approved' : 'badge-rejected'}`}>
                        {p.active ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    <td>
                      <ProjectActions id={p.id} active={p.active} />
                    </td>
                  </tr>
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
