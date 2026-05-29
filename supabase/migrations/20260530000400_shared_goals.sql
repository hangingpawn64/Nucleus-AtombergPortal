begin;

create table if not exists public.shared_goals (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.goal_cycles(id) on delete cascade,
  created_by uuid references public.users(id) on delete set null,
  primary_owner_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  thrust_area text not null,
  description text,
  uom_type text not null check (uom_type in ('min', 'max', 'timeline', 'zero')),
  target_value numeric,
  deadline date,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.goals
  add column if not exists shared_goal_id uuid references public.shared_goals(id) on delete restrict,
  add column if not exists shared_goal_primary boolean not null default false;

create unique index if not exists goals_one_shared_goal_per_sheet_idx
on public.goals (goal_sheet_id, shared_goal_id)
where shared_goal_id is not null;

drop trigger if exists set_shared_goals_updated_at on public.shared_goals;
create trigger set_shared_goals_updated_at
before update on public.shared_goals
for each row execute function public.set_updated_at();

alter table public.shared_goals enable row level security;

grant select on public.shared_goals to authenticated;

drop policy if exists "Users can view relevant shared goals" on public.shared_goals;

create policy "Users can view relevant shared goals"
on public.shared_goals for select
to authenticated
using (
  created_by = auth.uid()
  or primary_owner_id = auth.uid()
  or exists (
    select 1
    from public.goals g
    join public.goal_sheets gs on gs.id = g.goal_sheet_id
    where g.shared_goal_id = shared_goals.id
      and (
        gs.employee_id = auth.uid()
        or gs.manager_id = auth.uid()
        or exists (
          select 1
          from public.manager_relationships mr
          where mr.employee_id = gs.employee_id
            and mr.manager_id = auth.uid()
            and mr.status = 'active'
            and (mr.effective_to is null or mr.effective_to >= current_date)
        )
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid()
            and u.role = 'admin'
        )
      )
  )
);

create or replace function public.prevent_shared_goal_field_edits()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' and old.shared_goal_id is not null then
    raise exception 'Shared KPI goals cannot be removed from an employee goal sheet.';
  end if;

  if tg_op = 'UPDATE' and old.shared_goal_id is not null then
    if old.goal_sheet_id is distinct from new.goal_sheet_id
      or old.shared_goal_id is distinct from new.shared_goal_id
      or old.shared_goal_primary is distinct from new.shared_goal_primary
      or old.thrust_area is distinct from new.thrust_area
      or old.title is distinct from new.title
      or old.description is distinct from new.description
      or old.uom_type is distinct from new.uom_type
      or old.target_value is distinct from new.target_value
      or old.deadline is distinct from new.deadline then
      raise exception 'Only weightage and progress fields can be changed on a shared KPI goal.';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_shared_goal_field_edits_before_update on public.goals;
create trigger prevent_shared_goal_field_edits_before_update
before update or delete on public.goals
for each row execute function public.prevent_shared_goal_field_edits();

create or replace function public.prevent_shared_goal_recipient_checkins()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_goal_id uuid;
  v_shared_goal_id uuid;
  v_is_primary boolean;
  v_is_sync text;
begin
  if tg_op = 'DELETE' then
    v_goal_id := old.goal_id;
  else
    v_goal_id := new.goal_id;
  end if;

  select g.shared_goal_id, g.shared_goal_primary
  into v_shared_goal_id, v_is_primary
  from public.goals g
  where g.id = v_goal_id;

  if v_shared_goal_id is null or coalesce(v_is_primary, false) then
    if tg_op = 'DELETE' then
      return old;
    end if;

    return new;
  end if;

  v_is_sync := current_setting('app.syncing_shared_goal', true);

  if coalesce(v_is_sync, '') <> 'true' then
    raise exception 'Shared KPI achievement is synced from the primary owner.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_shared_goal_recipient_checkins_before_write on public.goal_checkins;
create trigger prevent_shared_goal_recipient_checkins_before_write
before insert or update or delete on public.goal_checkins
for each row execute function public.prevent_shared_goal_recipient_checkins();

create or replace function public.sync_shared_goal_primary_checkin()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_shared_goal_id uuid;
  v_is_primary boolean;
  v_target_goal record;
  v_existing_checkin_id uuid;
begin
  select g.shared_goal_id, g.shared_goal_primary
  into v_shared_goal_id, v_is_primary
  from public.goals g
  where g.id = new.goal_id;

  if v_shared_goal_id is null or not coalesce(v_is_primary, false) then
    return new;
  end if;

  perform set_config('app.syncing_shared_goal', 'true', true);

  for v_target_goal in
    select g.id
    from public.goals g
    where g.shared_goal_id = v_shared_goal_id
      and g.id <> new.goal_id
  loop
    select gc.id
    into v_existing_checkin_id
    from public.goal_checkins gc
    where gc.goal_id = v_target_goal.id
      and gc.quarter = new.quarter
    order by gc.updated_at desc
    limit 1;

    if v_existing_checkin_id is null then
      insert into public.goal_checkins (
        goal_id,
        quarter,
        planned_value,
        actual_value,
        progress_score,
        status
      )
      values (
        v_target_goal.id,
        new.quarter,
        new.planned_value,
        new.actual_value,
        new.progress_score,
        new.status
      );
    else
      update public.goal_checkins
      set
        planned_value = new.planned_value,
        actual_value = new.actual_value,
        progress_score = new.progress_score,
        status = new.status,
        updated_at = now()
      where id = v_existing_checkin_id;
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists sync_shared_goal_primary_checkin_after_write on public.goal_checkins;
create trigger sync_shared_goal_primary_checkin_after_write
after insert or update of planned_value, actual_value, progress_score, status on public.goal_checkins
for each row execute function public.sync_shared_goal_primary_checkin();

create or replace function public.push_shared_goal(
  p_cycle_id uuid,
  p_employee_ids uuid[],
  p_primary_owner_id uuid,
  p_title text,
  p_thrust_area text,
  p_description text default null,
  p_uom_type text default 'timeline',
  p_target_value numeric default null,
  p_deadline date default null,
  p_default_weightage numeric default 10
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_role text;
  v_employee_id uuid;
  v_sheet_id uuid;
  v_sheet_status text;
  v_manager_id uuid;
  v_shared_goal_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated.';
  end if;

  select role into v_actor_role
  from public.users
  where id = auth.uid()
    and status = 'active';

  if v_actor_role not in ('admin', 'manager') then
    raise exception 'Only admins and managers can push shared KPIs.';
  end if;

  if p_employee_ids is null or array_length(p_employee_ids, 1) is null then
    raise exception 'Select at least one employee.';
  end if;

  if p_primary_owner_id is null or not (p_primary_owner_id = any(p_employee_ids)) then
    raise exception 'Primary owner must be one of the selected employees.';
  end if;

  if nullif(trim(coalesce(p_title, '')), '') is null then
    raise exception 'Goal title is required.';
  end if;

  if nullif(trim(coalesce(p_thrust_area, '')), '') is null then
    raise exception 'Thrust area is required.';
  end if;

  if p_uom_type not in ('min', 'max', 'timeline', 'zero') then
    raise exception 'Invalid unit of measurement.';
  end if;

  if p_default_weightage < 10 or p_default_weightage > 100 then
    raise exception 'Default weightage must be between 10 and 100.';
  end if;

  insert into public.shared_goals (
    cycle_id,
    created_by,
    primary_owner_id,
    title,
    thrust_area,
    description,
    uom_type,
    target_value,
    deadline
  )
  values (
    p_cycle_id,
    auth.uid(),
    p_primary_owner_id,
    trim(p_title),
    trim(p_thrust_area),
    nullif(trim(coalesce(p_description, '')), ''),
    p_uom_type,
    p_target_value,
    p_deadline
  )
  returning id into v_shared_goal_id;

  for v_employee_id in
    select distinct unnest(p_employee_ids)
  loop
    if not exists (
      select 1
      from public.users u
      where u.id = v_employee_id
        and u.role = 'employee'
        and u.status = 'active'
    ) then
      raise exception 'Shared KPIs can only be pushed to active employees.';
    end if;

    if v_actor_role = 'manager' and not exists (
      select 1
      from public.manager_relationships mr
      where mr.employee_id = v_employee_id
        and mr.manager_id = auth.uid()
        and mr.status = 'active'
        and (mr.effective_to is null or mr.effective_to >= current_date)
    ) then
      raise exception 'Managers can only push shared KPIs to employees they manage.';
    end if;

    select mr.manager_id
    into v_manager_id
    from public.manager_relationships mr
    where mr.employee_id = v_employee_id
      and mr.status = 'active'
      and (mr.effective_to is null or mr.effective_to >= current_date)
    order by mr.created_at desc
    limit 1;

    select gs.id, gs.status
    into v_sheet_id, v_sheet_status
    from public.goal_sheets gs
    where gs.employee_id = v_employee_id
      and gs.cycle_id = p_cycle_id
    limit 1;

    if v_sheet_id is null then
      insert into public.goal_sheets (
        employee_id,
        manager_id,
        cycle_id,
        status,
        locked
      )
      values (
        v_employee_id,
        v_manager_id,
        p_cycle_id,
        'draft',
        false
      )
      returning id into v_sheet_id;
    elsif v_sheet_status not in ('draft', 'rework') then
      raise exception 'Shared KPIs can only be pushed to draft or rework goal sheets.';
    end if;

    insert into public.goals (
      goal_sheet_id,
      shared_goal_id,
      shared_goal_primary,
      thrust_area,
      title,
      description,
      uom_type,
      target_value,
      weightage,
      deadline,
      status
    )
    values (
      v_sheet_id,
      v_shared_goal_id,
      v_employee_id = p_primary_owner_id,
      trim(p_thrust_area),
      trim(p_title),
      nullif(trim(coalesce(p_description, '')), ''),
      p_uom_type,
      p_target_value,
      p_default_weightage,
      p_deadline,
      'not_started'
    );

    insert into public.notifications (user_id, title, body, type, metadata)
    values (
      v_employee_id,
      'Shared KPI Added',
      'A shared KPI was added to your goal sheet.',
      'info',
      jsonb_build_object('shared_goal_id', v_shared_goal_id, 'cycle_id', p_cycle_id)
    );
  end loop;

  insert into public.activity_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'pushed_shared_goal',
    'shared_goals',
    v_shared_goal_id::text,
    jsonb_build_object(
      'cycle_id', p_cycle_id,
      'primary_owner_id', p_primary_owner_id,
      'employee_count', cardinality(p_employee_ids)
    )
  );

  return v_shared_goal_id;
end;
$$;

create or replace function public.update_goal_status(
  p_goal_id uuid,
  p_status text
)
returns public.goals
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_goal public.goals%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated.';
  end if;

  if p_status not in ('not_started', 'on_track', 'completed') then
    raise exception 'Invalid goal status.';
  end if;

  select g.* into v_goal
  from public.goals g
  join public.goal_sheets gs on gs.id = g.goal_sheet_id
  where g.id = p_goal_id
    and gs.employee_id = auth.uid()
    and gs.status = 'approved'
  for update of g;

  if not found then
    raise exception 'Goal not found or not editable by current user.';
  end if;

  if v_goal.shared_goal_id is not null and not v_goal.shared_goal_primary then
    raise exception 'Shared KPI status is controlled by the primary owner.';
  end if;

  update public.goals
  set status = p_status
  where id = p_goal_id
  returning * into v_goal;

  insert into public.activity_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'updated_goal_status',
    'goals',
    p_goal_id::text,
    jsonb_build_object('status', p_status)
  );

  return v_goal;
end;
$$;

revoke execute on function public.prevent_shared_goal_field_edits() from anon, authenticated;
revoke execute on function public.prevent_shared_goal_recipient_checkins() from anon, authenticated;
revoke execute on function public.sync_shared_goal_primary_checkin() from anon, authenticated;
revoke execute on function public.push_shared_goal(uuid, uuid[], uuid, text, text, text, text, numeric, date, numeric) from public, anon;
grant execute on function public.push_shared_goal(uuid, uuid[], uuid, text, text, text, text, numeric, date, numeric) to authenticated;
revoke execute on function public.update_goal_status(uuid, text) from public, anon;
grant execute on function public.update_goal_status(uuid, text) to authenticated;

commit;
