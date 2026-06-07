import Link from "next/link";

import { Button } from "@/components/ui/button";
import { MemberManager } from "@/components/tenant/member-manager";
import { requireTenantRole } from "@/server/auth/guards";
import { prisma } from "@/server/db";

export default async function MembersPage({ params: paramsPromise }: { params: Promise<{ tenantId: string }> }) {
  const params = await paramsPromise;
  await requireTenantRole(params.tenantId, "ADMIN");
  const members = await prisma.tenantMembership.findMany({
    where: { tenantId: params.tenantId },
    include: { user: { select: { name: true, email: true } } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }]
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Mitgliederverwaltung</h1>
          <p className="mt-2 text-muted-foreground">Owner und Admins verwalten Rollen und Zugriff.</p>
        </div>
        <Button asChild>
          <Link href={`/tenants/${params.tenantId}/invitations`}>Einladungen</Link>
        </Button>
      </div>
      <MemberManager tenantId={params.tenantId} members={members} />
    </div>
  );
}
