import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { start_date, end_date } = await req.json() as { start_date: string; end_date: string }
  if (!start_date || !end_date)
    return NextResponse.json({ error: 'start_date and end_date are required' }, { status: 400 })

  const { error } = await supabase
    .from('pay_periods')
    .upsert(
      { start_date, end_date, closed_at: new Date().toISOString(), closed_by: user.id },
      { onConflict: 'start_date' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
