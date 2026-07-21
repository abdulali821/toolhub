-- Fix mutable search_path on set_updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Avoid listing all public avatar objects; keep own-folder select for authenticated users.
drop policy if exists "avatars_public_read" on storage.objects;

create policy "avatars_select_own"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
