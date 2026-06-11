create extension if not exists "pgcrypto";

create type public.app_role as enum (
  'admin',
  'sales',
  'technician',
  'accountant',
  'support',
  'pending_user'
);

create type public.device_status as enum (
  'draft',
  'purchased',
  'stock_added',
  'imei_registered',
  'imei_approved',
  'assigned_to_courier',
  'received_by_technician',
  'assigned_for_installation',
  'installed',
  'activated_with_sim',
  'active',
  'returned',
  'faulty',
  'replaced'
);

create type public.lead_stage as enum (
  'new_lead',
  'contacted',
  'interested',
  'negotiation',
  'matured',
  'installation_scheduled',
  'installed',
  'lost'
);

create type public.work_order_status as enum (
  'assigned',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled'
);

create type public.ticket_status as enum (
  'open',
  'in_progress',
  'resolved',
  'closed'
);

create type public.finance_entry_type as enum (
  'income',
  'expense'
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  full_name text,
  phone text,
  role public.app_role not null default 'pending_user',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  contact_name text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create table public.technicians (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  cnic text,
  phone text,
  area_coverage text,
  cities text,
  authorization_person_name text,
  authorization_person_phone text,
  authorization_person_cnic text,
  authorization_relation text,
  skills text[],
  commission_rate numeric(12,2) not null default 0,
  fuel_allowance_rule text,
  disputed boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  full_name text not null,
  phone text,
  whatsapp text,
  email text,
  address text,
  area text,
  location text,
  vehicle_type text,
  budget numeric(12,2),
  notes text,
  created_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  registration_number text,
  vehicle_type text,
  make_model text,
  created_at timestamptz not null default now()
);

create table public.sims (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  sim_number text not null,
  network_provider text,
  apn_settings text,
  password text,
  activation_date date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  imei text not null unique,
  purchase_cost numeric(12,2) not null default 0,
  sale_price numeric(12,2) not null default 0,
  status text not null default 'purchased',
  has_mic boolean not null default false,
  custody_status text not null default 'company_hands',
  custody_updated_at timestamptz not null default now(),
  technician_id uuid references public.technicians(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  sim_id uuid references public.sims(id) on delete set null,
  installation_date date,
  warranty_until date,
  server_configuration text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  phone text,
  whatsapp text,
  source text,
  location text,
  vehicle_type text,
  budget numeric(12,2),
  stage public.lead_stage not null default 'new_lead',
  assigned_salesperson_id uuid references public.profiles(id) on delete set null,
  conversion_probability int not null default 0 check (conversion_probability between 0 and 100),
  next_follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customers
add column if not exists source_lead_id uuid references public.leads(id) on delete set null;

create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  device_id uuid references public.devices(id) on delete set null,
  technician_id uuid references public.technicians(id) on delete set null,
  status public.work_order_status not null default 'assigned',
  scheduled_at timestamptz,
  completed_at timestamptz,
  customer_signature_url text,
  before_image_url text,
  after_image_url text,
  gps_lat numeric(10,7),
  gps_lng numeric(10,7),
  activation_confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.customer_meetings (
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

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  device_id uuid references public.devices(id) on delete set null,
  title text not null,
  status public.ticket_status not null default 'open',
  priority text not null default 'normal',
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  entry_type public.finance_entry_type not null,
  category text not null,
  amount numeric(12,2) not null,
  related_customer_id uuid references public.customers(id) on delete set null,
  related_work_order_id uuid references public.work_orders(id) on delete set null,
  note text,
  occurred_on date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.commissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  technician_id uuid references public.technicians(id) on delete set null,
  work_order_id uuid references public.work_orders(id) on delete set null,
  amount numeric(12,2) not null,
  reason text,
  paid boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.communication_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  channel text not null default 'whatsapp',
  direction text not null,
  message text not null,
  sent_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  work_order_id uuid references public.work_orders(id) on delete set null,
  document_type text not null,
  file_url text not null,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.suppliers enable row level security;
alter table public.technicians enable row level security;
alter table public.customers enable row level security;
alter table public.vehicles enable row level security;
alter table public.sims enable row level security;
alter table public.devices enable row level security;
alter table public.leads enable row level security;
alter table public.work_orders enable row level security;
alter table public.customer_meetings enable row level security;
alter table public.support_tickets enable row level security;
alter table public.finance_entries enable row level security;
alter table public.commissions enable row level security;
alter table public.communication_logs enable row level security;
alter table public.documents enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'pending_user')
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        role = excluded.role,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop policy if exists "authenticated can use organizations" on public.organizations;
create policy "authenticated can use organizations"
  on public.organizations for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can use profiles" on public.profiles;
create policy "authenticated can use profiles"
  on public.profiles for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can use suppliers" on public.suppliers;
create policy "authenticated can use suppliers"
  on public.suppliers for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can use technicians" on public.technicians;
create policy "authenticated can use technicians"
  on public.technicians for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can use customers" on public.customers;
create policy "authenticated can use customers"
  on public.customers for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can use vehicles" on public.vehicles;
create policy "authenticated can use vehicles"
  on public.vehicles for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can use sims" on public.sims;
create policy "authenticated can use sims"
  on public.sims for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can use devices" on public.devices;
create policy "authenticated can use devices"
  on public.devices for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can use leads" on public.leads;
create policy "authenticated can use leads"
  on public.leads for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can use work_orders" on public.work_orders;
create policy "authenticated can use work_orders"
  on public.work_orders for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can use customer_meetings" on public.customer_meetings;
create policy "authenticated can use customer_meetings"
  on public.customer_meetings for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can use support_tickets" on public.support_tickets;
create policy "authenticated can use support_tickets"
  on public.support_tickets for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can use finance_entries" on public.finance_entries;
create policy "authenticated can use finance_entries"
  on public.finance_entries for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can use commissions" on public.commissions;
create policy "authenticated can use commissions"
  on public.commissions for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can use communication_logs" on public.communication_logs;
create policy "authenticated can use communication_logs"
  on public.communication_logs for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can use documents" on public.documents;
create policy "authenticated can use documents"
  on public.documents for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated can use audit_logs" on public.audit_logs;
create policy "authenticated can use audit_logs"
  on public.audit_logs for all
  to authenticated
  using (true)
  with check (true);
