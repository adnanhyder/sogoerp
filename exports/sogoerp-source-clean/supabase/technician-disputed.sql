alter table public.technicians
add column if not exists disputed boolean not null default false;
