alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists mobile_number text,
  add column if not exists avatar_url text;

update public.profiles
set
  first_name = nullif(split_part(trim(coalesce(full_name, '')), ' ', 1), ''),
  last_name = nullif(regexp_replace(trim(coalesce(full_name, '')), '^\S+\s*', ''), '')
where full_name is not null
  and (first_name is null or last_name is null);

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

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can insert their own profile'
  ) then
    create policy "Users can insert their own profile"
    on public.profiles for insert
    with check (auth.uid() = user_id);
  end if;
end;
$$;
