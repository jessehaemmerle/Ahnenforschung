import { AuditAction } from "@prisma/client";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { auditLog } from "@/server/audit";
import { assertRateLimit } from "@/server/api/rate-limit";
import { handleApiError } from "@/server/api/errors";
import { requestContext } from "@/server/api/request";
import { requireTenantAccess, requireTenantRole } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { uniqueSlug } from "@/server/slug";
import { createFamilyTreeSchema } from "@/server/validators/family-tree";

export async function GET(_: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string }> }) {
  try {
    const params = await paramsPromise;
    const { session, membership } = await requireTenantAccess(params.tenantId);
    const trees = await prisma.familyTree.findMany({
      where: {
        tenantId: params.tenantId,
        deletedAt: null
      },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: {
            people: { where: { deletedAt: null } },
            relationships: { where: { deletedAt: null } }
          }
        },
        updatedBy: { select: { name: true, email: true } }
      }
    });

    return NextResponse.json({ trees, role: membership.role, userId: session.user.id });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string }> }) {
  try {
    const params = await paramsPromise;
    assertRateLimit(request, "create-tree");
    const { session } = await requireTenantRole(params.tenantId, "EDITOR");
    const input = createFamilyTreeSchema.parse(await request.json());

    const tree = await prisma.familyTree.create({
      data: {
        tenantId: params.tenantId,
        name: input.name,
        slug: uniqueSlug(input.name, randomUUID()),
        description: input.description || null,
        createdById: session.user.id,
        updatedById: session.user.id
      }
    });

    await auditLog({
      tenantId: params.tenantId,
      actorId: session.user.id,
      action: AuditAction.FAMILY_TREE_CREATED,
      entityType: "FamilyTree",
      entityId: tree.id,
      metadata: { name: tree.name },
      ...requestContext(request)
    });

    return NextResponse.json({ tree }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
