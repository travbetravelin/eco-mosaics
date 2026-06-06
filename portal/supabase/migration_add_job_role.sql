-- Migration: add job_role to profiles
-- Run in Supabase SQL Editor (does NOT drop existing data)

alter table public.profiles
add column if not exists job_role text check (
  job_role in ('CEO', 'Crew Lead', 'Key Crew', 'General Crew 2', 'General Crew 1', 'Tribal Crew', 'Wilbur Staff')
);
