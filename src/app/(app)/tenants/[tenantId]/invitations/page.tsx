import { InvitationManager } from "@/components/tenant/invitation-manager";
import { requireTenantRole } from "@/server/auth/guards";
import { prisma } from "@/server/db";

export default async function InvitationsPage({ params: paramsPromise }: { params: Promise<{ tenantId: string }> }) {
  const params = await paramsPromise;
  await requireTenantRole(params.tenantId, "ADMIN");
  const invitations = await prisma.invitation.findMany({
    where: { tenantId: params.tenantId },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Einladungen</h1>
        <p className="mt-2 text-muted-foreground">Neue Mitglieder sicher per Token und optional per SMTP einladen.</p>
      </div>
      <InvitationManager
        tenantId={params.tenantId}
        invitations={invitations.map((invitation) => ({
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          createdAt: invitation.createdAt.toISOString()
        }))}
      />
    </div>
  );
}
