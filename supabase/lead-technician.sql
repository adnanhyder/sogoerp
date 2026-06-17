-- Add assigned technician to leads
alter table public.leads
  add column if not exists assigned_technician_id uuid references public.technicians(id) on delete set null;
