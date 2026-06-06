import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Nav from '@/app/components/Nav'
import ChangePasswordForm from './ChangePasswordForm'

export default async function AccountPage() {
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
      <main className="page">
        <h1>My Account</h1>
        <p className="page-subtitle">{profile?.full_name} · {user.email}</p>

        <div style={{ maxWidth: 420 }}>
          <ChangePasswordForm />
        </div>
      </main>
    </>
  )
}
