import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateTenantDialog } from "@/components/tenant/create-tenant-dialog";
import { requireAuth } from "@/server/auth/guards";
import { prisma } from "@/server/db";

export default async function TenantsPage() {
  const session = await requireAuth();
  const memberships = await prisma.tenantMembership.findMany({
    where: { userId: session.user.id, tenant: { deletedAt: null } },
    include: { tenant: { include: { _count: { select: { familyTrees: { where: { deletedAt: null } }, memberships: true } } } } },
    orderBy: { createdAt: "asc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Tenant-Auswahl</h1>
          <p className="mt-2 text-muted-foreground">Arbeitsbereiche sind strikt voneinander getrennt.</p>
        </div>
        <CreateTenantDialog />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {memberships.map((membership) => (
          <Card key={membership.id}>
            <CardHeader>
              <CardTitle>{membership.tenant.name}</CardTitle>
              <CardDescription>{membership.tenant.description || "Keine Beschreibung"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {membership.tenant._count.familyTrees} Stammbäume · {membership.tenant._count.memberships} Mitglieder
                </span>
                <Badge variant="outline">{membership.role}</Badge>
              </div>
              <Link href={`/tenants/${membership.tenantId}/trees`} className="mt-4 inline-block text-sm font-semibold text-primary">
                Stammbäume öffnen
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
