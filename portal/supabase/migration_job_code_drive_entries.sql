-- Migration: job codes + drive entries table
-- Run in Supabase SQL Editor (non-destructive)

-- Add job_code to time_entries (defaults to Field for all existing rows)
alter table public.time_entries
add column if not exists job_code text not null default 'Field';

-- Drive time / mileage entries
create table if not exists public.drive_entries (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.profiles(id) on delete cascade not null,
  submission_type text not null check (submission_type in ('initial', 'correction')),
  project_id uuid references public.projects(id),
  project_other text,
  category text not null check (category in ('to_hitch', 'from_hitch', 'on_hitch')),
  drive_date date not null,
  mobe_time numeric(5,2) not null check (mobe_time >= 0),
  extra_time numeric(5,2) not null default 0 check (extra_time >= 0),
  mileage numeric(8,2) not null check (mileage >= 0),
  start_location text not null,
  end_location text not null,
  notes text,
  logged_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.drive_entries enable row level security;

create policy "drive_entries_select" on public.drive_entries
  for select using (
    employee_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('crew_lead', 'admin'))
  );

create policy "drive_entries_insert" on public.drive_entries
  for insert with check (
    employee_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('crew_lead', 'admin'))
  );

create policy "drive_entries_update" on public.drive_entries
  for update using (
    employee_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('crew_lead', 'admin'))
  );
