create table if not exists public.insurance_policies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  policy_name text not null,
  start_date date,
  end_date date,
  status text not null default 'active',
  premium numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.report_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  focus text,
  owner text,
  frequency text,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.tracking_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  entity text not null,
  location text,
  signal text,
  last_update timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.settings_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  area text,
  owner text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

alter table public.insurance_policies
add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
add column if not exists customer_id uuid references public.customers(id) on delete set null;

alter table public.report_definitions
add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.tracking_events
add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.settings_items
add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.insurance_policies enable row level security;
alter table public.report_definitions enable row level security;
alter table public.tracking_events enable row level security;
alter table public.settings_items enable row level security;

drop policy if exists "authenticated can use insurance_policies" on public.insurance_policies;
create policy "authenticated can use insurance_policies" on public.insurance_policies for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));

drop policy if exists "authenticated can use report_definitions" on public.report_definitions;
create policy "authenticated can use report_definitions" on public.report_definitions for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));

drop policy if exists "authenticated can use tracking_events" on public.tracking_events;
create policy "authenticated can use tracking_events" on public.tracking_events for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));

drop policy if exists "authenticated can use settings_items" on public.settings_items;
create policy "authenticated can use settings_items" on public.settings_items for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));
