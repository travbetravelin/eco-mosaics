import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Nav from '@/app/components/Nav'
import ProjectGrid from './ProjectGrid'
import ProjectPicker from './ProjectPicker'

function getLast30Days(): string[] {
  const days: string[] = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { project?: string }
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['crew_lead', 'admin'].includes(profile.role)) redirect('/dashboard')

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('active', true)
    .order('name')

  const selectedProjectId = searchParams.project ?? projects?.[0]?.id ?? null

  const dates = getLast30Days()

  const [{ data: employees }, { data: entries }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, role, job_role').eq('active', true).order('full_name'),
    selectedProjectId
      ? supabase
          .from('time_entries')
          .select('id, employee_id, date, hours')
          .eq('project_id', selectedProjectId)
          .eq('entry_type', 'project')
          .gte('date', dates[0])
      : Promise.resolve({ data: [] }),
  ])

  const canEdit = profile.role === 'crew_lead' || profile.role === 'admin'

  return (
    <>
      <Nav role={profile.role} name={profile.full_name} />
      <main className="page-wide">
        <div className="row" style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0 }}>Project Hours</h1>
          <div className="spacer" />
          <ProjectPicker projects={projects ?? []} selected={selectedProjectId ?? ''} />
        </div>

        {!selectedProjectId ? (
          <div className="card" style={{ color: '#6b7280' }}>Select a project to view hours.</div>
        ) : (
          <ProjectGrid
            projectId={selectedProjectId}
            dates={dates}
            employees={employees ?? []}
            entries={(entries ?? []) as { id: string; employee_id: string; date: string; hours: number }[]}
            canEdit={canEdit}
            currentUserId={user.id}
          />
        )}
      </main>
    </>
  )
}
