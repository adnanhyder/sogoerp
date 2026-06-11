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

drop function if exists public.ingest_lead_secure(text, jsonb);
create or replace function public.ingest_lead_secure(source_key_input text, payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  source_name text;
  source_org uuid;
begin
  source_name := public.validate_api_source(source_key_input, 'lead.created');
  select organization_id into source_org from public.api_sources where api_sources.source_key = source_key_input limit 1;
  payload := jsonb_set(payload, '{source}', to_jsonb(source_name), true);
  payload := jsonb_set(payload, '{organization_id}', to_jsonb(source_org), true);
  return public.ingest_lead(payload);
end;
$$;

drop function if exists public.ingest_device_secure(text, jsonb);
create or replace function public.ingest_device_secure(source_key_input text, payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  source_name text;
  source_org uuid;
begin
  source_name := public.validate_api_source(source_key_input, 'device.created');
  select organization_id into source_org from public.api_sources where api_sources.source_key = source_key_input limit 1;
  payload := jsonb_set(payload, '{source}', to_jsonb(source_name), true);
  payload := jsonb_set(payload, '{organization_id}', to_jsonb(source_org), true);
  return public.ingest_device(payload);
end;
$$;

drop function if exists public.ingest_sim_secure(text, jsonb);
create or replace function public.ingest_sim_secure(source_key_input text, payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  source_name text;
  source_org uuid;
begin
  source_name := public.validate_api_source(source_key_input, 'sim.created');
  select organization_id into source_org from public.api_sources where api_sources.source_key = source_key_input limit 1;
  payload := jsonb_set(payload, '{source}', to_jsonb(source_name), true);
  payload := jsonb_set(payload, '{organization_id}', to_jsonb(source_org), true);
  return public.ingest_sim(payload);
end;
$$;

drop function if exists public.ingest_customer_secure(text, jsonb);
create or replace function public.ingest_customer_secure(source_key_input text, payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  source_name text;
  source_org uuid;
begin
  source_name := public.validate_api_source(source_key_input, 'customer.created');
  select organization_id into source_org from public.api_sources where api_sources.source_key = source_key_input limit 1;
  payload := jsonb_set(payload, '{source}', to_jsonb(source_name), true);
  payload := jsonb_set(payload, '{organization_id}', to_jsonb(source_org), true);
  return public.ingest_customer(payload);
end;
$$;

drop function if exists public.ingest_finance_entry_secure(text, jsonb);
create or replace function public.ingest_finance_entry_secure(source_key_input text, payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  source_name text;
  source_org uuid;
begin
  source_name := public.validate_api_source(source_key_input, 'finance.created');
  select organization_id into source_org from public.api_sources where api_sources.source_key = source_key_input limit 1;
  payload := jsonb_set(payload, '{source}', to_jsonb(source_name), true);
  payload := jsonb_set(payload, '{organization_id}', to_jsonb(source_org), true);
  return public.ingest_finance_entry(payload);
end;
$$;

drop function if exists public.ingest_whatsapp_message_secure(text, jsonb);
create or replace function public.ingest_whatsapp_message_secure(source_key_input text, payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  source_name text;
  source_org uuid;
begin
  source_name := public.validate_api_source(source_key_input, 'whatsapp.message');
  select organization_id into source_org from public.api_sources where api_sources.source_key = source_key_input limit 1;
  payload := jsonb_set(payload, '{source}', to_jsonb(source_name), true);
  payload := jsonb_set(payload, '{organization_id}', to_jsonb(source_org), true);
  return public.ingest_whatsapp_message(payload);
end;
$$;
