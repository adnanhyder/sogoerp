import { ErpShell } from "../_components/erp-shell";
import { SearchForm } from "../_components/search-form";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type SearchPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const user = await requireUser();
  const supabase = await createClient();
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const like = `%${query}%`;

  const results: { href: string; meta: string; title: string; type: string }[] = [];
  let error = "";

  if (query) {
    const { data: matchingTechnicians, error: matchingTechniciansError } = await supabase
      .from("technicians")
      .select("id")
      .ilike("name", like)
      .limit(50);
    const technicianIds = (matchingTechnicians ?? []).map((technician) => technician.id).filter(Boolean);
    const { data: matchingLeads, error: matchingLeadsError } = technicianIds.length
      ? await supabase.from("leads").select("id").in("assigned_technician_id", technicianIds).limit(50)
      : { data: [], error: null };
    const leadIds = (matchingLeads ?? []).map((lead) => lead.id).filter(Boolean);

    const [leads, technicianLeads, customers, technicianCustomers, devices, sims, technicians] = await Promise.all([
      supabase.from("leads").select("id,name,phone,stage").or(`name.ilike.${like},phone.ilike.${like}`).limit(8),
      technicianIds.length
        ? supabase.from("leads").select("id,name,phone,stage").in("assigned_technician_id", technicianIds).limit(8)
        : Promise.resolve({ data: [], error: null }),
      supabase.from("customers").select("id,full_name,phone,area").or(`full_name.ilike.${like},phone.ilike.${like}`).limit(8),
      leadIds.length
        ? supabase.from("customers").select("id,full_name,phone,area").in("source_lead_id", leadIds).limit(8)
        : Promise.resolve({ data: [], error: null }),
      supabase.from("devices").select("id,imei,status").ilike("imei", like).limit(8),
      supabase.from("sims").select("id,sim_number,network_provider").ilike("sim_number", like).limit(8),
      supabase.from("technicians").select("id,name,phone,area_coverage").or(`name.ilike.${like},phone.ilike.${like}`).limit(8),
    ]);

    const firstError = [
      matchingTechniciansError,
      matchingLeadsError,
      leads.error,
      technicianLeads.error,
      customers.error,
      technicianCustomers.error,
      devices.error,
      sims.error,
      technicians.error,
    ].find(Boolean);
    error = firstError?.message ?? "";

    const leadResults = new Map<string, NonNullable<typeof leads.data>[number]>();
    for (const lead of [...(leads.data ?? []), ...(technicianLeads.data ?? [])]) {
      leadResults.set(lead.id, lead);
    }

    for (const lead of leadResults.values()) {
      results.push({
        href: "/leads",
        meta: `${lead.phone ?? "-"} / ${String(lead.stage).replaceAll("_", " ")}`,
        title: lead.name,
        type: "Lead",
      });
    }

    const customerResults = new Map<string, NonNullable<typeof customers.data>[number]>();
    for (const customer of [...(customers.data ?? []), ...(technicianCustomers.data ?? [])]) {
      customerResults.set(customer.id, customer);
    }

    for (const customer of customerResults.values()) {
      results.push({
        href: "/customers",
        meta: `${customer.phone ?? "-"} / ${customer.area ?? "-"}`,
        title: customer.full_name,
        type: "Customer",
      });
    }

    for (const device of devices.data ?? []) {
      results.push({
        href: "/inventory",
        meta: String(device.status).replaceAll("_", " "),
        title: device.imei,
        type: "Device",
      });
    }

    for (const sim of sims.data ?? []) {
      results.push({
        href: "/sim-config",
        meta: sim.network_provider ?? "-",
        title: sim.sim_number,
        type: "SIM",
      });
    }

    for (const technician of technicians.data ?? []) {
      results.push({
        href: "/technicians",
        meta: `${technician.phone ?? "-"} / ${technician.area_coverage ?? "-"}`,
        title: technician.name,
        type: "Technician",
      });
    }
  }

  return (
    <ErpShell activeHref="/search" title="Search" user={user}>
      <section className="rounded-[8px] border border-[#d2d2d2] bg-white p-5 sm:p-7">
        <SearchForm query={query} />
      </section>

      {error ? (
        <section className="mt-3 rounded-[8px] border border-[#d2d2d2] bg-white p-5 text-sm font-semibold text-black">
          Database search error: {error}
        </section>
      ) : null}

      <section className="mt-3 rounded-[8px] border border-[#d2d2d2] bg-white p-5 sm:p-7">
        <h2 className="text-lg font-bold text-black">Results</h2>
        <div className="mt-5 space-y-2">
          {!query ? (
            <p className="text-sm font-semibold text-[#777777]">Enter a search query.</p>
          ) : results.length ? (
            results.map((result) => (
              <a
                className="flex items-center justify-between rounded-[8px] border border-[#d2d2d2] bg-[#fbfbfb] p-4 transition hover:border-black"
                href={result.href}
                key={`${result.type}-${result.title}-${result.meta}`}
              >
                <span>
                  <span className="block text-sm font-bold text-black">{result.title}</span>
                  <span className="mt-1 block text-xs font-medium text-[#777777]">{result.meta}</span>
                </span>
                <span className="rounded-[6px] bg-black px-3 py-1 text-xs font-bold text-white">
                  {result.type}
                </span>
              </a>
            ))
          ) : (
            <p className="text-sm font-semibold text-[#777777]">No results found.</p>
          )}
        </div>
      </section>
    </ErpShell>
  );
}
