-- Profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tool_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tool_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, tool_id)
);

create table public.tool_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tool_id text not null,
  used_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb
);

create table public.uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  bucket text not null,
  path text not null,
  mime text,
  bytes bigint,
  status text not null default 'pending' check (status in ('pending', 'ready', 'failed', 'deleted')),
  created_at timestamptz not null default now(),
  unique (bucket, path)
);

create index tool_favorites_user_id_idx on public.tool_favorites (user_id);
create index tool_favorites_tool_id_idx on public.tool_favorites (tool_id);
create index tool_history_user_used_at_idx on public.tool_history (user_id, used_at desc);
create index tool_history_tool_id_idx on public.tool_history (tool_id);
create index uploads_user_id_idx on public.uploads (user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.tool_favorites enable row level security;
alter table public.tool_history enable row level security;
alter table public.uploads enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "favorites_select_own" on public.tool_favorites for select to authenticated using (auth.uid() = user_id);
create policy "favorites_insert_own" on public.tool_favorites for insert to authenticated with check (auth.uid() = user_id);
create policy "favorites_delete_own" on public.tool_favorites for delete to authenticated using (auth.uid() = user_id);

create policy "history_select_own" on public.tool_history for select to authenticated using (auth.uid() = user_id);
create policy "history_insert_own" on public.tool_history for insert to authenticated with check (auth.uid() = user_id);
create policy "history_delete_own" on public.tool_history for delete to authenticated using (auth.uid() = user_id);

create policy "uploads_select_own" on public.uploads for select to authenticated using (auth.uid() = user_id);
create policy "uploads_insert_own" on public.uploads for insert to authenticated with check (auth.uid() = user_id);
create policy "uploads_update_own" on public.uploads for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "uploads_delete_own" on public.uploads for delete to authenticated using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('uploads', 'uploads', false, 52428800, null)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects for select to public using (bucket_id = 'avatars');
create policy "avatars_insert_own" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_update_own" on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_delete_own" on storage.objects for delete to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "uploads_select_own" on storage.objects for select to authenticated using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "uploads_insert_own" on storage.objects for insert to authenticated with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "uploads_update_own" on storage.objects for update to authenticated using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "uploads_delete_own" on storage.objects for delete to authenticated using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);

do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    revoke execute on function public.rls_auto_enable() from anon, authenticated, public;
  end if;
end $$;

revoke execute on function public.handle_new_user() from anon, authenticated, public;
grant execute on function public.handle_new_user() to service_role;
