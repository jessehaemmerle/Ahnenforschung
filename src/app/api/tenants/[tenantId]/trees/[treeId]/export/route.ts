import { AuditAction } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { auditLog } from "@/server/audit";
import { handleApiError } from "@/server/api/errors";
import { requestContext } from "@/server/api/request";
import { requireFamilyTreeAccess } from "@/server/auth/guards";
import { prisma } from "@/server/db";

export async function GET(request: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string; treeId: string }> }) {
  try {
    const params = await paramsPromise;
    const { session, tree } = await requireFamilyTreeAccess(params.tenantId, params.treeId);
    const [people, relationships, sources, events] = await Promise.all([
      prisma.personNode.findMany({ where: { tenantId: params.tenantId, treeId: params.treeId, deletedAt: null } }),
      prisma.relationship.findMany({ where: { tenantId: params.tenantId, treeId: params.treeId, deletedAt: null } }),
      prisma.source.findMany({ where: { tenantId: params.tenantId, treeId: params.treeId, deletedAt: null } }),
      prisma.personEvent.findMany({ where: { tenantId: params.tenantId, treeId: params.treeId, deletedAt: null } })
    ]);

    await auditLog({
      tenantId: params.tenantId,
      actorId: session.user.id,
      action: AuditAction.EXPORT_COMPLETED,
      entityType: "FamilyTree",
      entityId: params.treeId,
      metadata: { format: "json" },
      ...requestContext(request)
    });

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      tree,
      people,
      relationships,
      sources,
      events
    });
  } catch (error) {
    return handleApiError(error);
  }
}
