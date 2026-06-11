insert into public.organizations (name)
select 'SogoERP'
where not exists (select 1 from public.organizations);

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'pending_user'::public.app_role
  );
$$;

create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid();
$$;

create or replace function public.can_use_organization(row_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and public.current_app_role() <> 'pending_user'::public.app_role
    and (
      public.current_app_role() = 'admin'::public.app_role
      or row_organization_id = public.current_organization_id()
    );
$$;

do $$
declare
  default_org uuid;
begin
  select id into default_org from public.organizations order by created_at asc limit 1;

  update public.profiles set organization_id = default_org where organization_id is null;
  update public.suppliers set organization_id = default_org where organization_id is null;
  update public.technicians set organization_id = default_org where organization_id is null;
  update public.customers set organization_id = default_org where organization_id is null;
  update public.vehicles set organization_id = default_org where organization_id is null;
  update public.sims set organization_id = default_org where organization_id is null;
  update public.devices set organization_id = default_org where organization_id is null;
  update public.leads set organization_id = default_org where organization_id is null;
  update public.work_orders set organization_id = default_org where organization_id is null;
  update public.customer_meetings set organization_id = default_org where organization_id is null;
  update public.support_tickets set organization_id = default_org where organization_id is null;
  update public.finance_entries set organization_id = default_org where organization_id is null;
  update public.commissions set organization_id = default_org where organization_id is null;
  update public.communication_logs set organization_id = default_org where organization_id is null;
  update public.documents set organization_id = default_org where organization_id is null;
  update public.audit_logs set organization_id = default_org where organization_id is null;
  update public.insurance_policies set organization_id = default_org where organization_id is null;
  update public.report_definitions set organization_id = default_org where organization_id is null;
  update public.tracking_events set organization_id = default_org where organization_id is null;
  update public.settings_items set organization_id = default_org where organization_id is null;
  update public.api_sources set organization_id = default_org where organization_id is null;
  update public.inbound_events set organization_id = default_org where organization_id is null;
  update public.import_jobs set organization_id = default_org where organization_id is null;
  update public.export_jobs set organization_id = default_org where organization_id is null;
end $$;

drop policy if exists "authenticated can use organizations" on public.organizations;
create policy "authenticated can use organizations"
  on public.organizations for all
  to authenticated
  using (id = public.current_organization_id() or public.current_app_role() = 'admin')
  with check (auth.uid() is not null);

drop policy if exists "authenticated can use profiles" on public.profiles;
create policy "authenticated can use profiles"
  on public.profiles for all
  to authenticated
  using (id = auth.uid() or public.current_app_role() = 'admin')
  with check (id = auth.uid() or public.current_app_role() = 'admin');

drop policy if exists "authenticated can use suppliers" on public.suppliers;
create policy "authenticated can use suppliers" on public.suppliers for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));
drop policy if exists "authenticated can use technicians" on public.technicians;
create policy "authenticated can use technicians" on public.technicians for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));
drop policy if exists "authenticated can use customers" on public.customers;
create policy "authenticated can use customers" on public.customers for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));
drop policy if exists "authenticated can use vehicles" on public.vehicles;
create policy "authenticated can use vehicles" on public.vehicles for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));
drop policy if exists "authenticated can use sims" on public.sims;
create policy "authenticated can use sims" on public.sims for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));
drop policy if exists "authenticated can use devices" on public.devices;
create policy "authenticated can use devices" on public.devices for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));
drop policy if exists "authenticated can use leads" on public.leads;
create policy "authenticated can use leads" on public.leads for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));
drop policy if exists "authenticated can use work_orders" on public.work_orders;
create policy "authenticated can use work_orders" on public.work_orders for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));
drop policy if exists "authenticated can use customer_meetings" on public.customer_meetings;
create policy "authenticated can use customer_meetings" on public.customer_meetings for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));
drop policy if exists "authenticated can use support_tickets" on public.support_tickets;
create policy "authenticated can use support_tickets" on public.support_tickets for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));
drop policy if exists "authenticated can use finance_entries" on public.finance_entries;
create policy "authenticated can use finance_entries" on public.finance_entries for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));
drop policy if exists "authenticated can use commissions" on public.commissions;
create policy "authenticated can use commissions" on public.commissions for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));
drop policy if exists "authenticated can use communication_logs" on public.communication_logs;
create policy "authenticated can use communication_logs" on public.communication_logs for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));
drop policy if exists "authenticated can use documents" on public.documents;
create policy "authenticated can use documents" on public.documents for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));
drop policy if exists "authenticated can use audit_logs" on public.audit_logs;
create policy "authenticated can use audit_logs" on public.audit_logs for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));
drop policy if exists "authenticated can use insurance_policies" on public.insurance_policies;
create policy "authenticated can use insurance_policies" on public.insurance_policies for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));
drop policy if exists "authenticated can use report_definitions" on public.report_definitions;
create policy "authenticated can use report_definitions" on public.report_definitions for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));
drop policy if exists "authenticated can use tracking_events" on public.tracking_events;
create policy "authenticated can use tracking_events" on public.tracking_events for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));
drop policy if exists "authenticated can use settings_items" on public.settings_items;
create policy "authenticated can use settings_items" on public.settings_items for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));
drop policy if exists "authenticated can use api_sources" on public.api_sources;
create policy "authenticated can use api_sources" on public.api_sources for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));
drop policy if exists "authenticated can use inbound_events" on public.inbound_events;
create policy "authenticated can use inbound_events" on public.inbound_events for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));
drop policy if exists "authenticated can use import_jobs" on public.import_jobs;
create policy "authenticated can use import_jobs" on public.import_jobs for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));
drop policy if exists "authenticated can use export_jobs" on public.export_jobs;
create policy "authenticated can use export_jobs" on public.export_jobs for all to authenticated using (public.can_use_organization(organization_id)) with check (public.can_use_organization(organization_id));

drop policy if exists "Authenticated users can read activity events" on public.activity_events;
create policy "Authenticated users can read activity events"
on public.activity_events for select
to authenticated
using (public.current_app_role() <> 'pending_user');

drop policy if exists "Authenticated users can create activity events" on public.activity_events;
create policy "Authenticated users can create activity events"
on public.activity_events for insert
to authenticated
with check (auth.uid() = created_by and public.current_app_role() <> 'pending_user');
