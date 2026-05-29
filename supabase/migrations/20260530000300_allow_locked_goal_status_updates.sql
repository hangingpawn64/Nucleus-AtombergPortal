begin;

-- The check-in workspace lets employees update only the progress status of
-- their own approved goals. Locked sheets must still block every other goal
-- edit, including title, target, weightage, deadline, and deletion.

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

  if private.is_admin() then
    if tg_op = 'DELETE' then
      return old;
    end if;

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

revoke execute on function public.prevent_locked_goal_edits() from anon, authenticated;

commit;
