import { AuditAction, PrivacyStatus, TenantRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { auditLog } from "@/server/audit";
import { handleApiError } from "@/server/api/errors";
import { requestContext } from "@/server/api/request";
import { requireCanEditFamilyTree, requireFamilyTreeAccess } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { hasAtLeastRole } from "@/server/security/rbac";
import { updateFamilyTreeSchema } from "@/server/validators/family-tree";

function visiblePrivacy(role: TenantRole, userId: string) {
  const admin = hasAtLeastRole(role, "ADMIN");
  return (createdById: string) =>
    admin
      ? [{ privacy: { in: [PrivacyStatus.TENANT, PrivacyStatus.ADMINS, PrivacyStatus.PRIVATE] } }]
      : [
          { privacy: PrivacyStatus.TENANT },
          { privacy: PrivacyStatus.PRIVATE, createdById },
          { privacy: PrivacyStatus.ADMINS, createdById }
        ];
}

export async function GET(_: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string; treeId: string }> }) {
  try {
    const params = await paramsPromise;
    const { session, membership, tree } = await requireFamilyTreeAccess(params.tenantId, params.treeId);
    const privacyOr = visiblePrivacy(membership.role, session.user.id)(session.user.id);

    const people = await prisma.personNode.findMany({
      where: {
        tenantId: params.tenantId,
        treeId: params.treeId,
        deletedAt: null,
        OR: privacyOr
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }]
    });
    const visiblePersonIds = new Set(people.map((person) => person.id));
    const relationships = await prisma.relationship.findMany({
      where: {
        tenantId: params.tenantId,
        treeId: params.treeId,
        deletedAt: null,
        OR: hasAtLeastRole(membership.role, "ADMIN")
          ? undefined
          : [{ privacy: PrivacyStatus.TENANT }, { privacy: PrivacyStatus.PRIVATE, createdById: session.user.id }]
      },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json({
      tree,
      role: membership.role,
      people,
      relationships: relationships.filter(
        (relationship) =>
          visiblePersonIds.has(relationship.sourcePersonId) && visiblePersonIds.has(relationship.targetPersonId)
      )
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string; treeId: string }> }) {
  try {
    const params = await paramsPromise;
    const { session } = await requireCanEditFamilyTree(params.tenantId, params.treeId);
    const input = updateFamilyTreeSchema.parse(await request.json());

    const tree = await prisma.familyTree.update({
      where: { id: params.treeId },
      data: {
        ...input,
        description: input.description || undefined,
        updatedById: session.user.id
      }
    });

    await auditLog({
      tenantId: params.tenantId,
      actorId: session.user.id,
      action: AuditAction.FAMILY_TREE_UPDATED,
      entityType: "FamilyTree",
      entityId: tree.id,
      metadata: input,
      ...requestContext(request)
    });

    return NextResponse.json({ tree });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string; treeId: string }> }) {
  try {
    const params = await paramsPromise;
    const { session } = await requireCanEditFamilyTree(params.tenantId, params.treeId);
    const tree = await prisma.familyTree.update({
      where: { id: params.treeId },
      data: {
        deletedAt: new Date(),
        updatedById: session.user.id
      }
    });

    await auditLog({
      tenantId: params.tenantId,
      actorId: session.user.id,
      action: AuditAction.FAMILY_TREE_DELETED,
      entityType: "FamilyTree",
      entityId: tree.id,
      ...requestContext(request)
    });

    return NextResponse.json({ tree });
  } catch (error) {
    return handleApiError(error);
  }
}
