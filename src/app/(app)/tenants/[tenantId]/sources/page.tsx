import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireTenantAccess } from "@/server/auth/guards";
import { prisma } from "@/server/db";

export default async function SourcesPage({ params: paramsPromise }: { params: Promise<{ tenantId: string }> }) {
  const params = await paramsPromise;
  await requireTenantAccess(params.tenantId);
  const sources = await prisma.source.findMany({
    where: { tenantId: params.tenantId, deletedAt: null },
    include: {
      tree: { select: { name: true } },
      person: { select: { firstName: true, lastName: true } }
    },
    orderBy: { updatedAt: "desc" },
    take: 200
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Quellenübersicht</h1>
        <p className="mt-2 text-muted-foreground">Quellen aus allen Stammbäumen dieses Tenants.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Quellen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sources.map((source) => (
            <div key={source.id} className="rounded-lg border p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-semibold">{source.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {source.tree.name}
                    {source.person ? ` · ${source.person.firstName} ${source.person.lastName}` : ""}
                  </p>
                  {source.citation ? <p className="mt-2 text-sm">{source.citation}</p> : null}
                </div>
                <Badge variant="outline">{source.type}</Badge>
              </div>
            </div>
          ))}
          {!sources.length ? <p className="text-sm text-muted-foreground">Noch keine Quellen vorhanden.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
