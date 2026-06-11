create table if not exists public.api_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  source_key text not null unique,
  allowed_events text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.inbound_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  source text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  import_type text not null,
  file_url text,
  status text not null default 'pending',
  total_rows integer not null default 0,
  success_rows integer not null default 0,
  failed_rows integer not null default 0,
  error_report jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.export_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  export_type text not null,
  file_url text,
  status text not null default 'pending',
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.api_sources
add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.inbound_events
add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.import_jobs
add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.export_jobs
add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.api_sources enable row level security;
alter table public.inbound_events enable row level security;
alter table public.import_jobs enable row level security;
alter table public.export_jobs enable row level security;

drop policy if exists "authenticated can use api_sources" on public.api_sources;
create policy "authenticated can use api_sources" on public.api_sources for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));

drop policy if exists "authenticated can use inbound_events" on public.inbound_events;
create policy "authenticated can use inbound_events" on public.inbound_events for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));

drop policy if exists "authenticated can use import_jobs" on public.import_jobs;
create policy "authenticated can use import_jobs" on public.import_jobs for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));

drop policy if exists "authenticated can use export_jobs" on public.export_jobs;
create policy "authenticated can use export_jobs" on public.export_jobs for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));

create or replace function public.ingest_lead(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_id uuid;
begin
  insert into public.leads (
    organization_id,
    name,
    phone,
    whatsapp,
    source,
    location,
    vehicle_type,
    budget,
    stage
  )
  values (
    nullif(payload ->> 'organization_id', '')::uuid,
    coalesce(payload ->> 'name', 'Unknown Lead'),
    payload ->> 'phone',
    payload ->> 'whatsapp',
    payload ->> 'source',
    payload ->> 'location',
    payload ->> 'vehicle_type',
    nullif(payload ->> 'budget', '')::numeric,
    coalesce((payload ->> 'stage')::public.lead_stage, 'new_lead')
  )
  returning id into created_id;

  insert into public.inbound_events (organization_id, source, event_type, payload, status, processed_at)
  values (nullif(payload ->> 'organization_id', '')::uuid, coalesce(payload ->> 'source', 'external'), 'lead.created', payload, 'processed', now());

  return created_id;
end;
$$;

create or replace function public.ingest_customer(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_id uuid;
begin
  insert into public.customers (
    organization_id,
    full_name,
    phone,
    whatsapp,
    email,
    address,
    area
  )
  values (
    nullif(payload ->> 'organization_id', '')::uuid,
    coalesce(payload ->> 'full_name', payload ->> 'name', 'Unknown Customer'),
    payload ->> 'phone',
    payload ->> 'whatsapp',
    payload ->> 'email',
    payload ->> 'address',
    payload ->> 'area'
  )
  returning id into created_id;

  insert into public.inbound_events (organization_id, source, event_type, payload, status, processed_at)
  values (nullif(payload ->> 'organization_id', '')::uuid, coalesce(payload ->> 'source', 'external'), 'customer.created', payload, 'processed', now());

  return created_id;
end;
$$;

create or replace function public.ingest_device(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_id uuid;
begin
  insert into public.devices (
    organization_id,
    imei,
    purchase_cost,
    sale_price,
    status,
    has_mic,
    custody_status,
    custody_updated_at
  )
  values (
    nullif(payload ->> 'organization_id', '')::uuid,
    payload ->> 'imei',
    coalesce(nullif(payload ->> 'purchase_cost', '')::numeric, 0),
    coalesce(nullif(payload ->> 'sale_price', '')::numeric, 0),
    coalesce(nullif(payload ->> 'status', ''), 'stock_added'),
    coalesce((payload ->> 'has_mic')::boolean, false),
    coalesce(nullif(payload ->> 'custody_status', ''), 'company_hands'),
    coalesce(nullif(payload ->> 'custody_updated_at', '')::timestamptz, now())
  )
  returning id into created_id;

  insert into public.inbound_events (organization_id, source, event_type, payload, status, processed_at)
  values (nullif(payload ->> 'organization_id', '')::uuid, coalesce(payload ->> 'source', 'external'), 'device.created', payload, 'processed', now());

  return created_id;
end;
$$;

create or replace function public.ingest_sim(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_id uuid;
begin
  insert into public.sims (
    organization_id,
    sim_number,
    network_provider,
    apn_settings,
    password,
    activation_date
  )
  values (
    nullif(payload ->> 'organization_id', '')::uuid,
    payload ->> 'sim_number',
    payload ->> 'network_provider',
    payload ->> 'apn_settings',
    payload ->> 'password',
    nullif(payload ->> 'activation_date', '')::date
  )
  returning id into created_id;

  insert into public.inbound_events (organization_id, source, event_type, payload, status, processed_at)
  values (nullif(payload ->> 'organization_id', '')::uuid, coalesce(payload ->> 'source', 'external'), 'sim.created', payload, 'processed', now());

  return created_id;
end;
$$;

create or replace function public.ingest_finance_entry(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_id uuid;
begin
  insert into public.finance_entries (
    organization_id,
    entry_type,
    category,
    amount,
    note,
    occurred_on
  )
  values (
    nullif(payload ->> 'organization_id', '')::uuid,
    coalesce((payload ->> 'entry_type')::public.finance_entry_type, 'income'),
    coalesce(payload ->> 'category', 'General'),
    coalesce(nullif(payload ->> 'amount', '')::numeric, 0),
    payload ->> 'note',
    coalesce(nullif(payload ->> 'occurred_on', '')::date, current_date)
  )
  returning id into created_id;

  insert into public.inbound_events (organization_id, source, event_type, payload, status, processed_at)
  values (nullif(payload ->> 'organization_id', '')::uuid, coalesce(payload ->> 'source', 'external'), 'finance.created', payload, 'processed', now());

  return created_id;
end;
$$;

create or replace function public.ingest_whatsapp_message(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_id uuid;
begin
  insert into public.communication_logs (
    organization_id,
    channel,
    direction,
    message
  )
  values (
    nullif(payload ->> 'organization_id', '')::uuid,
    'whatsapp',
    coalesce(payload ->> 'direction', 'inbound'),
    coalesce(payload ->> 'message', '')
  )
  returning id into created_id;

  insert into public.inbound_events (organization_id, source, event_type, payload, status, processed_at)
  values (nullif(payload ->> 'organization_id', '')::uuid, coalesce(payload ->> 'source', 'whatsapp'), 'whatsapp.message', payload, 'processed', now());

  return created_id;
end;
$$;
