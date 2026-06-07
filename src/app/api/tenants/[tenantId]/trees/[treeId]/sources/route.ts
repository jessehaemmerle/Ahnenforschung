import { AuditAction } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { auditLog } from "@/server/audit";
import { badRequest, handleApiError } from "@/server/api/errors";
import { requestContext } from "@/server/api/request";
import { requireCanEditFamilyTree, requireFamilyTreeAccess } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { sourceSchema } from "@/server/validators/family-tree";

export async function GET(_: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string; treeId: string }> }) {
  try {
    const params = await paramsPromise;
    await requireFamilyTreeAccess(params.tenantId, params.treeId);
    const sources = await prisma.source.findMany({
      where: { tenantId: params.tenantId, treeId: params.treeId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 200
    });
    return NextResponse.json({ sources });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string; treeId: string }> }) {
  try {
    const params = await paramsPromise;
    const { session } = await requireCanEditFamilyTree(params.tenantId, params.treeId);
    const input = sourceSchema.parse(await request.json());
    if (input.personId) {
      const person = await prisma.personNode.findFirst({
        where: { id: input.personId, tenantId: params.tenantId, treeId: params.treeId, deletedAt: null }
      });
      if (!person) throw badRequest("Person nicht gefunden.");
    }
    if (input.relationshipId) {
      const relationship = await prisma.relationship.findFirst({
        where: { id: input.relationshipId, tenantId: params.tenantId, treeId: params.treeId, deletedAt: null }
      });
      if (!relationship) throw badRequest("Beziehung nicht gefunden.");
    }
    if (input.mediaFileId) {
      const media = await prisma.mediaFile.findFirst({
        where: { id: input.mediaFileId, tenantId: params.tenantId, deletedAt: null }
      });
      if (!media) throw badRequest("Medium nicht gefunden.");
    }
    const source = await prisma.source.create({
      data: {
        ...input,
        tenantId: params.tenantId,
        treeId: params.treeId
      }
    });

    await auditLog({
      tenantId: params.tenantId,
      actorId: session.user.id,
      action: AuditAction.SOURCE_CREATED,
      entityType: "Source",
      entityId: source.id,
      metadata: { title: source.title, type: source.type },
      ...requestContext(request)
    });

    return NextResponse.json({ source }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
