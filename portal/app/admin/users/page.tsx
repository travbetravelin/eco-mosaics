import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Nav from '@/app/components/Nav'
import EditUserForm from './EditUserForm'
import NewUserForm from './NewUserForm'
import ToggleActiveButton from './ToggleActiveButton'
import { JOB_ROLE_ORDER } from '@/lib/payroll'

export default async function ManageUsersPage({
  searchParams,
}: {
  searchParams: { show?: string }
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('full_name, role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const showInactive = searchParams.show === 'inactive'

  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, role, job_role, paychex_employee_id, active')
    .eq('active', !showInactive)
    .order('full_name')

  return (
    <>
      <Nav role={profile.role} name={profile.full_name} />
      <main className="page-wide">
        <div className="row" style={{ marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0 }}>Manage Employees</h1>
            <p className="page-subtitle" style={{ margin: '4px 0 0' }}>
              {showInactive ? 'Showing inactive employees' : 'Showing active employees'}
            </p>
          </div>
          <div className="spacer" />
          <a
            href={showInactive ? '/admin/users' : '/admin/users?show=inactive'}
            className="btn btn-secondary"
          >
            {showInactive ? 'Show active' : 'Show inactive'}
          </a>
          {!showInactive && <NewUserForm />}
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Job Role</th>
                <th>App Role</th>
                <th>Paychex ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!users?.length && (
                <tr>
                  <td colSpan={5} style={{ color: '#6b7280', textAlign: 'center', padding: 24 }}>
                    No {showInactive ? 'inactive' : 'active'} employees.
                  </td>
                </tr>
              )}
              {users?.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.full_name}</td>
                  <td>{u.job_role ?? <span style={{ color: '#9ca3af' }}>—</span>}</td>
                  <td style={{ textTransform: 'capitalize' }}>{u.role}</td>
                  <td style={{ color: '#6b7280' }}>{u.paychex_employee_id ?? '—'}</td>
                  <td>
                    <div className="row" style={{ gap: 8 }}>
                      {!showInactive && (
                        <EditUserForm
                          userId={u.id}
                          fullName={u.full_name}
                          appRole={u.role}
                          jobRole={u.job_role ?? ''}
                          paychexId={u.paychex_employee_id ?? ''}
                          jobRoleOptions={[...JOB_ROLE_ORDER]}
                        />
                      )}
                      <ToggleActiveButton
                        userId={u.id}
                        active={u.active}
                        name={u.full_name}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}
