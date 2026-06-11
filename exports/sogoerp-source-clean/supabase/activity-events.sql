create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('created', 'updated', 'deleted')),
  module_key text not null,
  record_label text not null,
  record_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.activity_events enable row level security;

drop policy if exists "Authenticated users can read activity events" on public.activity_events;
create policy "Authenticated users can read activity events"
on public.activity_events for select
to authenticated
using (true);

drop policy if exists "Authenticated users can create activity events" on public.activity_events;
create policy "Authenticated users can create activity events"
on public.activity_events for insert
to authenticated
with check (auth.uid() = created_by);
