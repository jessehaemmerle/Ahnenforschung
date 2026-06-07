import { NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/server/api/errors";
import { requireTenantRole } from "@/server/auth/guards";
import { prisma } from "@/server/db";

export async function GET(request: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string }> }) {
  try {
    const params = await paramsPromise;
    await requireTenantRole(params.tenantId, "ADMIN");
    const take = Math.min(Number(request.nextUrl.searchParams.get("take") ?? 50), 200);
    const logs = await prisma.auditLog.findMany({
      where: { tenantId: params.tenantId },
      include: { actor: { select: { name: true, email: true, image: true } } },
      orderBy: { createdAt: "desc" },
      take
    });
    return NextResponse.json({ logs });
  } catch (error) {
    return handleApiError(error);
  }
}
