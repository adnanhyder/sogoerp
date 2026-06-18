-- Add consignment number, courier company, and device condition to devices table
alter table public.devices
  add column if not exists consignment_number text,
  add column if not exists courier_company text,
  add column if not exists device_condition text not null default 'new';
