import { NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/server/api/errors";
import { requireTenantAccess, requireTenantRole } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { updateTenantSchema } from "@/server/validators/tenant";

export async function GET(_: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string }> }) {
  try {
    const params = await paramsPromise;
    const { membership, tenant } = await requireTenantAccess(params.tenantId);
    return NextResponse.json({ tenant, role: membership.role });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string }> }) {
  try {
    const params = await paramsPromise;
    await requireTenantRole(params.tenantId, "ADMIN");
    const input = updateTenantSchema.parse(await request.json());
    const tenant = await prisma.tenant.update({
      where: { id: params.tenantId },
      data: {
        name: input.name,
        description: input.description || undefined
      }
    });
    return NextResponse.json({ tenant });
  } catch (error) {
    return handleApiError(error);
  }
}
