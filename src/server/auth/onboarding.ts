import { AuditAction } from "@prisma/client";
import type { User } from "@prisma/client";

import { prisma } from "@/server/db";
import { uniqueSlug } from "@/server/slug";

export async function ensureDefaultTenantForUser(user: Pick<User, "id" | "name" | "email">) {
  const membershipCount = await prisma.tenantMembership.count({
    where: { userId: user.id, tenant: { deletedAt: null } }
  });

  if (membershipCount > 0) return;

  const displayName = user.name?.trim() || user.email?.split("@")[0] || "Neue Familie";
  const tenantName = `${displayName}s Familie`;

  await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: tenantName,
        slug: uniqueSlug(tenantName, user.id),
        memberships: {
          create: {
            userId: user.id,
            role: "OWNER"
          }
        }
      }
    });

    await tx.auditLog.create({
      data: {
        tenantId: tenant.id,
        actorId: user.id,
        action: AuditAction.TENANT_CREATED,
        entityType: "Tenant",
        entityId: tenant.id,
        metadata: { source: "first_login" }
      }
    });
  });
}
