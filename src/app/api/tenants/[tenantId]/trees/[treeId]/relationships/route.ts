import { AuditAction, RelationshipType, type Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { auditLog } from "@/server/audit";
import { badRequest, handleApiError, notFound } from "@/server/api/errors";
import { assertRateLimit } from "@/server/api/rate-limit";
import { requestContext } from "@/server/api/request";
import { requireCanEditFamilyTree, requireFamilyTreeAccess } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { relationshipSchema } from "@/server/validators/family-tree";
import { validateParentChildDates, wouldCreateParentCycle } from "@/server/validators/plausibility";

export async function GET(request: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string; treeId: string }> }) {
  try {
    const params = await paramsPromise;
    await requireFamilyTreeAccess(params.tenantId, params.treeId);
    const type = request.nextUrl.searchParams.get("type");
    if (type && !Object.values(RelationshipType).includes(type as RelationshipType)) {
      throw badRequest("Unbekannter Beziehungstyp.");
    }
    const relationships = await prisma.relationship.findMany({
      where: {
        tenantId: params.tenantId,
        treeId: params.treeId,
        deletedAt: null,
        ...(type ? { type: type as RelationshipType } : {})
      },
      orderBy: { updatedAt: "desc" }
    });
    return NextResponse.json({ relationships });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string; treeId: string }> }) {
  try {
    const params = await paramsPromise;
    assertRateLimit(request, "create-relationship");
    const { session } = await requireCanEditFamilyTree(params.tenantId, params.treeId);
    const input = relationshipSchema.parse(await request.json());

    const [source, target, existing] = await Promise.all([
      prisma.personNode.findFirst({
        where: { id: input.sourcePersonId, tenantId: params.tenantId, treeId: params.treeId, deletedAt: null }
      }),
      prisma.personNode.findFirst({
        where: { id: input.targetPersonId, tenantId: params.tenantId, treeId: params.treeId, deletedAt: null }
      }),
      prisma.relationship.findMany({
        where: { tenantId: params.tenantId, treeId: params.treeId, deletedAt: null },
        select: { id: true, sourcePersonId: true, targetPersonId: true, type: true }
      })
    ]);

    if (!source || !target) throw notFound("Mindestens eine Person wurde nicht gefunden.");

    if (wouldCreateParentCycle(existing, input.sourcePersonId, input.targetPersonId, input.type)) {
      throw badRequest("Diese Eltern-Kind-Beziehung würde einen Zyklus erzeugen.");
    }

    const relationship = await prisma.relationship.create({
      data: {
        ...input,
        metadata: input.metadata as Prisma.InputJsonValue,
        tenantId: params.tenantId,
        treeId: params.treeId,
        createdById: session.user.id,
        updatedById: session.user.id
      }
    });

    await auditLog({
      tenantId: params.tenantId,
      actorId: session.user.id,
      action: AuditAction.RELATIONSHIP_CREATED,
      entityType: "Relationship",
      entityId: relationship.id,
      metadata: { type: relationship.type },
      ...requestContext(request)
    });

    return NextResponse.json(
      { relationship, warnings: input.type === "PARENT_OF" ? validateParentChildDates(source, target) : [] },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
