import { ModuleRoute } from "../_components/module-route";

export default async function CustomersPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams?.q === "string" ? searchParams.q : "";
  const requestedPage = typeof searchParams?.page === "string" ? Number(searchParams.page) : 1;
  const page = Number.isFinite(requestedPage) ? Math.max(1, Math.floor(requestedPage)) : 1;
  return <ModuleRoute moduleKey="customers" page={page} searchQuery={q} />;
}

