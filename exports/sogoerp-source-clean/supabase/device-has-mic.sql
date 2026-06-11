alter table public.devices
add column if not exists has_mic boolean not null default false;
