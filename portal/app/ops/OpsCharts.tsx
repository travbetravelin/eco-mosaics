'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from 'recharts'
// Cell kept for role-colored bars in the hours-by-role chart

const ROLE_COLORS: Record<string, string> = {
  'CEO':            '#1b4332',
  'Crew Lead':      '#1e3a5f',
  'Key Crew':       '#155e75',
  'General Crew 2': '#3d5a1e',
  'General Crew 1': '#4a7c35',
  'Tribal Crew':    '#7c3d28',
  'Wilbur Staff':   '#4a1d6b',
  'Unassigned':     '#6b7280',
}


function fmt(n: number) {
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

interface HoursRoleRow { role: string; hours: number }
interface HoursCodeRow { code: string; [role: string]: number | string }
interface MileageStat { category: string; total: number; avg: number; median: number }

interface Props {
  hoursRoleData: HoursRoleRow[]
  hoursCodeData: HoursCodeRow[]
  roles: string[]
  mileageStats: MileageStat[]
}

const chartStyle = { fontSize: '13px' }
const thStyle: React.CSSProperties = { padding: '7px 12px' }
const tdStyle: React.CSSProperties = { padding: '6px 12px' }

export default function OpsCharts({ hoursRoleData, hoursCodeData, roles, mileageStats }: Props) {
  const hasMileage = mileageStats.some(s => s.total > 0)
  const hasHours = hoursRoleData.some(r => r.hours > 0)
  const hasCodeData = hoursCodeData.length > 0

  const roleTotalHours = hoursRoleData.reduce((s, r) => s + r.hours, 0)
  const codeTotals = hoursCodeData.map(row => ({
    code: row.code as string,
    hours: Object.entries(row).filter(([k]) => k !== 'code').reduce((s, [, v]) => s + Number(v), 0),
  }))
  const codeTotalHours = codeTotals.reduce((s, r) => s + r.hours, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Hours by Role + Hours by Job Code — side by side */}
      {(hasHours || hasCodeData) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

          {/* Hours by Role */}
          {hasHours && (
            <section>
              <h2 style={{ marginBottom: 12 }}>Hours by Job Role</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>
                <div className="card" style={{ padding: 16 }}>
                  <ResponsiveContainer width="100%" height={Math.max(140, hoursRoleData.length * 32)}>
                    <BarChart data={hoursRoleData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={chartStyle} tickFormatter={fmt} />
                      <YAxis type="category" dataKey="role" width={110} tick={chartStyle} />
                      <Tooltip formatter={(v) => [fmt(Number(v)), 'Hours']} />
                      <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
                        {hoursRoleData.map(row => (
                          <Cell key={row.role} fill={ROLE_COLORS[row.role] ?? '#6b7280'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="table-card">
                  <table>
                    <thead>
                      <tr>
                        <th style={thStyle}>Role</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Hrs</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hoursRoleData.map(row => (
                        <tr key={row.role}>
                          <td style={tdStyle}>{row.role}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(row.hours)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', color: '#6b7280' }}>{(row.hours / roleTotalHours * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td style={tdStyle}>Total</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(roleTotalHours)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* Hours by Job Code */}
          {hasCodeData && (
            <section>
              <h2 style={{ marginBottom: 12 }}>Hours by Job Code</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>
                <div className="card" style={{ padding: 16 }}>
                  <ResponsiveContainer width="100%" height={Math.max(140, hoursRoleData.length * 32)}>
                    <BarChart data={hoursCodeData} margin={{ left: 4, right: 12, top: 4, bottom: 28 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="code" tick={chartStyle} angle={-20} textAnchor="end" interval={0} />
                      <YAxis tick={chartStyle} tickFormatter={fmt} width={32} />
                      <Tooltip formatter={(v) => [fmt(Number(v)), 'Hours']} />
                      <Legend wrapperStyle={chartStyle} />
                      {roles.map(role => (
                        <Bar key={role} dataKey={role} stackId="a"
                          fill={ROLE_COLORS[role] ?? '#6b7280'}
                          radius={roles.indexOf(role) === roles.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="table-card">
                  <table>
                    <thead>
                      <tr>
                        <th style={thStyle}>Code</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Hrs</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {codeTotals.map(row => (
                        <tr key={row.code}>
                          <td style={tdStyle}>{row.code}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(row.hours)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', color: '#6b7280' }}>{(row.hours / codeTotalHours * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td style={tdStyle}>Total</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(codeTotalHours)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </section>
          )}

        </div>
      )}

      {/* Mileage */}
      {hasMileage && (
        <section>
          <h2 style={{ marginBottom: 20 }}>Mileage</h2>
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th></th>
                  {mileageStats.map(s => <th key={s.category} style={{ textAlign: 'center' }}>{s.category}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 500 }}>Total Miles</td>
                  {mileageStats.map(s => (
                    <td key={s.category} style={{ textAlign: 'center' }}>{fmt(s.total)}</td>
                  ))}
                </tr>
                <tr>
                  <td style={{ fontWeight: 500 }}>Avg per Entry</td>
                  {mileageStats.map(s => (
                    <td key={s.category} style={{ textAlign: 'center' }}>{fmt(s.avg)}</td>
                  ))}
                </tr>
                <tr>
                  <td style={{ fontWeight: 500 }}>Median per Entry</td>
                  {mileageStats.map(s => (
                    <td key={s.category} style={{ textAlign: 'center' }}>{fmt(s.median)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!hasHours && !hasMileage && (
        <div className="card" style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>
          No data yet. Hours and mileage will appear here once entries are logged.
        </div>
      )}
    </div>
  )
}
