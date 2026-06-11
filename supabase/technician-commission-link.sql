alter table public.commissions
add column if not exists technician_id uuid references public.technicians(id) on delete set null;
