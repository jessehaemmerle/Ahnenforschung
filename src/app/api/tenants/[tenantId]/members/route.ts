import { NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/server/api/errors";
import { requireTenantRole } from "@/server/auth/guards";
import { prisma } from "@/server/db";

export async function GET(_: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string }> }) {
  try {
    const params = await paramsPromise;
    await requireTenantRole(params.tenantId, "ADMIN");
    const members = await prisma.tenantMembership.findMany({
      where: { tenantId: params.tenantId },
      include: { user: { select: { id: true, name: true, email: true, image: true } }, invitedBy: { select: { name: true, email: true } } },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }]
    });
    return NextResponse.json({ members });
  } catch (error) {
    return handleApiError(error);
  }
}
