import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateTreeDialog } from "@/components/dashboard/create-tree-dialog";
import { requireTenantAccess } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { canEdit } from "@/server/security/rbac";
import { formatDate } from "@/lib/utils";

export default async function TreeListPage({ params: paramsPromise }: { params: Promise<{ tenantId: string }> }) {
  const params = await paramsPromise;
  const { tenant, membership } = await requireTenantAccess(params.tenantId);
  const trees = await prisma.familyTree.findMany({
    where: { tenantId: params.tenantId, deletedAt: null },
    include: { _count: { select: { people: { where: { deletedAt: null } }, relationships: { where: { deletedAt: null } } } } },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold">{tenant.name}</h1>
            <Badge variant="outline">{membership.role}</Badge>
          </div>
          <p className="mt-2 text-muted-foreground">Alle Stammbäume dieses Tenants.</p>
        </div>
        {canEdit(membership.role) ? <CreateTreeDialog tenantId={params.tenantId} /> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {trees.map((tree) => (
          <Link key={tree.id} href={`/tenants/${params.tenantId}/trees/${tree.id}`}>
            <Card className="h-full transition hover:border-primary/50 hover:shadow-soft">
              <CardHeader>
                <CardTitle>{tree.name}</CardTitle>
                <CardDescription>{tree.description || "Kein Beschreibungstext"}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {tree._count.people} Personen · {tree._count.relationships} Beziehungen
                </p>
                <p className="mt-3 text-xs text-muted-foreground">Aktualisiert {formatDate(tree.updatedAt)}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {!trees.length ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <h2 className="font-bold">Noch kein Stammbaum</h2>
          <p className="mt-2 text-sm text-muted-foreground">Lege den ersten Stammbaum an und starte mit einer Person.</p>
        </div>
      ) : null}
    </div>
  );
}
