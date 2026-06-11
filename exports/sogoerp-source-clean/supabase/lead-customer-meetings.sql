alter table public.customers
add column if not exists source_lead_id uuid references public.leads(id) on delete set null,
add column if not exists location text,
add column if not exists vehicle_type text,
add column if not exists budget numeric(12,2),
add column if not exists notes text;

create table if not exists public.customer_meetings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  customer_id uuid references public.customers(id) on delete cascade,
  technician_id uuid references public.technicians(id) on delete set null,
  scheduled_at timestamptz not null,
  previous_scheduled_at timestamptz,
  status text not null default 'scheduled',
  conversation_notes text,
  outcome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customer_meetings
add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.customer_meetings enable row level security;

drop policy if exists "authenticated can use customer_meetings" on public.customer_meetings;
create policy "authenticated can use customer_meetings"
  on public.customer_meetings for all
  to authenticated
  using (true)
  with check (true);
