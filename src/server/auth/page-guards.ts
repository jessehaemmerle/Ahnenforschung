import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/server/auth/options";
import { prisma } from "@/server/db";
import { hasAtLeastRole } from "@/server/security/rbac";

export async function requireTenantAdminPageAccess(tenantId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const membership = await prisma.tenantMembership.findFirst({
    where: {
      tenantId,
      userId: session.user.id,
      tenant: { deletedAt: null }
    },
    include: { tenant: true }
  });

  if (!membership || !hasAtLeastRole(membership.role, "ADMIN")) {
    notFound();
  }

  return { session, membership, tenant: membership.tenant };
}
