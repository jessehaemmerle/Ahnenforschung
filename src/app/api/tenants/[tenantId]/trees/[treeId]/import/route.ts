import { AuditAction, type Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { auditLog } from "@/server/audit";
import { handleApiError } from "@/server/api/errors";
import { assertRateLimit } from "@/server/api/rate-limit";
import { requestContext } from "@/server/api/request";
import { requireCanEditFamilyTree } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { importFamilyTreeSchema } from "@/server/validators/family-tree";

export async function POST(request: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string; treeId: string }> }) {
  try {
    const params = await paramsPromise;
    assertRateLimit(request, "tree-import");
    const { session } = await requireCanEditFamilyTree(params.tenantId, params.treeId);
    const input = importFamilyTreeSchema.parse(await request.json());
    const idMap = new Map<string, string>();

    await prisma.$transaction(async (tx) => {
      for (const person of input.people) {
        const imported = await tx.personNode.create({
          data: {
            ...person,
            id: undefined,
            tags: person.tags as Prisma.InputJsonValue,
            customData: person.customData as Prisma.InputJsonValue,
            tenantId: params.tenantId,
            treeId: params.treeId,
            createdById: session.user.id,
            updatedById: session.user.id
          }
        });
        if (person.id) idMap.set(person.id, imported.id);
      }

      for (const relationship of input.relationships) {
        const sourcePersonId = idMap.get(relationship.sourcePersonId) ?? relationship.sourcePersonId;
        const targetPersonId = idMap.get(relationship.targetPersonId) ?? relationship.targetPersonId;
        const sourceExists = await tx.personNode.count({
          where: { id: sourcePersonId, tenantId: params.tenantId, treeId: params.treeId, deletedAt: null }
        });
        const targetExists = await tx.personNode.count({
          where: { id: targetPersonId, tenantId: params.tenantId, treeId: params.treeId, deletedAt: null }
        });
        if (!sourceExists || !targetExists) continue;

        await tx.relationship.create({
          data: {
            ...relationship,
            id: undefined,
            metadata: relationship.metadata as Prisma.InputJsonValue,
            sourcePersonId,
            targetPersonId,
            tenantId: params.tenantId,
            treeId: params.treeId,
            createdById: session.user.id,
            updatedById: session.user.id
          }
        });
      }

      await tx.familyTree.update({
        where: { id: params.treeId },
        data: {
          name: input.name || undefined,
          updatedById: session.user.id
        }
      });
    });

    await auditLog({
      tenantId: params.tenantId,
      actorId: session.user.id,
      action: AuditAction.IMPORT_COMPLETED,
      entityType: "FamilyTree",
      entityId: params.treeId,
      metadata: { people: input.people.length, relationships: input.relationships.length },
      ...requestContext(request)
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
