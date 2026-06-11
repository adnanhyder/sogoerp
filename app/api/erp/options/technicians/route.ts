import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type TechnicianOption = {
  active: boolean;
  cities: string | null;
  id: string;
  name: string;
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("technicians")
    .select("id,name,cities,active")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const technicians = (data ?? []) as TechnicianOption[];
  const ids = technicians.map((technician) => technician.id);
  const deviceCounts = new Map<string, number>();

  if (ids.length) {
    const { data: devices, error: deviceError } = await supabase
      .from("devices")
      .select("technician_id")
      .in("technician_id", ids);

    if (deviceError) {
      return NextResponse.json({ error: deviceError.message }, { status: 400 });
    }

    for (const device of devices ?? []) {
      const technicianId = String(device.technician_id);
      deviceCounts.set(technicianId, (deviceCounts.get(technicianId) ?? 0) + 1);
    }
  }

  return NextResponse.json({
    technicians: technicians.map((technician) => ({
      active: technician.active,
      cities: technician.cities ?? "",
      deviceCount: deviceCounts.get(technician.id) ?? 0,
      id: technician.id,
      name: technician.name,
    })),
  });
}
