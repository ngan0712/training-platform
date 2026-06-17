import { requireAdmin } from "@/lib/auth/session";
import { getModules } from "@/lib/db/modules";
import { getAllMaterials } from "@/lib/db/materials";
import { ModuleListTable } from "@/components/admin/ModuleListTable";

export default async function AdminModulesPage() {
  await requireAdmin();

  const [modules, materials] = await Promise.all([getModules(), getAllMaterials()]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Curriculum</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {modules.length} modules · {materials.length} materials
        </p>
      </div>
      <ModuleListTable modules={modules} materials={materials} />
    </div>
  );
}
