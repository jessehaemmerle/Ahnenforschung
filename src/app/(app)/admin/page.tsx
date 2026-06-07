import { redirect } from "next/navigation";

import { requireAuth } from "@/server/auth/guards";
import { prisma } from "@/server/db";

export default async function AdminIndexPage() {
  const session = await requireAuth();
  const membership = await prisma.tenantMembership.findFirst({
    where: {
      userId: session.user.id,
      role: { in: ["ADMIN", "OWNER"] },
      tenant: { deletedAt: null }
    },
    orderBy: { createdAt: "asc" }
  });

  if (!membership) redirect("/dashboard");

  redirect(`/admin/tenants/${membership.tenantId}/members`);
}

