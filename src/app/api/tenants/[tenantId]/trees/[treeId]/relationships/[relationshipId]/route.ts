import { AuditAction, type Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { auditLog } from "@/server/audit";
import { badRequest, handleApiError, notFound } from "@/server/api/errors";
import { requestContext } from "@/server/api/request";
import { requireCanEditFamilyTree, requireFamilyTreeAccess } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { updateRelationshipSchema } from "@/server/validators/family-tree";
import { wouldCreateParentCycle } from "@/server/validators/plausibility";

export async function GET(_: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string; treeId: string; relationshipId: string }> }) {
  try {
    const params = await paramsPromise;
    await requireFamilyTreeAccess(params.tenantId, params.treeId);
    const relationship = await prisma.relationship.findFirst({
      where: {
        id: params.relationshipId,
        tenantId: params.tenantId,
        treeId: params.treeId,
        deletedAt: null
      },
      include: { sources: { where: { deletedAt: null } }, customValues: { include: { definition: true } } }
    });
    if (!relationship) throw notFound("Beziehung nicht gefunden.");
    return NextResponse.json({ relationship });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string; treeId: string; relationshipId: string }> }) {
  try {
    const params = await paramsPromise;
    const { session } = await requireCanEditFamilyTree(params.tenantId, params.treeId);
    const input = updateRelationshipSchema.parse(await request.json());
    const current = await prisma.relationship.findFirst({
      where: { id: params.relationshipId, tenantId: params.tenantId, treeId: params.treeId, deletedAt: null }
    });
    if (!current) throw notFound("Beziehung nicht gefunden.");

    const sourcePersonId = input.sourcePersonId ?? current.sourcePersonId;
    const targetPersonId = input.targetPersonId ?? current.targetPersonId;
    const type = input.type ?? current.type;
    const peopleCount = await prisma.personNode.count({
      where: {
        tenantId: params.tenantId,
        treeId: params.treeId,
        deletedAt: null,
        id: { in: [sourcePersonId, targetPersonId] }
      }
    });
    if (peopleCount < 2) throw notFound("Mindestens eine Person wurde nicht gefunden.");

    const existing = await prisma.relationship.findMany({
      where: { tenantId: params.tenantId, treeId: params.treeId, deletedAt: null, id: { not: params.relationshipId } },
      select: { id: true, sourcePersonId: true, targetPersonId: true, type: true }
    });

    if (wouldCreateParentCycle(existing, sourcePersonId, targetPersonId, type)) {
      throw badRequest("Diese Änderung würde einen zirkulären Eltern-Kind-Bezug erzeugen.");
    }

    const relationship = await prisma.relationship.update({
      where: { id: params.relationshipId },
      data: {
        ...input,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
        updatedById: session.user.id
      }
    });

    await auditLog({
      tenantId: params.tenantId,
      actorId: session.user.id,
      action: AuditAction.RELATIONSHIP_UPDATED,
      entityType: "Relationship",
      entityId: relationship.id,
      metadata: { fields: Object.keys(input) },
      ...requestContext(request)
    });

    return NextResponse.json({ relationship });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string; treeId: string; relationshipId: string }> }) {
  try {
    const params = await paramsPromise;
    const { session } = await requireCanEditFamilyTree(params.tenantId, params.treeId);
    const updated = await prisma.relationship.updateMany({
      where: {
        id: params.relationshipId,
        tenantId: params.tenantId,
        treeId: params.treeId,
        deletedAt: null
      },
      data: {
        deletedAt: new Date(),
        updatedById: session.user.id
      }
    });
    if (updated.count === 0) throw notFound("Beziehung nicht gefunden.");

    await auditLog({
      tenantId: params.tenantId,
      actorId: session.user.id,
      action: AuditAction.RELATIONSHIP_DELETED,
      entityType: "Relationship",
      entityId: params.relationshipId,
      ...requestContext(request)
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
