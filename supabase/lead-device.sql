-- Add assigned device to leads
alter table public.leads
  add column if not exists assigned_device_id uuid references public.devices(id) on delete set null;
