import { TenantRole } from "@prisma/client";
import { getServerSession } from "next-auth";

import { forbidden, notFound, unauthorized } from "@/server/api/errors";
import { prisma } from "@/server/db";
import { authOptions } from "./options";
import { canEdit, hasAtLeastRole } from "@/server/security/rbac";

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    throw unauthorized();
  }
  return session;
}

export async function requireTenantAccess(tenantId: string) {
  const session = await requireAuth();
  const membership = await prisma.tenantMembership.findFirst({
    where: {
      tenantId,
      userId: session.user.id,
      tenant: { deletedAt: null }
    },
    include: { tenant: true }
  });

  if (!membership) {
    throw forbidden("Du hast keinen Zugriff auf diesen Tenant.");
  }

  return { session, membership, tenant: membership.tenant };
}

export async function requireTenantRole(tenantId: string, role: TenantRole) {
  const context = await requireTenantAccess(tenantId);
  if (!hasAtLeastRole(context.membership.role, role)) {
    throw forbidden("Deine Rolle erlaubt diese Aktion nicht.");
  }
  return context;
}

export async function requireFamilyTreeAccess(tenantId: string, treeId: string) {
  const context = await requireTenantAccess(tenantId);
  const tree = await prisma.familyTree.findFirst({
    where: {
      id: treeId,
      tenantId,
      deletedAt: null
    }
  });

  if (!tree) {
    throw notFound("Stammbaum nicht gefunden.");
  }

  return { ...context, tree };
}

export async function requireCanEditFamilyTree(tenantId: string, treeId: string) {
  const context = await requireFamilyTreeAccess(tenantId, treeId);
  if (!canEdit(context.membership.role)) {
    throw forbidden("Viewer dürfen Stammbäume nicht bearbeiten.");
  }
  return context;
}
