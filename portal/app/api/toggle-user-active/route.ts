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

  const { userId, active } = await request.json()

  const admin = createAdminClient()

  // Ban or unban in Supabase Auth so they can/can't log in
  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: active ? 'none' : '876000h',
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  // Mirror the flag in profiles for UI filtering
  const { error: dbError } = await admin
    .from('profiles')
    .update({ active })
    .eq('id', userId)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
