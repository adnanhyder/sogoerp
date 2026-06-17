create table if not exists public.lead_follow_ups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade not null,
  reason text not null, -- client's reason of not meeting
  notes text,          -- administrative/meeting notes
  next_follow_up_at timestamptz not null,
  seen boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lead_follow_ups enable row level security;

drop policy if exists "authenticated can use lead_follow_ups" on public.lead_follow_ups;
create policy "authenticated can use lead_follow_ups"
  on public.lead_follow_ups for all
  to authenticated
  using (true)
  with check (true);
