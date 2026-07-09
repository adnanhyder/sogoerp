import { ModuleRoute } from "../_components/module-route";

type InventoryPageProps = {
  searchParams?: Promise<{
    page?: string;
    q?: string;
  }>;
};

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const params = await searchParams;
  const requestedPage = Number(params?.page ?? "1");
  const page = Number.isFinite(requestedPage) ? Math.max(1, Math.floor(requestedPage)) : 1;

  return <ModuleRoute moduleKey="inventory" page={page} searchQuery={params?.q ?? ""} />;
}
