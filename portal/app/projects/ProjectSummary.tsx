import { JOB_ROLE_ORDER } from '@/lib/payroll'

interface SummaryEntry {
  hours: number
  job_code: string | null
  job_role?: string | null
}

interface MileageEntry {
  drive_category: string | null
  mileage: number
}

interface Props {
  entries: SummaryEntry[]
  mileageEntries: MileageEntry[]
}

const ROLE_ORDER = [...JOB_ROLE_ORDER, 'Unassigned'] as string[]

const MILEAGE_CATS = [
  { key: 'to_hitch',   label: 'To Hitch' },
  { key: 'on_hitch',   label: 'On Hitch' },
  { key: 'from_hitch', label: 'From Hitch' },
]

function fmt(n: number) {
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

const th: React.CSSProperties = { padding: '8px 12px' }
const td: React.CSSProperties = { padding: '7px 12px' }

export default function ProjectSummary({ entries, mileageEntries }: Props) {
  if (!entries.length) return null

  const totalHours = entries.reduce((s, e) => s + Number(e.hours), 0)

  const byRole: Record<string, number> = {}
  for (const e of entries) {
    const role = e.job_role ?? 'Unassigned'
    byRole[role] = (byRole[role] ?? 0) + Number(e.hours)
  }
  const roleRows = ROLE_ORDER.filter(r => byRole[r]).map(r => ({ role: r, hours: byRole[r] }))

  const byCode: Record<string, number> = {}
  for (const e of entries) {
    const code = e.job_code ?? 'Field'
    byCode[code] = (byCode[code] ?? 0) + Number(e.hours)
  }
  const codeRows = Object.entries(byCode)
    .map(([code, hours]) => ({ code, hours }))
    .sort((a, b) => b.hours - a.hours)

  const mileageTotals = MILEAGE_CATS.map(cat => ({
    label: cat.label,
    total: mileageEntries
      .filter(e => e.drive_category === cat.key)
      .reduce((s, e) => s + Number(e.mileage), 0),
  }))
  const totalMileage = mileageTotals.reduce((s, m) => s + m.total, 0)

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ marginBottom: 16 }}>Summary</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 16 }}>

        {/* Total hours */}
        <div className="card" style={{
          padding: 24, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', minWidth: 120,
        }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#1b4332', lineHeight: 1 }}>
            {fmt(totalHours)}
          </div>
          <div style={{ color: '#6b7280', marginTop: 8, fontWeight: 500 }}>Total Hours</div>
        </div>

        {/* By role */}
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th style={th}>Role</th>
                <th style={{ ...th, textAlign: 'right' }}>Hours</th>
                <th style={{ ...th, textAlign: 'right' }}>%</th>
              </tr>
            </thead>
            <tbody>
              {roleRows.map(r => (
                <tr key={r.role}>
                  <td style={td}>{r.role}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{fmt(r.hours)}</td>
                  <td style={{ ...td, textAlign: 'right', color: '#6b7280' }}>
                    {(r.hours / totalHours * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={td}>Total</td>
                <td style={{ ...td, textAlign: 'right' }}>{fmt(totalHours)}</td>
                <td style={{ ...td, textAlign: 'right' }}>100%</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* By job code */}
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th style={th}>Job Code</th>
                <th style={{ ...th, textAlign: 'right' }}>Hours</th>
                <th style={{ ...th, textAlign: 'right' }}>%</th>
              </tr>
            </thead>
            <tbody>
              {codeRows.map(r => (
                <tr key={r.code}>
                  <td style={td}>{r.code}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{fmt(r.hours)}</td>
                  <td style={{ ...td, textAlign: 'right', color: '#6b7280' }}>
                    {(r.hours / totalHours * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={td}>Total</td>
                <td style={{ ...td, textAlign: 'right' }}>{fmt(totalHours)}</td>
                <td style={{ ...td, textAlign: 'right' }}>100%</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mileage totals — full width */}
        {totalMileage > 0 && (
          <div className="table-card" style={{ gridColumn: '1 / -1' }}>
            <table>
              <thead>
                <tr>
                  <th style={th}>Mileage</th>
                  {mileageTotals.map(m => (
                    <th key={m.label} style={{ ...th, textAlign: 'right' }}>{m.label}</th>
                  ))}
                  <th style={{ ...th, textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={td}>Miles</td>
                  {mileageTotals.map(m => (
                    <td key={m.label} style={{ ...td, textAlign: 'right', color: m.total > 0 ? '#374151' : '#d1d5db' }}>
                      {m.total > 0 ? fmt(m.total) : '—'}
                    </td>
                  ))}
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: '#1b4332' }}>
                    {fmt(totalMileage)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  )
}
