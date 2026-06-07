import { requireAuth } from "@/server/auth/guards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/server/db";

export default async function ProfilePage() {
  const session = await requireAuth();
  const memberships = await prisma.tenantMembership.findMany({
    where: { userId: session.user.id, tenant: { deletedAt: null } },
    include: { tenant: true },
    orderBy: { createdAt: "asc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Profil</h1>
        <p className="mt-2 text-muted-foreground">Sitzung, E-Mail und Tenant-Rollen.</p>
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{session.user.name || session.user.email}</CardTitle>
          <CardDescription>{session.user.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {memberships.map((membership) => (
            <div key={membership.id} className="flex items-center justify-between rounded-md border p-3">
              <span className="font-semibold">{membership.tenant.name}</span>
              <span className="text-sm text-muted-foreground">{membership.role}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
