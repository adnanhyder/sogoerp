import { ModuleRoute } from "../_components/module-route";

type InventoryPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const params = await searchParams;

  return <ModuleRoute moduleKey="inventory" searchQuery={params?.q ?? ""} />;
}
