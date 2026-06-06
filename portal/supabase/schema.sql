-- Run this in your Supabase SQL editor after creating a project

-- Extend auth.users with profile data
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  role text not null default 'employee' check (role in ('employee', 'manager', 'admin')),
  paychex_employee_id text,
  created_at timestamptz default now()
);

-- Shifts (created by managers/admin)
create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.profiles(id) on delete cascade not null,
  created_by uuid references public.profiles(id) not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  notes text,
  created_at timestamptz default now()
);

-- Time entries (employees clock in/out; admin approves)
create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.profiles(id) on delete cascade not null,
  shift_id uuid references public.shifts(id),
  clocked_in_at timestamptz not null,
  clocked_out_at timestamptz,
  break_minutes int default 0,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  admin_notes text,
  created_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.shifts enable row level security;
alter table public.time_entries enable row level security;

-- Profiles: users can read all, only update their own
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Shifts: all authenticated users can read; only managers/admin can insert/update
create policy "shifts_select" on public.shifts for select using (auth.uid() is not null);
create policy "shifts_insert" on public.shifts for insert
  with check (exists (
    select 1 from public.profiles where id = auth.uid() and role in ('manager', 'admin')
  ));
create policy "shifts_update" on public.shifts for update
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role in ('manager', 'admin')
  ));

-- Time entries: employees see own; managers/admin see all
create policy "time_entries_select_own" on public.time_entries for select
  using (
    employee_id = auth.uid()
    or exists (
      select 1 from public.profiles where id = auth.uid() and role in ('manager', 'admin')
    )
  );
create policy "time_entries_insert_own" on public.time_entries for insert
  with check (employee_id = auth.uid());
create policy "time_entries_update" on public.time_entries for update
  using (
    -- employees can update their own pending entries (e.g. clock out)
    (employee_id = auth.uid() and status = 'pending')
    or exists (
      select 1 from public.profiles where id = auth.uid() and role in ('manager', 'admin')
    )
  );

-- Auto-create profile on signup (trigger)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
