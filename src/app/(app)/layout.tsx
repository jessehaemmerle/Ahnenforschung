import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { AppShell } from "@/components/layout/app-shell";
import { authOptions } from "@/server/auth/options";
import { ensureDefaultTenantForUser } from "@/server/auth/onboarding";
import { prisma } from "@/server/db";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  await ensureDefaultTenantForUser({
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null
  });

  const memberships = await prisma.tenantMembership.findMany({
    where: { userId: session.user.id, tenant: { deletedAt: null } },
    include: { tenant: true },
    orderBy: { createdAt: "asc" }
  });

  return (
    <AppShell
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image
      }}
      memberships={memberships.map((membership) => ({
        id: membership.id,
        role: membership.role,
        tenant: {
          id: membership.tenant.id,
          name: membership.tenant.name,
          slug: membership.tenant.slug
        }
      }))}
    >
      {children}
    </AppShell>
  );
}
