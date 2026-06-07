import { AuditAction } from "@prisma/client";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { auditLog } from "@/server/audit";
import { assertRateLimit } from "@/server/api/rate-limit";
import { handleApiError } from "@/server/api/errors";
import { requestContext } from "@/server/api/request";
import { requireAuth } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { uniqueSlug } from "@/server/slug";
import { createTenantSchema } from "@/server/validators/tenant";

export async function GET() {
  try {
    const session = await requireAuth();
    const memberships = await prisma.tenantMembership.findMany({
      where: { userId: session.user.id, tenant: { deletedAt: null } },
      include: {
        tenant: {
          include: {
            _count: { select: { familyTrees: { where: { deletedAt: null } }, memberships: true } }
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json({ memberships });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(request, "create-tenant");
    const session = await requireAuth();
    const input = createTenantSchema.parse(await request.json());

    const tenant = await prisma.tenant.create({
      data: {
        name: input.name,
        slug: uniqueSlug(input.name, randomUUID()),
        description: input.description || null,
        memberships: {
          create: {
            userId: session.user.id,
            role: "OWNER"
          }
        }
      }
    });

    await auditLog({
      tenantId: tenant.id,
      actorId: session.user.id,
      action: AuditAction.TENANT_CREATED,
      entityType: "Tenant",
      entityId: tenant.id,
      metadata: { name: tenant.name },
      ...requestContext(request)
    });

    return NextResponse.json({ tenant }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
