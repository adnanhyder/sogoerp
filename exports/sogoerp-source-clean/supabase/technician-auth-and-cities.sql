alter table public.technicians
add column if not exists cities text;

alter table public.technicians
add column if not exists authorization_person_name text;

alter table public.technicians
add column if not exists authorization_person_phone text;

alter table public.technicians
add column if not exists authorization_person_cnic text;

alter table public.technicians
add column if not exists authorization_relation text;
