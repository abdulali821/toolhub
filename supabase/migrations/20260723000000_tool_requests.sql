-- Public tool request submissions (request a tool form)
create table public.tool_requests (
  id uuid primary key default gen_random_uuid(),
  tool_name text not null,
  description text not null,
  category text,
  email text,
  user_id uuid references public.profiles (id) on delete set null,
  status text not null default 'new' check (status in ('new', 'reviewed', 'planned', 'shipped', 'declined')),
  created_at timestamptz not null default now()
);

create index tool_requests_created_at_idx on public.tool_requests (created_at desc);
create index tool_requests_status_idx on public.tool_requests (status);

alter table public.tool_requests enable row level security;

-- Anyone can submit a request (anon + authenticated).
create policy "tool_requests_insert_public"
  on public.tool_requests for insert
  to anon, authenticated
  with check (
    char_length(tool_name) between 2 and 120
    and char_length(description) between 10 and 4000
    and (category is null or char_length(category) <= 64)
    and (email is null or char_length(email) <= 254)
    and (user_id is null or user_id = auth.uid())
  );

-- Authenticated users can read their own submissions.
create policy "tool_requests_select_own"
  on public.tool_requests for select
  to authenticated
  using (user_id = auth.uid());
