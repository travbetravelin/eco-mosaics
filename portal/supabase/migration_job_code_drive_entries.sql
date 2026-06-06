-- Migration: job codes and drive fields on time_entries
-- Run in Supabase SQL Editor (non-destructive)

-- Job code on all time entries (Field is default for project page entries)
alter table public.time_entries
add column if not exists job_code text;

-- Drive-specific fields (only populated when job_code = 'Mobe')
alter table public.time_entries
add column if not exists drive_category text check (
  drive_category in ('to_hitch', 'from_hitch', 'on_hitch')
);
alter table public.time_entries
add column if not exists mileage numeric(8,2);
alter table public.time_entries
add column if not exists start_location text;
alter table public.time_entries
add column if not exists end_location text;
