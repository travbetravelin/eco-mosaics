'use client'

interface Project { id: string; name: string }

export default function ProjectPicker({ projects, selected }: { projects: Project[]; selected: string }) {
  return (
    <select
      value={selected}
      onChange={e => {
        const url = new URL(window.location.href)
        url.searchParams.set('project', e.target.value)
        window.location.href = url.toString()
      }}
      style={{ minWidth: 200 }}
    >
      <option value="">Select project…</option>
      {projects.map(p => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  )
}
