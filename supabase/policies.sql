create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'pending_user')
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        role = excluded.role,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop policy if exists "authenticated can use organizations" on public.organizations;
create policy "authenticated can use organizations" on public.organizations for all to authenticated using (true) with check (true);

drop policy if exists "authenticated can use profiles" on public.profiles;
create policy "authenticated can use profiles" on public.profiles for all to authenticated using (true) with check (true);

drop policy if exists "authenticated can use suppliers" on public.suppliers;
create policy "authenticated can use suppliers" on public.suppliers for all to authenticated using (true) with check (true);

drop policy if exists "authenticated can use technicians" on public.technicians;
create policy "authenticated can use technicians" on public.technicians for all to authenticated using (true) with check (true);

drop policy if exists "authenticated can use customers" on public.customers;
create policy "authenticated can use customers" on public.customers for all to authenticated using (true) with check (true);

drop policy if exists "authenticated can use vehicles" on public.vehicles;
create policy "authenticated can use vehicles" on public.vehicles for all to authenticated using (true) with check (true);

drop policy if exists "authenticated can use sims" on public.sims;
create policy "authenticated can use sims" on public.sims for all to authenticated using (true) with check (true);

drop policy if exists "authenticated can use devices" on public.devices;
create policy "authenticated can use devices" on public.devices for all to authenticated using (true) with check (true);

drop policy if exists "authenticated can use leads" on public.leads;
create policy "authenticated can use leads" on public.leads for all to authenticated using (true) with check (true);

drop policy if exists "authenticated can use work_orders" on public.work_orders;
create policy "authenticated can use work_orders" on public.work_orders for all to authenticated using (true) with check (true);

drop policy if exists "authenticated can use support_tickets" on public.support_tickets;
create policy "authenticated can use support_tickets" on public.support_tickets for all to authenticated using (true) with check (true);

drop policy if exists "authenticated can use finance_entries" on public.finance_entries;
create policy "authenticated can use finance_entries" on public.finance_entries for all to authenticated using (true) with check (true);

drop policy if exists "authenticated can use commissions" on public.commissions;
create policy "authenticated can use commissions" on public.commissions for all to authenticated using (true) with check (true);

drop policy if exists "authenticated can use communication_logs" on public.communication_logs;
create policy "authenticated can use communication_logs" on public.communication_logs for all to authenticated using (true) with check (true);

drop policy if exists "authenticated can use documents" on public.documents;
create policy "authenticated can use documents" on public.documents for all to authenticated using (true) with check (true);

drop policy if exists "authenticated can use audit_logs" on public.audit_logs;
create policy "authenticated can use audit_logs" on public.audit_logs for all to authenticated using (true) with check (true);
