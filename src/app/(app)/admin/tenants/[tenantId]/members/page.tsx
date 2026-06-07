import Link from "next/link";

import { Button } from "@/components/ui/button";
import { MemberManager } from "@/components/tenant/member-manager";
import { requireTenantAdminPageAccess } from "@/server/auth/page-guards";
import { prisma } from "@/server/db";

export default async function TenantAdminMembersPage({ params: paramsPromise }: { params: Promise<{ tenantId: string }> }) {
  const params = await paramsPromise;
  await requireTenantAdminPageAccess(params.tenantId);
  const members = await prisma.tenantMembership.findMany({
    where: { tenantId: params.tenantId },
    include: { user: { select: { name: true, email: true } } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }]
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Admin</p>
          <h1 className="text-3xl font-extrabold">Mitgliederverwaltung</h1>
          <p className="mt-2 text-muted-foreground">Owner und Admins verwalten Rollen und Zugriff.</p>
        </div>
        <Button asChild>
          <Link href={`/admin/tenants/${params.tenantId}/invitations`}>Einladungen</Link>
        </Button>
      </div>
      <MemberManager tenantId={params.tenantId} members={members} />
    </div>
  );
}

