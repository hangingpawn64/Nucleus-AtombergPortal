begin;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  3145728,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Profile avatars are publicly readable" on storage.objects;
drop policy if exists "Users can upload own profile avatars" on storage.objects;
drop policy if exists "Users can update own profile avatars" on storage.objects;
drop policy if exists "Users can delete own profile avatars" on storage.objects;

create policy "Profile avatars are publicly readable"
on storage.objects for select
using (bucket_id = 'profile-avatars');

create policy "Users can upload own profile avatars"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update own profile avatars"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own profile avatars"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can read assigned manager user rows" on public.users;
drop policy if exists "Users can read assigned manager profiles" on public.profiles;

create policy "Users can read assigned manager user rows"
on public.users for select
to authenticated
using (
  exists (
    select 1
    from public.manager_relationships mr
    where mr.employee_id = auth.uid()
      and mr.manager_id = users.id
      and mr.status = 'active'
      and (mr.effective_to is null or mr.effective_to >= current_date)
  )
);

create policy "Users can read assigned manager profiles"
on public.profiles for select
to authenticated
using (
  exists (
    select 1
    from public.manager_relationships mr
    where mr.employee_id = auth.uid()
      and mr.manager_id = profiles.user_id
      and mr.status = 'active'
      and (mr.effective_to is null or mr.effective_to >= current_date)
  )
);

commit;
