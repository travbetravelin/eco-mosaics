import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { email, fullName, password, appRole, jobRole, paychexId } = await request.json()

  const admin = createAdminClient()

  const { data: newUser, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Update profile (trigger creates the row, we update additional fields)
  await admin.from('profiles').update({
    full_name: fullName,
    role: appRole,
    job_role: jobRole || null,
    paychex_employee_id: paychexId || null,
  }).eq('id', newUser.user.id)

  return NextResponse.json({ success: true })
}
