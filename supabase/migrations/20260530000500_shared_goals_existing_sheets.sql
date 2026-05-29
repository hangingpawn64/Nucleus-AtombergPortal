begin;

-- Shared KPIs are departmental changes, so managers/admins can push them into
-- existing submitted/approved sheets. Normal locked-sheet edits remain blocked.

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
  sheet_employee_id uuid;
  is_shared_push boolean;
begin
  if tg_op = 'DELETE' then
    target_goal_sheet_id := old.goal_sheet_id;
  else
    target_goal_sheet_id := new.goal_sheet_id;
  end if;

  select status, locked, employee_id
  into sheet_status, sheet_locked, sheet_employee_id
  from public.goal_sheets
  where id = target_goal_sheet_id;

  is_shared_push := coalesce(current_setting('app.pushing_shared_goal', true), '') = 'true';

  if private.is_admin() then
    if tg_op = 'DELETE' then
      return old;
    end if;

    return new;
  end if;

  if tg_op = 'INSERT'
    and is_shared_push
    and new.shared_goal_id is not null then
    return new;
  end if;

  if tg_op = 'UPDATE'
    and sheet_employee_id = auth.uid()
    and new.shared_goal_id is not null
    and new.weightage between 10 and 100
    and old.goal_sheet_id is not distinct from new.goal_sheet_id
    and old.shared_goal_id is not distinct from new.shared_goal_id
    and old.shared_goal_primary is not distinct from new.shared_goal_primary
    and old.thrust_area is not distinct from new.thrust_area
    and old.title is not distinct from new.title
    and old.description is not distinct from new.description
    and old.uom_type is not distinct from new.uom_type
    and old.target_value is not distinct from new.target_value
    and old.achievement_value is not distinct from new.achievement_value
    and old.status is not distinct from new.status
    and old.deadline is not distinct from new.deadline then
    return new;
  end if;

  if tg_op = 'UPDATE'
    and sheet_status = 'approved'
    and sheet_locked
    and sheet_employee_id = auth.uid()
    and new.status in ('not_started', 'on_track', 'completed')
    and old.goal_sheet_id is not distinct from new.goal_sheet_id
    and old.thrust_area is not distinct from new.thrust_area
    and old.title is not distinct from new.title
    and old.description is not distinct from new.description
    and old.uom_type is not distinct from new.uom_type
    and old.target_value is not distinct from new.target_value
    and old.weightage is not distinct from new.weightage
    and old.achievement_value is not distinct from new.achievement_value
    and old.deadline is not distinct from new.deadline then
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

create or replace function public.update_shared_goal_weightage(
  p_goal_id uuid,
  p_weightage numeric
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

  if p_weightage < 10 or p_weightage > 100 then
    raise exception 'Weightage must be between 10 and 100.';
  end if;

  select g.* into v_goal
  from public.goals g
  join public.goal_sheets gs on gs.id = g.goal_sheet_id
  where g.id = p_goal_id
    and g.shared_goal_id is not null
    and gs.employee_id = auth.uid()
  for update of g;

  if not found then
    raise exception 'Shared KPI goal not found or not editable by current user.';
  end if;

  update public.goals
  set weightage = p_weightage
  where id = p_goal_id
  returning * into v_goal;

  insert into public.activity_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'updated_shared_goal_weightage',
    'goals',
    p_goal_id::text,
    jsonb_build_object('weightage', p_weightage, 'shared_goal_id', v_goal.shared_goal_id)
  );

  return v_goal;
end;
$$;

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

  perform set_config('app.pushing_shared_goal', 'true', true);

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

    select gs.id
    into v_sheet_id
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

revoke execute on function public.prevent_locked_goal_edits() from anon, authenticated;
revoke execute on function public.update_shared_goal_weightage(uuid, numeric) from public, anon;
grant execute on function public.update_shared_goal_weightage(uuid, numeric) to authenticated;
revoke execute on function public.push_shared_goal(uuid, uuid[], uuid, text, text, text, text, numeric, date, numeric) from public, anon;
grant execute on function public.push_shared_goal(uuid, uuid[], uuid, text, text, text, text, numeric, date, numeric) to authenticated;

commit;
