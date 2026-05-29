begin;

-- Employees update goal progress status from the check-in workspace after
-- their goal sheet is approved. Direct table updates stay locked down; this RPC
-- updates only public.goals.status for the authenticated employee's own goal.

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

revoke execute on function public.update_goal_status(uuid, text) from public, anon;
grant execute on function public.update_goal_status(uuid, text) to authenticated;

commit;
