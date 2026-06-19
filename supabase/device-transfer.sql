-- Add sent_by_technician_id to devices table
-- Tracks which technician sent/dispatched the device when custody is on_the_way
alter table public.devices
  add column if not exists sent_by_technician_id uuid references public.technicians(id) on delete set null;
