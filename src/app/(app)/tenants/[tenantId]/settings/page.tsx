import { TenantSettingsForm } from "@/components/tenant/tenant-settings-form";
import { requireTenantRole } from "@/server/auth/guards";

export default async function TenantSettingsPage({ params: paramsPromise }: { params: Promise<{ tenantId: string }> }) {
  const params = await paramsPromise;
  const { tenant } = await requireTenantRole(params.tenantId, "ADMIN");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Einstellungen</h1>
        <p className="mt-2 text-muted-foreground">Tenant-Metadaten und sichere Standardwerte.</p>
      </div>
      <TenantSettingsForm tenant={tenant} />
    </div>
  );
}
