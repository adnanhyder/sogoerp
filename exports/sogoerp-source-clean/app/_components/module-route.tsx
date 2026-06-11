import { ModulePage } from "./module-page";
import { createConfigs, type CreateModuleKey } from "@/lib/create-config";
import { moduleConfigs, type ModuleKey } from "@/lib/module-config";
import { getModuleData } from "@/lib/erp-queries";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type ModuleRouteProps = {
  moduleKey: ModuleKey;
  searchQuery?: string;
};

export async function ModuleRoute({ moduleKey, searchQuery = "" }: ModuleRouteProps) {
  const user = await requireUser();
  const supabase = await createClient();
  const config = moduleConfigs[moduleKey];
  const moduleData = await getModuleData(supabase, moduleKey, { searchQuery });
  const createConfig = createConfigs[moduleKey as CreateModuleKey];

  return (
    <ModulePage
      {...config}
      createConfig={createConfig}
      databaseError={moduleData.error}
      metrics={moduleData.data.metrics}
      tableRows={moduleData.data.rows}
      searchQuery={searchQuery}
      user={user}
    />
  );
}
