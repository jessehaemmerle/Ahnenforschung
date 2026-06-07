import { AuditAction } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { auditLog } from "@/server/audit";
import { assertRateLimit } from "@/server/api/rate-limit";
import { handleApiError } from "@/server/api/errors";
import { requestContext } from "@/server/api/request";
import { requireCanEditFamilyTree } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { editorSnapshotSchema } from "@/server/validators/family-tree";

export async function PATCH(request: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string; treeId: string }> }) {
  try {
    const params = await paramsPromise;
    assertRateLimit(request, "editor-snapshot");
    const { session } = await requireCanEditFamilyTree(params.tenantId, params.treeId);
    const input = editorSnapshotSchema.parse(await request.json());

    await prisma.$transaction([
      ...input.people.map((person) =>
        prisma.personNode.updateMany({
          where: {
            id: person.id,
            tenantId: params.tenantId,
            treeId: params.treeId,
            deletedAt: null
          },
          data: {
            x: person.x,
            y: person.y,
            updatedById: session.user.id
          }
        })
      ),
      prisma.familyTree.update({
        where: { id: params.treeId },
        data: { updatedById: session.user.id }
      })
    ]);

    await auditLog({
      tenantId: params.tenantId,
      actorId: session.user.id,
      action: AuditAction.FAMILY_TREE_UPDATED,
      entityType: "FamilyTree",
      entityId: params.treeId,
      metadata: { positionUpdates: input.people.length },
      ...requestContext(request)
    });

    return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (error) {
    return handleApiError(error);
  }
}
