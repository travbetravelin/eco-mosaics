-- Run this in the Supabase SQL editor (full reset — drops existing tables)

drop table if exists public.time_entries cascade;
drop table if exists public.shifts cascade;
drop table if exists public.projects cascade;
drop table if exists public.profiles cascade;

-- Profiles
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  role text not null default 'crew' check (role in ('crew', 'crew_lead', 'admin')),
  paychex_employee_id text,
  created_at timestamptz default now()
);

-- Projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean default true,
  created_at timestamptz default now()
);

-- Time entries (hours-based, not clock in/out)
create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  hours numeric(5,2) not null check (hours > 0),
  entry_type text not null check (entry_type in ('project', 'sick', 'wellness')),
  project_id uuid references public.projects(id),
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  logged_by uuid references public.profiles(id),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  admin_notes text,
  created_at timestamptz default now(),
  constraint project_entry_requires_project_id check (
    (entry_type = 'project' and project_id is not null) or
    (entry_type <> 'project')
  )
);

-- RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.time_entries enable row level security;

-- Profiles
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Projects (all authenticated can read; crew_lead+ can insert; admin can update/delete)
create policy "projects_select" on public.projects
  for select using (auth.uid() is not null);
create policy "projects_insert" on public.projects
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('crew_lead', 'admin'))
  );
create policy "projects_update" on public.projects
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Time entries
create policy "time_entries_select" on public.time_entries
  for select using (
    employee_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('crew_lead', 'admin'))
  );
create policy "time_entries_insert" on public.time_entries
  for insert with check (
    -- crew can log their own; crew_lead/admin can log for anyone
    employee_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('crew_lead', 'admin'))
  );
create policy "time_entries_update" on public.time_entries
  for update using (
    (employee_id = auth.uid() and status = 'pending')
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('crew_lead', 'admin'))
  );
create policy "time_entries_delete" on public.time_entries
  for delete using (
    (employee_id = auth.uid() and status = 'pending')
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('crew_lead', 'admin'))
  );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
