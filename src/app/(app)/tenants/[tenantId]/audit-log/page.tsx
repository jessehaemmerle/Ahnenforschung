import { redirect } from "next/navigation";

import { requireTenantAdminPageAccess } from "@/server/auth/page-guards";

export default async function LegacyAuditLogPage({ params: paramsPromise }: { params: Promise<{ tenantId: string }> }) {
  const params = await paramsPromise;
  await requireTenantAdminPageAccess(params.tenantId);
  redirect(`/admin/tenants/${params.tenantId}/audit-log`);
}
