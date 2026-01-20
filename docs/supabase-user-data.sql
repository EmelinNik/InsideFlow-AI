-- Supabase schema for persisting user state
-- Create table
create table if not exists public.user_data (
  user_id bigint primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Keep updated_at current
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_data_touch_updated_at on public.user_data;
create trigger user_data_touch_updated_at
before update on public.user_data
for each row execute procedure public.touch_updated_at();

-- Enable Row Level Security
alter table public.user_data enable row level security;

-- Policy: allow authenticated users to access only their row
drop policy if exists "user_data_select_own" on public.user_data;
create policy "user_data_select_own"
  on public.user_data
  for select
  using (auth.uid()::text = user_id::text);

drop policy if exists "user_data_insert_own" on public.user_data;
create policy "user_data_insert_own"
  on public.user_data
  for insert
  with check (auth.uid()::text = user_id::text);

drop policy if exists "user_data_update_own" on public.user_data;
create policy "user_data_update_own"
  on public.user_data
  for update
  using (auth.uid()::text = user_id::text)
  with check (auth.uid()::text = user_id::text);

drop policy if exists "user_data_delete_own" on public.user_data;
create policy "user_data_delete_own"
  on public.user_data
  for delete
  using (auth.uid()::text = user_id::text);
