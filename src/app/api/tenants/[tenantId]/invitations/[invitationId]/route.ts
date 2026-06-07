import { NextRequest, NextResponse } from "next/server";

import { handleApiError, notFound } from "@/server/api/errors";
import { requireTenantRole } from "@/server/auth/guards";
import { prisma } from "@/server/db";

export async function DELETE(_: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string; invitationId: string }> }) {
  try {
    const params = await paramsPromise;
    await requireTenantRole(params.tenantId, "ADMIN");
    const invitation = await prisma.invitation.updateMany({
      where: {
        id: params.invitationId,
        tenantId: params.tenantId,
        status: "PENDING"
      },
      data: { status: "REVOKED" }
    });
    if (invitation.count === 0) throw notFound("Einladung nicht gefunden.");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
