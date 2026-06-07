import { redirect } from "next/navigation";

import { requireTenantAdminPageAccess } from "@/server/auth/page-guards";

export default async function TenantAdminIndexPage({ params: paramsPromise }: { params: Promise<{ tenantId: string }> }) {
  const params = await paramsPromise;
  await requireTenantAdminPageAccess(params.tenantId);
  redirect(`/admin/tenants/${params.tenantId}/members`);
}

