begin;

-- Security hardening migration.
--
-- External RPC usage found in the application:
-- - Employees submit their own goal sheets through submit_goal_sheet(uuid).
-- - Managers approve submitted sheets through approve_goal_sheet(uuid, text).
-- - Managers request rework through request_goal_sheet_rework(uuid, text).
-- - Admins unlock approved/locked sheets through unlock_goal_sheet(uuid, text).
-- - Admins assign managers through assign_employee_manager(uuid, uuid).
--
-- Helper and trigger functions are not frontend API contracts. They are either
-- moved to the non-exposed private schema or left ungranted after the global
-- revoke below.

create schema if not exists private;

revoke usage on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

-- Revoke all existing public-schema function EXECUTE grants from frontend roles.
-- This intentionally does not preserve prior permissions.
do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  loop
    execute format('revoke execute on function %s from anon, authenticated', fn.signature);
  end loop;
end;
$$;

-- Anonymous users must not receive direct table access to application data.
revoke all privileges on all tables in schema public from anon;
revoke all privileges on all sequences in schema public from anon;

-- Rebuild authenticated table permissions from application behavior. RLS
-- remains the primary row-level boundary; these grants only permit operations
-- that the app actually performs.
revoke all privileges on all tables in schema public from authenticated;
revoke all privileges on all sequences in schema public from authenticated;

grant select, update on public.users to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.notifications to authenticated;
grant select, insert on public.activity_logs to authenticated;
grant select, insert, update on public.goal_cycles to authenticated;
grant select, insert, update on public.goal_sheets to authenticated;
grant select, insert, update, delete on public.goals to authenticated;
grant select, insert, update on public.goal_checkins to authenticated;
grant select, insert on public.checkin_comments to authenticated;
grant select on public.manager_relationships to authenticated;
grant select, insert on public.goal_review_comments to authenticated;

-- Private authorization helpers used by RLS and SECURITY DEFINER workflow RPCs.
-- They stay SECURITY DEFINER to avoid RLS recursion on users/relationships while
-- keeping their schema out of Supabase's public RPC surface.
create or replace function private.current_user_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function private.is_employee()
returns boolean
language sql
stable
security definer
set search_path = private, public, pg_temp
as $$
  select private.current_user_role() = 'employee'
$$;

create or replace function private.is_manager()
returns boolean
language sql
stable
security definer
set search_path = private, public, pg_temp
as $$
  select private.current_user_role() = 'manager'
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = private, public, pg_temp
as $$
  select private.current_user_role() = 'admin'
$$;

create or replace function private.active_manager_for_employee(p_employee_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select mr.manager_id
  from public.manager_relationships mr
  where mr.employee_id = p_employee_id
    and mr.status = 'active'
    and (mr.effective_to is null or mr.effective_to >= current_date)
  order by mr.created_at desc
  limit 1
$$;

create or replace function private.is_active_manager_of(p_employee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.manager_relationships mr
    where mr.employee_id = p_employee_id
      and mr.manager_id = auth.uid()
      and mr.status = 'active'
      and (mr.effective_to is null or mr.effective_to >= current_date)
  )
$$;

create or replace function private.can_view_goal_sheet(p_goal_sheet_id uuid)
returns boolean
language sql
stable
security definer
set search_path = private, public, pg_temp
as $$
  select exists (
    select 1
    from public.goal_sheets gs
    where gs.id = p_goal_sheet_id
      and (
        gs.employee_id = auth.uid()
        or gs.manager_id = auth.uid()
        or private.is_active_manager_of(gs.employee_id)
        or private.is_admin()
      )
  )
$$;

revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.current_user_role() to authenticated;
grant execute on function private.is_employee() to authenticated;
grant execute on function private.is_manager() to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.active_manager_for_employee(uuid) to authenticated;
grant execute on function private.is_active_manager_of(uuid) to authenticated;
grant execute on function private.can_view_goal_sheet(uuid) to authenticated;

-- Trigger functions do not need SECURITY DEFINER because the underlying RLS
-- policies and private helpers are sufficient for the app's write paths.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_goal_sheet_manager()
returns trigger
language plpgsql
security invoker
set search_path = private, public, pg_temp
as $$
begin
  if tg_op = 'INSERT' and new.manager_id is null then
    new.manager_id := private.active_manager_for_employee(new.employee_id);
  elsif tg_op = 'UPDATE' and new.employee_id is distinct from old.employee_id then
    new.manager_id := private.active_manager_for_employee(new.employee_id);
  end if;

  return new;
end;
$$;

create or replace function public.sync_active_manager_to_goal_sheets()
returns trigger
language plpgsql
security invoker
set search_path = private, public, pg_temp
as $$
declare
  target_employee uuid;
begin
  if tg_op = 'INSERT' then
    target_employee := new.employee_id;
  else
    target_employee := old.employee_id;
  end if;

  update public.goal_sheets
  set manager_id = private.active_manager_for_employee(target_employee)
  where employee_id = target_employee
    and status <> 'approved';

  return null;
end;
$$;

create or replace function public.prevent_locked_goal_edits()
returns trigger
language plpgsql
security invoker
set search_path = private, public, pg_temp
as $$
declare
  target_goal_sheet_id uuid;
  sheet_status text;
  sheet_locked boolean;
begin
  if tg_op = 'DELETE' then
    target_goal_sheet_id := old.goal_sheet_id;
  else
    target_goal_sheet_id := new.goal_sheet_id;
  end if;

  select status, locked
  into sheet_status, sheet_locked
  from public.goal_sheets
  where id = target_goal_sheet_id;

  if private.is_admin() then
    if tg_op = 'DELETE' then
      return old;
    end if;

    return new;
  end if;

  if sheet_locked or sheet_status not in ('draft', 'rework') then
    raise exception 'This goal sheet is locked and cannot be edited.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

-- Auth trigger must remain SECURITY DEFINER because it is invoked from auth.users
-- and creates rows in public.users/public.profiles.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
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

-- Keep public helper wrappers in place for database compatibility, but do not
-- grant them to anon/authenticated. Frontend code does not call them.
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = private, public, pg_temp
as $$
  select private.current_user_role()
$$;

create or replace function public.is_employee()
returns boolean
language sql
stable
security definer
set search_path = private, public, pg_temp
as $$
  select private.is_employee()
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = private, public, pg_temp
as $$
  select private.is_manager()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = private, public, pg_temp
as $$
  select private.is_admin()
$$;

create or replace function public.active_manager_for_employee(p_employee_id uuid)
returns uuid
language sql
stable
security definer
set search_path = private, public, pg_temp
as $$
  select private.active_manager_for_employee(p_employee_id)
$$;

create or replace function public.is_active_manager_of(p_employee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = private, public, pg_temp
as $$
  select private.is_active_manager_of(p_employee_id)
$$;

create or replace function public.can_view_goal_sheet(p_goal_sheet_id uuid)
returns boolean
language sql
stable
security definer
set search_path = private, public, pg_temp
as $$
  select private.can_view_goal_sheet(p_goal_sheet_id)
$$;

-- Workflow RPCs must remain SECURITY DEFINER because they perform controlled
-- multi-table transitions, write notifications/activity for other users, and
-- lock/unlock sheets atomically. Role checks inside each RPC enforce least
-- privilege after the single authenticated grant below.
create or replace function public.submit_goal_sheet(p_goal_sheet_id uuid)
returns public.goal_sheets
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
  v_sheet public.goal_sheets%rowtype;
  v_updated public.goal_sheets%rowtype;
  v_goal_count integer;
  v_total_weightage numeric;
  v_manager_id uuid;
  v_action text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated.';
  end if;

  select * into v_sheet
  from public.goal_sheets
  where id = p_goal_sheet_id
  for update;

  if not found then
    raise exception 'Goal sheet not found.';
  end if;

  if v_sheet.employee_id <> auth.uid() then
    raise exception 'You can only submit your own goal sheet.';
  end if;

  if v_sheet.status not in ('draft', 'rework') then
    raise exception 'Only draft or rework goal sheets can be submitted.';
  end if;

  select count(*), coalesce(sum(weightage), 0)
  into v_goal_count, v_total_weightage
  from public.goals
  where goal_sheet_id = p_goal_sheet_id;

  if v_goal_count = 0 then
    raise exception 'Add at least one goal before submitting.';
  end if;

  if v_goal_count > 8 then
    raise exception 'A goal sheet cannot contain more than 8 goals.';
  end if;

  if v_total_weightage <> 100 then
    raise exception 'Total goal weightage must equal 100%%.';
  end if;

  v_manager_id := coalesce(v_sheet.manager_id, private.active_manager_for_employee(v_sheet.employee_id));

  if v_manager_id is null then
    raise exception 'A manager must be assigned before this goal sheet can be submitted.';
  end if;

  v_action := case
    when v_sheet.status = 'rework' then 'resubmitted_goal_sheet'
    else 'submitted_goal_sheet'
  end;

  update public.goal_sheets
  set
    manager_id = v_manager_id,
    status = 'submitted',
    submitted_at = now(),
    approved_at = null,
    reviewed_by = null,
    reviewed_at = null,
    locked = true
  where id = p_goal_sheet_id
  returning * into v_updated;

  insert into public.activity_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    v_action,
    'goal_sheets',
    p_goal_sheet_id::text,
    jsonb_build_object('cycle_id', v_sheet.cycle_id, 'manager_id', v_manager_id)
  );

  insert into public.notifications (user_id, title, body, type, metadata)
  values
    (
      auth.uid(),
      case when v_action = 'resubmitted_goal_sheet' then 'Goal Sheet Resubmitted' else 'Goal Sheet Submitted' end,
      'Your goal sheet is now waiting for manager review.',
      'success',
      jsonb_build_object('goal_sheet_id', p_goal_sheet_id)
    ),
    (
      v_manager_id,
      case when v_action = 'resubmitted_goal_sheet' then 'Goal Sheet Resubmitted' else 'Goal Sheet Submitted' end,
      'A team member submitted goals for review.',
      'info',
      jsonb_build_object('goal_sheet_id', p_goal_sheet_id, 'employee_id', auth.uid())
    );

  return v_updated;
end;
$$;

create or replace function public.approve_goal_sheet(
  p_goal_sheet_id uuid,
  p_comment text default null
)
returns public.goal_sheets
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
  v_sheet public.goal_sheets%rowtype;
  v_updated public.goal_sheets%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated.';
  end if;

  select * into v_sheet
  from public.goal_sheets
  where id = p_goal_sheet_id
  for update;

  if not found then
    raise exception 'Goal sheet not found.';
  end if;

  if not private.is_admin()
    and v_sheet.manager_id <> auth.uid()
    and not private.is_active_manager_of(v_sheet.employee_id) then
    raise exception 'Only the assigned manager can approve this goal sheet.';
  end if;

  if v_sheet.status <> 'submitted' then
    raise exception 'Only submitted goal sheets can be approved.';
  end if;

  update public.goal_sheets
  set
    status = 'approved',
    approved_at = now(),
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    locked = true
  where id = p_goal_sheet_id
  returning * into v_updated;

  if nullif(trim(coalesce(p_comment, '')), '') is not null then
    insert into public.goal_review_comments (goal_sheet_id, author_id, comment, comment_type)
    values (p_goal_sheet_id, auth.uid(), trim(p_comment), 'approval');
  end if;

  insert into public.activity_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'approved_goal_sheet',
    'goal_sheets',
    p_goal_sheet_id::text,
    jsonb_build_object('employee_id', v_sheet.employee_id, 'cycle_id', v_sheet.cycle_id)
  );

  insert into public.activity_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'locked_goal_sheet',
    'goal_sheets',
    p_goal_sheet_id::text,
    jsonb_build_object('employee_id', v_sheet.employee_id, 'cycle_id', v_sheet.cycle_id)
  );

  insert into public.notifications (user_id, title, body, type, metadata)
  values (
    v_sheet.employee_id,
    'Goals Approved',
    'Your manager approved your goal sheet. The sheet is now locked.',
    'success',
    jsonb_build_object('goal_sheet_id', p_goal_sheet_id)
  );

  return v_updated;
end;
$$;

create or replace function public.request_goal_sheet_rework(
  p_goal_sheet_id uuid,
  p_comment text
)
returns public.goal_sheets
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
  v_sheet public.goal_sheets%rowtype;
  v_updated public.goal_sheets%rowtype;
  v_comment text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated.';
  end if;

  v_comment := nullif(trim(coalesce(p_comment, '')), '');

  if v_comment is null then
    raise exception 'A manager comment is required when requesting rework.';
  end if;

  select * into v_sheet
  from public.goal_sheets
  where id = p_goal_sheet_id
  for update;

  if not found then
    raise exception 'Goal sheet not found.';
  end if;

  if not private.is_admin()
    and v_sheet.manager_id <> auth.uid()
    and not private.is_active_manager_of(v_sheet.employee_id) then
    raise exception 'Only the assigned manager can request rework.';
  end if;

  if v_sheet.status <> 'submitted' then
    raise exception 'Only submitted goal sheets can be sent for rework.';
  end if;

  update public.goal_sheets
  set
    status = 'rework',
    approved_at = null,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    locked = false
  where id = p_goal_sheet_id
  returning * into v_updated;

  insert into public.goal_review_comments (goal_sheet_id, author_id, comment, comment_type)
  values (p_goal_sheet_id, auth.uid(), v_comment, 'rework');

  insert into public.activity_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'requested_goal_rework',
    'goal_sheets',
    p_goal_sheet_id::text,
    jsonb_build_object('employee_id', v_sheet.employee_id, 'cycle_id', v_sheet.cycle_id)
  );

  insert into public.notifications (user_id, title, body, type, metadata)
  values (
    v_sheet.employee_id,
    'Goals Need Rework',
    v_comment,
    'warning',
    jsonb_build_object('goal_sheet_id', p_goal_sheet_id)
  );

  return v_updated;
end;
$$;

create or replace function public.unlock_goal_sheet(
  p_goal_sheet_id uuid,
  p_comment text default null
)
returns public.goal_sheets
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
  v_sheet public.goal_sheets%rowtype;
  v_updated public.goal_sheets%rowtype;
  v_comment text;
begin
  if not private.is_admin() then
    raise exception 'Only admins can unlock approved goal sheets.';
  end if;

  v_comment := nullif(trim(coalesce(p_comment, '')), '');

  select * into v_sheet
  from public.goal_sheets
  where id = p_goal_sheet_id
  for update;

  if not found then
    raise exception 'Goal sheet not found.';
  end if;

  if v_sheet.status <> 'approved' and not v_sheet.locked then
    raise exception 'Only locked or approved goal sheets can be unlocked.';
  end if;

  update public.goal_sheets
  set
    status = 'rework',
    approved_at = null,
    unlocked_by = auth.uid(),
    unlocked_at = now(),
    locked = false
  where id = p_goal_sheet_id
  returning * into v_updated;

  insert into public.goal_review_comments (goal_sheet_id, author_id, comment, comment_type)
  values (
    p_goal_sheet_id,
    auth.uid(),
    coalesce(v_comment, 'Admin unlocked this goal sheet for edits.'),
    'unlock'
  );

  insert into public.activity_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'unlocked_goal_sheet',
    'goal_sheets',
    p_goal_sheet_id::text,
    jsonb_build_object('employee_id', v_sheet.employee_id, 'manager_id', v_sheet.manager_id)
  );

  insert into public.notifications (user_id, title, body, type, metadata)
  values (
    v_sheet.employee_id,
    'Goal Sheet Unlocked',
    coalesce(v_comment, 'An admin unlocked your approved goal sheet for edits.'),
    'info',
    jsonb_build_object('goal_sheet_id', p_goal_sheet_id)
  );

  if v_sheet.manager_id is not null then
    insert into public.notifications (user_id, title, body, type, metadata)
    values (
      v_sheet.manager_id,
      'Approved Goal Sheet Unlocked',
      'An admin unlocked a goal sheet from your team.',
      'info',
      jsonb_build_object('goal_sheet_id', p_goal_sheet_id, 'employee_id', v_sheet.employee_id)
    );
  end if;

  return v_updated;
end;
$$;

create or replace function public.assign_employee_manager(
  p_employee_id uuid,
  p_manager_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
  v_relationship_id uuid;
  v_employee_role text;
  v_manager_role text;
begin
  if not private.is_admin() then
    raise exception 'Only admins can assign managers.';
  end if;

  select role into v_employee_role
  from public.users
  where id = p_employee_id;

  if v_employee_role is null then
    raise exception 'Employee user not found.';
  end if;

  if v_employee_role <> 'employee' then
    raise exception 'Managers can only be assigned to employee users.';
  end if;

  if p_manager_id is not null then
    select role into v_manager_role
    from public.users
    where id = p_manager_id;

    if v_manager_role <> 'manager' then
      raise exception 'Selected manager must have the manager role.';
    end if;
  end if;

  update public.manager_relationships
  set
    status = 'inactive',
    effective_to = current_date,
    updated_at = now()
  where employee_id = p_employee_id
    and status = 'active'
    and effective_to is null;

  if p_manager_id is null then
    update public.goal_sheets
    set manager_id = null
    where employee_id = p_employee_id
      and status <> 'approved';
    return null;
  end if;

  insert into public.manager_relationships (
    employee_id,
    manager_id,
    assigned_by,
    status,
    effective_from
  )
  values (
    p_employee_id,
    p_manager_id,
    auth.uid(),
    'active',
    current_date
  )
  returning id into v_relationship_id;

  update public.goal_sheets
  set manager_id = p_manager_id
  where employee_id = p_employee_id
    and status <> 'approved';

  insert into public.activity_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'assigned_manager',
    'users',
    p_employee_id::text,
    jsonb_build_object('manager_id', p_manager_id)
  );

  return v_relationship_id;
end;
$$;

-- RLS policy replacement. Policies reference private helpers, so public helper
-- RPCs no longer need to be executable by frontend roles.
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;
alter table public.goal_cycles enable row level security;
alter table public.goal_sheets enable row level security;
alter table public.goals enable row level security;
alter table public.goal_checkins enable row level security;
alter table public.checkin_comments enable row level security;
alter table public.manager_relationships enable row level security;
alter table public.goal_review_comments enable row level security;

drop policy if exists "Users can read their own user row" on public.users;
drop policy if exists "Users can read accessible user rows" on public.users;
drop policy if exists "Users can read assigned manager user rows" on public.users;
drop policy if exists "Admins can update users" on public.users;

create policy "Users can read accessible user rows"
on public.users for select
to authenticated
using (
  id = auth.uid()
  or private.is_admin()
  or private.is_active_manager_of(id)
  or exists (
    select 1
    from public.manager_relationships mr
    where mr.employee_id = auth.uid()
      and mr.manager_id = users.id
      and mr.status = 'active'
      and (mr.effective_to is null or mr.effective_to >= current_date)
  )
);

create policy "Admins can update users"
on public.users for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can read accessible profiles" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can read assigned manager profiles" on public.profiles;

create policy "Users can read accessible profiles"
on public.profiles for select
to authenticated
using (
  user_id = auth.uid()
  or private.is_admin()
  or private.is_active_manager_of(user_id)
  or exists (
    select 1
    from public.manager_relationships mr
    where mr.employee_id = auth.uid()
      and mr.manager_id = profiles.user_id
      and mr.status = 'active'
      and (mr.effective_to is null or mr.effective_to >= current_date)
  )
);

create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Admins can manage manager relationships" on public.manager_relationships;
drop policy if exists "Users can read relevant manager relationships" on public.manager_relationships;

create policy "Users can read relevant manager relationships"
on public.manager_relationships for select
to authenticated
using (
  employee_id = auth.uid()
  or manager_id = auth.uid()
  or private.is_admin()
);

create policy "Admins can manage manager relationships"
on public.manager_relationships for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "Users can read their own notifications" on public.notifications;
drop policy if exists "Users can update their own notifications" on public.notifications;
drop policy if exists "Users can insert their own notifications" on public.notifications;
drop policy if exists "Users can read own notifications" on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;
drop policy if exists "Users can insert own notifications" on public.notifications;

create policy "Users can read own notifications"
on public.notifications for select
to authenticated
using (user_id = auth.uid());

create policy "Users can update own notifications"
on public.notifications for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can insert own notifications"
on public.notifications for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can read their own activity" on public.activity_logs;
drop policy if exists "Users can insert their own activity logs" on public.activity_logs;
drop policy if exists "Users can view their own activity logs" on public.activity_logs;
drop policy if exists "Users can read relevant activity logs" on public.activity_logs;
drop policy if exists "Users can insert own activity logs" on public.activity_logs;

create policy "Users can read relevant activity logs"
on public.activity_logs for select
to authenticated
using (
  actor_id = auth.uid()
  or private.is_admin()
  or private.is_active_manager_of(actor_id)
);

create policy "Users can insert own activity logs"
on public.activity_logs for insert
to authenticated
with check (actor_id = auth.uid());

drop policy if exists "Users can view active goal cycles" on public.goal_cycles;
drop policy if exists "Admins can manage goal cycles" on public.goal_cycles;
drop policy if exists "Authenticated users can view goal cycles" on public.goal_cycles;
drop policy if exists "Users can view relevant goal cycles" on public.goal_cycles;

create policy "Users can view relevant goal cycles"
on public.goal_cycles for select
to authenticated
using (
  status = 'active'
  or private.is_admin()
  or exists (
    select 1
    from public.goal_sheets gs
    where gs.cycle_id = goal_cycles.id
      and (
        gs.employee_id = auth.uid()
        or gs.manager_id = auth.uid()
        or private.is_active_manager_of(gs.employee_id)
      )
  )
);

create policy "Admins can manage goal cycles"
on public.goal_cycles for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "Users can view their own goal sheets" on public.goal_sheets;
drop policy if exists "Users can insert their own goal sheets" on public.goal_sheets;
drop policy if exists "Users can update their own goal sheets" on public.goal_sheets;
drop policy if exists "Managers can view assigned goal sheets" on public.goal_sheets;
drop policy if exists "Admins can view all goal sheets" on public.goal_sheets;
drop policy if exists "Users can view accessible goal sheets" on public.goal_sheets;
drop policy if exists "Users can insert own draft goal sheets" on public.goal_sheets;
drop policy if exists "Users can update editable own goal sheets" on public.goal_sheets;
drop policy if exists "Admins can manage goal sheets" on public.goal_sheets;

create policy "Users can view accessible goal sheets"
on public.goal_sheets for select
to authenticated
using (
  employee_id = auth.uid()
  or manager_id = auth.uid()
  or private.is_active_manager_of(employee_id)
  or private.is_admin()
);

create policy "Users can insert own draft goal sheets"
on public.goal_sheets for insert
to authenticated
with check (
  employee_id = auth.uid()
  and status = 'draft'
  and locked = false
);

create policy "Users can update editable own goal sheets"
on public.goal_sheets for update
to authenticated
using (
  employee_id = auth.uid()
  and status in ('draft', 'rework')
  and locked = false
)
with check (
  employee_id = auth.uid()
  and status in ('draft', 'rework')
  and locked = false
);

create policy "Admins can manage goal sheets"
on public.goal_sheets for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "Users can view goals of their sheets" on public.goals;
drop policy if exists "Users can insert goals to their sheets" on public.goals;
drop policy if exists "Users can update goals of their sheets" on public.goals;
drop policy if exists "Users can delete goals of their sheets" on public.goals;
drop policy if exists "Users can view accessible goals" on public.goals;
drop policy if exists "Users can insert editable own goals" on public.goals;
drop policy if exists "Users can update editable own goals" on public.goals;
drop policy if exists "Users can delete editable own goals" on public.goals;
drop policy if exists "Admins can manage goals" on public.goals;

create policy "Users can view accessible goals"
on public.goals for select
to authenticated
using (private.can_view_goal_sheet(goal_sheet_id));

create policy "Users can insert editable own goals"
on public.goals for insert
to authenticated
with check (
  exists (
    select 1
    from public.goal_sheets gs
    where gs.id = goal_sheet_id
      and gs.employee_id = auth.uid()
      and gs.status in ('draft', 'rework')
      and gs.locked = false
  )
);

create policy "Users can update editable own goals"
on public.goals for update
to authenticated
using (
  exists (
    select 1
    from public.goal_sheets gs
    where gs.id = goals.goal_sheet_id
      and gs.employee_id = auth.uid()
      and gs.status in ('draft', 'rework')
      and gs.locked = false
  )
)
with check (
  exists (
    select 1
    from public.goal_sheets gs
    where gs.id = goal_sheet_id
      and gs.employee_id = auth.uid()
      and gs.status in ('draft', 'rework')
      and gs.locked = false
  )
);

create policy "Users can delete editable own goals"
on public.goals for delete
to authenticated
using (
  exists (
    select 1
    from public.goal_sheets gs
    where gs.id = goals.goal_sheet_id
      and gs.employee_id = auth.uid()
      and gs.status in ('draft', 'rework')
      and gs.locked = false
  )
);

create policy "Admins can manage goals"
on public.goals for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "Users can view their goal checkins" on public.goal_checkins;
drop policy if exists "Users can view accessible goal checkins" on public.goal_checkins;
drop policy if exists "Users can manage own goal checkins" on public.goal_checkins;
drop policy if exists "Users can insert own goal checkins" on public.goal_checkins;
drop policy if exists "Users can update own goal checkins" on public.goal_checkins;

create policy "Users can view accessible goal checkins"
on public.goal_checkins for select
to authenticated
using (
  exists (
    select 1
    from public.goals g
    join public.goal_sheets gs on gs.id = g.goal_sheet_id
    where g.id = goal_checkins.goal_id
      and (
        gs.employee_id = auth.uid()
        or gs.manager_id = auth.uid()
        or private.is_active_manager_of(gs.employee_id)
        or private.is_admin()
      )
  )
);

create policy "Users can insert own goal checkins"
on public.goal_checkins for insert
to authenticated
with check (
  exists (
    select 1
    from public.goals g
    join public.goal_sheets gs on gs.id = g.goal_sheet_id
    where g.id = goal_id
      and gs.employee_id = auth.uid()
  )
);

create policy "Users can update own goal checkins"
on public.goal_checkins for update
to authenticated
using (
  exists (
    select 1
    from public.goals g
    join public.goal_sheets gs on gs.id = g.goal_sheet_id
    where g.id = goal_checkins.goal_id
      and gs.employee_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.goals g
    join public.goal_sheets gs on gs.id = g.goal_sheet_id
    where g.id = goal_id
      and gs.employee_id = auth.uid()
  )
);

drop policy if exists "Users can view accessible checkin comments" on public.checkin_comments;
drop policy if exists "Managers can insert checkin comments" on public.checkin_comments;

create policy "Users can view accessible checkin comments"
on public.checkin_comments for select
to authenticated
using (
  exists (
    select 1
    from public.goal_checkins gc
    join public.goals g on g.id = gc.goal_id
    join public.goal_sheets gs on gs.id = g.goal_sheet_id
    where gc.id = checkin_comments.checkin_id
      and (
        gs.employee_id = auth.uid()
        or gs.manager_id = auth.uid()
        or private.is_active_manager_of(gs.employee_id)
        or private.is_admin()
      )
  )
);

create policy "Managers can insert checkin comments"
on public.checkin_comments for insert
to authenticated
with check (
  private.is_admin()
  or exists (
    select 1
    from public.goal_checkins gc
    join public.goals g on g.id = gc.goal_id
    join public.goal_sheets gs on gs.id = g.goal_sheet_id
    where gc.id = checkin_id
      and (
        gs.manager_id = auth.uid()
        or private.is_active_manager_of(gs.employee_id)
      )
  )
);

drop policy if exists "Users can view visible review comments" on public.goal_review_comments;
drop policy if exists "Managers can insert review comments" on public.goal_review_comments;

create policy "Users can view visible review comments"
on public.goal_review_comments for select
to authenticated
using (private.can_view_goal_sheet(goal_sheet_id));

create policy "Managers can insert review comments"
on public.goal_review_comments for insert
to authenticated
with check (
  private.is_admin()
  or exists (
    select 1
    from public.goal_sheets gs
    where gs.id = goal_sheet_id
      and (
        gs.manager_id = auth.uid()
        or private.is_active_manager_of(gs.employee_id)
      )
  )
);

-- Only authenticated users can call frontend RPC contracts. App role checks
-- inside each SECURITY DEFINER function decide employee/manager/admin access.
grant execute on function public.submit_goal_sheet(uuid) to authenticated;
grant execute on function public.approve_goal_sheet(uuid, text) to authenticated;
grant execute on function public.request_goal_sheet_rework(uuid, text) to authenticated;
grant execute on function public.unlock_goal_sheet(uuid, text) to authenticated;
grant execute on function public.assign_employee_manager(uuid, uuid) to authenticated;

-- Repeat the revokes after function replacement because CREATE OR REPLACE can
-- preserve owner/default ACL behavior. Do not expose internal public helpers.
revoke execute on function public.handle_new_auth_user() from anon, authenticated;
revoke execute on function public.set_updated_at() from anon, authenticated;
revoke execute on function public.set_goal_sheet_manager() from anon, authenticated;
revoke execute on function public.sync_active_manager_to_goal_sheets() from anon, authenticated;
revoke execute on function public.prevent_locked_goal_edits() from anon, authenticated;
revoke execute on function public.current_user_role() from anon, authenticated;
revoke execute on function public.is_employee() from anon, authenticated;
revoke execute on function public.is_manager() from anon, authenticated;
revoke execute on function public.is_admin() from anon, authenticated;
revoke execute on function public.active_manager_for_employee(uuid) from anon, authenticated;
revoke execute on function public.is_active_manager_of(uuid) from anon, authenticated;
revoke execute on function public.can_view_goal_sheet(uuid) from anon, authenticated;

commit;
