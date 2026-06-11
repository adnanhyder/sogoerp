create or replace function public.validate_api_source(source_key_input text, event_type_input text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  source_name text;
begin
  select name into source_name
  from public.api_sources
  where source_key = source_key_input
    and active = true
    and (
      array_length(allowed_events, 1) is null
      or event_type_input = any(allowed_events)
    )
  limit 1;

  if source_name is null then
    raise exception 'Invalid or inactive API source key';
  end if;

  return source_name;
end;
$$;

create or replace function public.ingest_lead_secure(source_key text, payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  source_name text;
begin
  source_name := public.validate_api_source(source_key, 'lead.created');
  payload := jsonb_set(payload, '{source}', to_jsonb(source_name), true);
  return public.ingest_lead(payload);
end;
$$;

create or replace function public.ingest_device_secure(source_key text, payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  source_name text;
begin
  source_name := public.validate_api_source(source_key, 'device.created');
  payload := jsonb_set(payload, '{source}', to_jsonb(source_name), true);
  return public.ingest_device(payload);
end;
$$;

create or replace function public.ingest_sim_secure(source_key text, payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  source_name text;
begin
  source_name := public.validate_api_source(source_key, 'sim.created');
  payload := jsonb_set(payload, '{source}', to_jsonb(source_name), true);
  return public.ingest_sim(payload);
end;
$$;

create or replace function public.ingest_customer_secure(source_key text, payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  source_name text;
begin
  source_name := public.validate_api_source(source_key, 'customer.created');
  payload := jsonb_set(payload, '{source}', to_jsonb(source_name), true);
  return public.ingest_customer(payload);
end;
$$;

create or replace function public.ingest_finance_entry_secure(source_key text, payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  source_name text;
begin
  source_name := public.validate_api_source(source_key, 'finance.created');
  payload := jsonb_set(payload, '{source}', to_jsonb(source_name), true);
  return public.ingest_finance_entry(payload);
end;
$$;

create or replace function public.ingest_whatsapp_message_secure(source_key text, payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  source_name text;
begin
  source_name := public.validate_api_source(source_key, 'whatsapp.message');
  payload := jsonb_set(payload, '{source}', to_jsonb(source_name), true);
  return public.ingest_whatsapp_message(payload);
end;
$$;
