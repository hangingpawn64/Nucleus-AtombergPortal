create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'active' check (status in ('active', 'pending', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  full_name text,
  first_name text,
  last_name text,
  mobile_number text,
  avatar_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  title text not null,
  body text,
  type text not null default 'info',
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  derived_full_name text;
begin
  derived_full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    ''
  );

  insert into public.users (id, email, status)
  values (new.id, coalesce(new.email, ''), 'active')
  on conflict (id) do nothing;

  insert into public.profiles (
    user_id,
    full_name,
    first_name,
    last_name,
    avatar_url
  )
  values (
    new.id,
    derived_full_name,
    nullif(coalesce(new.raw_user_meta_data->>'given_name', split_part(trim(derived_full_name), ' ', 1)), ''),
    nullif(coalesce(new.raw_user_meta_data->>'family_name', regexp_replace(trim(derived_full_name), '^\S+\s*', '')), ''),
    nullif(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_notifications_updated_at on public.notifications;
create trigger set_notifications_updated_at
before update on public.notifications
for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;

create policy "Users can read their own user row"
on public.users for select
using (auth.uid() = id);

create policy "Users can read their own profile"
on public.profiles for select
using (auth.uid() = user_id);

create policy "Users can insert their own profile"
on public.profiles for insert
with check (auth.uid() = user_id);

create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can read their own notifications"
on public.notifications for select
using (auth.uid() = user_id);

create policy "Users can update their own notifications"
on public.notifications for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can read their own activity"
on public.activity_logs for select
using (auth.uid() = actor_id);

-- Phase 1 Goal Portal Schema

create table if not exists public.goal_cycles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  quarter text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'closed', 'archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.goal_sheets (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.users(id) on delete cascade,
  manager_id uuid references public.users(id) on delete set null,
  cycle_id uuid not null references public.goal_cycles(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'rework', 'approved')),
  submitted_at timestamptz,
  approved_at timestamptz,
  locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(employee_id, cycle_id)
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  goal_sheet_id uuid not null references public.goal_sheets(id) on delete cascade,
  thrust_area text not null,
  title text not null,
  description text,
  uom_type text not null check (uom_type in ('min', 'max', 'timeline', 'zero')),
  target_value numeric,
  weightage numeric not null check (weightage >= 10),
  achievement_value numeric,
  status text not null default 'not_started' check (status in ('not_started', 'on_track', 'completed')),
  deadline date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goal_checkins (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  quarter text not null,
  planned_value numeric,
  actual_value numeric,
  progress_score numeric,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checkin_comments (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references public.goal_checkins(id) on delete cascade,
  manager_id uuid references public.users(id) on delete set null,
  comment text not null,
  created_at timestamptz not null default now()
);

-- Triggers for updated_at
drop trigger if exists set_goal_sheets_updated_at on public.goal_sheets;
create trigger set_goal_sheets_updated_at
before update on public.goal_sheets
for each row execute function public.set_updated_at();

drop trigger if exists set_goals_updated_at on public.goals;
create trigger set_goals_updated_at
before update on public.goals
for each row execute function public.set_updated_at();

drop trigger if exists set_goal_checkins_updated_at on public.goal_checkins;
create trigger set_goal_checkins_updated_at
before update on public.goal_checkins
for each row execute function public.set_updated_at();

-- RLS
alter table public.goal_cycles enable row level security;
alter table public.goal_sheets enable row level security;
alter table public.goals enable row level security;
alter table public.goal_checkins enable row level security;
alter table public.checkin_comments enable row level security;

create policy "Users can view active goal cycles"
on public.goal_cycles for select
using (status = 'active');

create policy "Admins can manage goal cycles"
on public.goal_cycles for all
using (
  exists (
    select 1 from public.users
    where users.id = auth.uid() and users.role = 'admin'
  )
);

create policy "Users can view their own goal sheets"
on public.goal_sheets for select
using (employee_id = auth.uid());

create policy "Users can insert their own goal sheets"
on public.goal_sheets for insert
with check (employee_id = auth.uid());

create policy "Users can update their own goal sheets"
on public.goal_sheets for update
using (employee_id = auth.uid());

create policy "Managers can view assigned goal sheets"
on public.goal_sheets for select
using (manager_id = auth.uid());

create policy "Admins can view all goal sheets"
on public.goal_sheets for select
using (
  exists (
    select 1 from public.users
    where users.id = auth.uid() and users.role = 'admin'
  )
);

create policy "Users can view goals of their sheets"
on public.goals for select
using (
  exists (
    select 1 from public.goal_sheets
    where goal_sheets.id = goals.goal_sheet_id
    and goal_sheets.employee_id = auth.uid()
  )
);

create policy "Users can insert goals to their sheets"
on public.goals for insert
with check (
  exists (
    select 1 from public.goal_sheets
    where goal_sheets.id = goal_sheet_id
    and goal_sheets.employee_id = auth.uid()
  )
);

create policy "Users can update goals of their sheets"
on public.goals for update
using (
  exists (
    select 1 from public.goal_sheets
    where goal_sheets.id = goals.goal_sheet_id
    and goal_sheets.employee_id = auth.uid()
  )
);

create policy "Users can delete goals of their sheets"
on public.goals for delete
using (
  exists (
    select 1 from public.goal_sheets
    where goal_sheets.id = goals.goal_sheet_id
    and goal_sheets.employee_id = auth.uid()
  )
);

create policy "Users can view their goal checkins"
on public.goal_checkins for select
using (
  exists (
    select 1 from public.goals
    join public.goal_sheets on public.goal_sheets.id = public.goals.goal_sheet_id
    where public.goals.id = goal_checkins.goal_id
    and public.goal_sheets.employee_id = auth.uid()
  )
);

-- =========================================================
-- PHASE 1 FIXES & RLS ADDITIONS
-- =========================================================

-- Activity Logs Policies

create policy "Users can insert their own activity logs"
on public.activity_logs
for insert
to authenticated
with check (auth.uid() = actor_id);

create policy "Users can view their own activity logs"
on public.activity_logs
for select
to authenticated
using (auth.uid() = actor_id);

-- Notifications Insert Policy

create policy "Users can insert their own notifications"
on public.notifications
for insert
to authenticated
with check (auth.uid() = user_id);

-- =========================================================
-- OPTIONAL DEMO SEED DATA
-- (KEEP IN seed.sql IF POSSIBLE)
-- =========================================================

insert into public.goal_cycles (
  name,
  quarter,
  start_date,
  end_date,
  status
)
values (
  'FY 2025 Goal Cycle',
  'Q1',
  '2025-05-01',
  '2025-07-31',
  'active'
)
on conflict do nothing;

-- =========================================================
-- OPTIONAL USER SYNC QUERY
-- RUN ONLY IF USERS TABLE IS MISSING AUTH USERS
-- =========================================================

insert into public.users (
  id,
  email,
  status,
  role
)
select
  id,
  email,
  'active',
  'member'
from auth.users
where id not in (
  select id from public.users
);

-- =========================================================
-- FUTURE ROLE MIGRATION (DO NOT RUN YET)
-- =========================================================
-- Save for later after manager workflow is complete.
--
-- alter table public.users
--   drop constraint if exists users_role_check;
--
-- alter table public.users
--   add constraint users_role_check
--   check (role in ('employee', 'manager', 'admin'));
--
-- update public.users
-- set role = 'employee'
-- where role = 'member';