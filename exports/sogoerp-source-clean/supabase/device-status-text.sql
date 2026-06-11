alter table public.devices
alter column status type text using status::text;

alter table public.devices
alter column status set default 'purchased';
