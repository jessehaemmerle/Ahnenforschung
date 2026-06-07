import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireTenantRole } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { formatDate } from "@/lib/utils";

export default async function AuditLogPage({ params: paramsPromise }: { params: Promise<{ tenantId: string }> }) {
  const params = await paramsPromise;
  await requireTenantRole(params.tenantId, "ADMIN");
  const logs = await prisma.auditLog.findMany({
    where: { tenantId: params.tenantId },
    include: { actor: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Audit Log</h1>
        <p className="mt-2 text-muted-foreground">Wichtige Aktionen werden nachvollziehbar protokolliert.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Letzte Ereignisse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="grid gap-2 rounded-lg border p-4 md:grid-cols-[220px_1fr_160px] md:items-center">
              <Badge variant="outline">{log.action}</Badge>
              <div>
                <p className="font-semibold">{log.entityType}</p>
                <p className="text-sm text-muted-foreground">{log.actor?.name || log.actor?.email || "System"}</p>
              </div>
              <p className="text-sm text-muted-foreground">{formatDate(log.createdAt)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
