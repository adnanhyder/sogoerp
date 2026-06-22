create table if not exists public.device_transfers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  device_id uuid references public.devices(id) on delete cascade,
  from_technician_id uuid references public.technicians(id) on delete set null,
  to_technician_id uuid references public.technicians(id) on delete set null,
  courier_name text,
  tracking_number text,
  departed_at timestamptz,
  received_at timestamptz,
  status text not null default 'in_transit',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.device_transfers enable row level security;
