alter table public.devices
add column if not exists custody_status text not null default 'company_hands';

alter table public.devices
add column if not exists custody_updated_at timestamptz not null default now();
