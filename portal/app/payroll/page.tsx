import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Nav from '@/app/components/Nav'
import PayPeriodPicker from './PayPeriodPicker'
import PayrollTable from './PayrollTable'
import { buildPayrollData, addDays, type RawEntry } from '@/lib/payroll'

function getMostRecentMonday(): string {
  const today = new Date()
  const day = today.getDay()
  const diff = day === 0 ? -6 : 1 - day
  today.setDate(today.getDate() + diff)
  return today.toISOString().split('T')[0]
}

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: { start?: string }
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const startDate = searchParams.start ?? getMostRecentMonday()
  const endDate = addDays(startDate, 13)

  const [{ data: employees }, { data: rawEntries }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, role, job_role').eq('active', true).order('full_name'),
    supabase
      .from('time_entries')
      .select('employee_id, date, hours, entry_type, project_id, projects(name)')
      .gte('date', startDate)
      .lte('date', endDate),
  ])

  const entries: RawEntry[] = (rawEntries ?? []).map(e => {
    const proj = Array.isArray(e.projects) ? e.projects[0] : e.projects
    return {
      employee_id: e.employee_id,
      date: e.date,
      hours: Number(e.hours),
      entry_type: e.entry_type as RawEntry['entry_type'],
      project_id: e.project_id,
      project_name: (proj as { name: string } | null)?.name ?? null,
    }
  })

  const payrollData = buildPayrollData(entries)

  return (
    <>
      <Nav role={profile?.role ?? 'admin'} name={profile?.full_name ?? ''} />
      <main className="page-wide">
        <div className="row" style={{ marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0 }}>Payroll Summary</h1>
            <div style={{ color: '#6b7280', marginTop: 4 }}>
              {startDate} → {endDate}
            </div>
          </div>
          <div className="spacer" />
          <PayPeriodPicker value={startDate} />
        </div>

        <PayrollTable
          employees={employees ?? []}
          data={payrollData}
          startDate={startDate}
        />
      </main>
    </>
  )
}
