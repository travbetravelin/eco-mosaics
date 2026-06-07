# Eco Mosaics — Employee Portal

Internal portal for field crew time tracking, payroll management, and operations reporting.

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 14 App Router (TypeScript) |
| Database / Auth | Supabase (PostgreSQL + RLS + triggers) |
| Charts | Recharts 3 |
| Styling | Global CSS (`app/globals.css`) — no Tailwind, no CSS modules |
| Deployment target | Vercel (Node.js server required — SSR + API routes) |

## Project Structure

```
portal/
  app/
    components/Nav.tsx        # Sticky header with mobile hamburger drawer
    globals.css               # All styles — single source of truth
    layout.tsx                # Root layout, viewport meta, global CSS import
    dashboard/                # Employee dashboard (log hours, recent entries)
    projects/                 # Project hours grid + summary + mileage
    payroll/                  # Payroll view + pay period management
    ops/                      # Ops metrics (charts + tables)
    admin/
      users/                  # Manage employees (create, edit, toggle active)
      projects/               # Manage projects (create, archive, lat/lng)
      timesheets/             # Admin timesheet review
    drive-time/               # Log Mobe / extra time
    account/                  # Change password
    api/
      create-user/route.ts    # Admin: create Supabase auth user + profile
      close-pay-period/route.ts
      toggle-user-active/route.ts
  lib/
    supabase.ts               # Browser client (anon key)
    supabase-server.ts        # Server component client (cookie-based auth)
    supabase-admin.ts         # Service role client (bypasses RLS)
    payroll.ts                # Payroll formulas, JOB_ROLE_ORDER, groupEmployees()
    payPeriod.ts              # 2-week period math, locking helpers
  supabase/
    schema.sql                # Initial schema (run once to reset)
    migration_*.sql           # Incremental migrations (run in order)
```

## Database Schema

### `profiles`
Extends `auth.users` (1:1, id = auth user id).
```
id uuid PK, full_name text NOT NULL, role text ('crew'|'crew_lead'|'admin'),
job_role text (nullable, see Job Roles below), paychex_employee_id text,
active boolean DEFAULT true, created_at timestamptz
```
Auto-created on signup via `handle_new_user()` trigger on `auth.users`.

### `projects`
```
id uuid PK, name text, active boolean DEFAULT true,
lat numeric(9,6), lng numeric(9,6), created_at timestamptz
```

### `time_entries`
Single table for all hour types.
```
id uuid PK, employee_id uuid → profiles, logged_by uuid → profiles,
date date, hours numeric(5,2) NOT NULL CHECK >0,
entry_type text ('project'|'sick'|'wellness'),
project_id uuid → projects (required when entry_type='project'),
job_code text, drive_category text ('to_hitch'|'on_hitch'|'from_hitch'),
mileage numeric(8,2), start_location text, end_location text,
job_role text,   ← snapshotted from profiles at INSERT time via trigger
status text ('pending'|'approved'|'rejected'),
notes text, admin_notes text,
reviewed_by uuid → profiles, reviewed_at timestamptz, created_at timestamptz
```

### `pay_periods`
Only closed periods have a row here. Open/future periods have no row.
```
id uuid PK, start_date date UNIQUE, end_date date,
closed_at timestamptz, closed_by uuid → profiles, created_at timestamptz
```

### `audit_logs`
Append-only. Written by `audit_trigger_fn()` on time_entries, profiles, projects, pay_periods.
```
id uuid PK, table_name text, record_id uuid, action text ('INSERT'|'UPDATE'|'DELETE'),
old_data jsonb, new_data jsonb, performed_at timestamptz
```

## Migrations (run in order against Supabase SQL editor)

1. `schema.sql` — full reset (drops + recreates everything)
2. `migration_add_active.sql` — adds `active` to profiles
3. `migration_add_job_role.sql` — adds `job_role` to profiles
4. `migration_job_code_drive_entries.sql` — adds job_code, drive fields to time_entries
5. `migration_pay_periods_and_audit.sql` — pay_periods table, audit_logs, audit triggers
6. `migration_audit_logs_fix.sql` — hardens audit trigger (EXCEPTION block + INSERT policy)
7. `migration_snapshot_job_role.sql` — adds job_role to time_entries + snapshot trigger
8. `migration_project_location.sql` — adds lat/lng to projects

## Auth & Roles

Three app roles stored on `profiles.role`:

| Role | Access |
|---|---|
| `crew` | Dashboard (log sick/wellness/mobe), view own entries |
| `crew_lead` | + Projects page, Timesheets, Ops |
| `admin` | + Payroll, Manage Projects, Manage Users, can edit locked periods |

Server pages check role and `redirect('/dashboard')` if insufficient.
API routes return 403 for unauthorized callers.

User creation uses the **service role** client (`supabase-admin.ts`) via `/api/create-user`.
All other server queries use the **cookie-based** server client (`supabase-server.ts`) with RLS.

## Pay Periods

Base date: **2025-01-01**. Periods are exactly 14 days, derived mathematically — no enumeration needed.

```typescript
// lib/payPeriod.ts
getPeriodStart(dateStr)     // floor((days since base) / 14) * 14 + base
getPeriodEnd(periodStart)   // +13 days
getCurrentPeriodStart()
isDateLocked(date, closedPeriodStarts)  // true if date falls in a closed period
```

A period is "closed" when an admin upserts a row into `pay_periods` with `closed_at` set.
Closed periods lock time entries for non-admins. Admins can always edit.

## Job Codes & Entry Types

**Entry types** (stored in `time_entries.entry_type`):
- `project` — field work, always linked to a project
- `sick` — sick leave
- `wellness` — wellness leave

**Job codes** (stored in `time_entries.job_code`):
- `Field` — default for project grid entries
- `Mobe` — drive time; also stores `drive_category`, `mileage`, `start_location`, `end_location`
- `Camp Set Up`, `Camp Tear Down`, `Shopping`, `Camp Maintenance` — other field codes
- `sick`, `wellness` — used as code fallback when `job_code` is NULL (entry_type used instead)

**Drive categories** (on Mobe entries):
- `to_hitch`, `on_hitch`, `from_hitch`

## Job Roles (crew hierarchy)

Defined in `lib/payroll.ts` as `JOB_ROLE_ORDER`:
```
CEO → Crew Lead → Key Crew → General Crew 2 → General Crew 1 → Tribal Crew → Wilbur Staff
```
Snapshotted onto `time_entries.job_role` at INSERT so promotions don't rewrite history.
Backfill SQL: `UPDATE time_entries te SET job_role = p.job_role FROM profiles p WHERE te.employee_id = p.id;`

## CSS & Styling Conventions

- **Single stylesheet**: `app/globals.css` — no component-level CSS files
- **Min font size**: `1rem` (16px) everywhere, no exceptions
- **Key utility classes**: `.page`, `.page-wide`, `.card`, `.table-card`, `.grid-container`, `.grid-table`, `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-sm`, `.badge`, `.alert`, `.row`, `.stack`, `.spacer`
- **Mobile breakpoint**: `max-width: 720px`
- **Nav**: sticky header (`.portal-header`), desktop nav hidden on mobile, hamburger drawer shown
- **Specificity rule**: `.portal-header .nav-desktop` (not just `.nav-desktop`) to beat `.portal-header nav`

## Key Patterns

**Server component data fetching:**
```typescript
const supabase = await createServerSupabaseClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
```

**Client mutations** use the browser client from `lib/supabase.ts`.

**Admin API calls** (user creation, privileged ops) use `createAdminClient()` which takes `SUPABASE_SERVICE_ROLE_KEY`.

**Tab components**: pass server-rendered `React.ReactNode` as props to client tab component; use `display: none` toggling (not conditional render) to avoid scroll-jump on tab switch.

**Project grid tab navigation**: `skipBlurRef = useRef(false)` suppresses the onBlur that fires when Tab moves focus, preventing double-save.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Running Locally

```bash
npm install
npm run dev        # starts on :3000 (or next available port)
```
