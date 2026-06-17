import { ModuleRoute } from "../_components/module-route";

export default async function DocumentsPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams?.q === "string" ? searchParams.q : "";
  return <ModuleRoute moduleKey="documents" searchQuery={q} />;
}

