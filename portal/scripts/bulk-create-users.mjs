/**
 * Bulk create employees from a CSV file.
 *
 * Usage:
 *   node scripts/bulk-create-users.mjs employees.csv
 *
 * CSV format (first row must be the header):
 *   full_name,email,password,job_role,app_role,paychex_id
 *
 * - job_role: CEO | Crew Lead | Key Crew | General Crew 2 | General Crew 1 | Tribal Crew | Wilbur Staff
 * - app_role: crew | crew_lead | admin  (defaults to "crew" if blank)
 * - paychex_id: optional
 * - password: minimum 8 characters
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// Load .env.local manually
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')
try {
  const env = readFileSync(envPath, 'utf8')
  for (const line of env.split('\n')) {
    const [key, ...rest] = line.split('=')
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
  }
} catch {
  console.error('Could not read .env.local — make sure it exists in portal/')
  process.exit(1)
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const csvFile = process.argv[2]
if (!csvFile) {
  console.error('Usage: node scripts/bulk-create-users.mjs employees.csv')
  process.exit(1)
}

const csvPath = resolve(process.cwd(), csvFile)
const lines = readFileSync(csvPath, 'utf8').trim().split('\n')
const headers = lines[0].split(',').map(h => h.trim())
const rows = lines.slice(1).map(line => {
  const values = line.split(',').map(v => v.trim())
  return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
})

console.log(`\nCreating ${rows.length} employee(s)...\n`)

let created = 0
let failed = 0

for (const row of rows) {
  const { full_name, email, password, job_role, app_role, paychex_id } = row

  if (!full_name || !email || !password) {
    console.error(`  SKIP  ${email || '(no email)'} — missing required fields (full_name, email, password)`)
    failed++
    continue
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  })

  if (error) {
    console.error(`  FAIL  ${email} — ${error.message}`)
    failed++
    continue
  }

  await supabase.from('profiles').update({
    full_name,
    role: app_role || 'crew',
    job_role: job_role || null,
    paychex_employee_id: paychex_id || null,
  }).eq('id', data.user.id)

  console.log(`  OK    ${full_name} <${email}>  [${job_role || 'unassigned'}]`)
  created++
}

console.log(`\nDone. ${created} created, ${failed} failed.\n`)
