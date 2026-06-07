import Link from "next/link";
import { GitBranch, UsersRound, Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateTreeDialog } from "@/components/dashboard/create-tree-dialog";
import { CreateTenantDialog } from "@/components/tenant/create-tenant-dialog";
import { requireAuth } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { canEdit } from "@/server/security/rbac";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await requireAuth();
  const memberships = await prisma.tenantMembership.findMany({
    where: { userId: session.user.id, tenant: { deletedAt: null } },
    include: {
      tenant: {
        include: {
          _count: { select: { familyTrees: { where: { deletedAt: null } }, memberships: true } },
          familyTrees: {
            where: { deletedAt: null },
            orderBy: { updatedAt: "desc" },
            take: 3,
            include: { _count: { select: { people: { where: { deletedAt: null } }, relationships: { where: { deletedAt: null } } } } }
          }
        }
      }
    },
    orderBy: { createdAt: "asc" }
  });
  const primary = memberships[0];
  const recentTrees = memberships.flatMap((membership) =>
    membership.tenant.familyTrees.map((tree) => ({ ...tree, tenantName: membership.tenant.name, tenantId: membership.tenant.id }))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Dashboard</p>
          <h1 className="text-3xl font-extrabold">Willkommen zurück</h1>
          <p className="mt-2 text-muted-foreground">Deine Tenants, Stammbäume und letzten Bearbeitungen auf einen Blick.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CreateTenantDialog />
          {primary && canEdit(primary.role) ? <CreateTreeDialog tenantId={primary.tenantId} /> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UsersRound className="h-4 w-4 text-primary" />
              Tenants
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-extrabold">{memberships.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GitBranch className="h-4 w-4 text-primary" />
              Stammbäume
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-extrabold">
            {memberships.reduce((sum, membership) => sum + membership.tenant._count.familyTrees, 0)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock3 className="h-4 w-4 text-primary" />
              Zuletzt bearbeitet
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{recentTrees[0] ? formatDate(recentTrees[0].updatedAt) : "Noch keine Daten"}</CardContent>
        </Card>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Zuletzt bearbeitete Stammbäume</CardTitle>
            <CardDescription>Springe direkt zurück in den Editor.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTrees.length ? (
              recentTrees.slice(0, 8).map((tree) => (
                <Link
                  key={tree.id}
                  href={`/tenants/${tree.tenantId}/trees/${tree.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent"
                >
                  <div>
                    <p className="font-semibold">{tree.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {tree.tenantName} · {tree._count.people} Personen · {tree._count.relationships} Beziehungen
                    </p>
                  </div>
                  <Badge variant="outline">{formatDate(tree.updatedAt)}</Badge>
                </Link>
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                Noch kein Stammbaum vorhanden.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tenants</CardTitle>
            <CardDescription>Rollen und Arbeitsbereiche</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {memberships.map((membership) => (
              <Link key={membership.id} href={`/tenants/${membership.tenantId}/trees`} className="block rounded-lg border p-4 hover:bg-accent">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{membership.tenant.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {membership.tenant._count.familyTrees} Stammbäume · {membership.tenant._count.memberships} Mitglieder
                    </p>
                  </div>
                  <Badge variant="outline">{membership.role}</Badge>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
