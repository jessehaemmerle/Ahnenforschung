import { TenantSettingsForm } from "@/components/tenant/tenant-settings-form";
import { requireTenantAdminPageAccess } from "@/server/auth/page-guards";

export default async function TenantAdminSettingsPage({ params: paramsPromise }: { params: Promise<{ tenantId: string }> }) {
  const params = await paramsPromise;
  const { tenant } = await requireTenantAdminPageAccess(params.tenantId);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Admin</p>
        <h1 className="text-3xl font-extrabold">Einstellungen</h1>
        <p className="mt-2 text-muted-foreground">Tenant-Metadaten und sichere Standardwerte.</p>
      </div>
      <TenantSettingsForm tenant={tenant} />
    </div>
  );
}

