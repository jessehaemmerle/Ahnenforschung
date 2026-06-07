import { NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/server/api/errors";
import { requireTenantAccess } from "@/server/auth/guards";
import { prisma } from "@/server/db";

export async function GET(request: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string }> }) {
  try {
    const params = await paramsPromise;
    await requireTenantAccess(params.tenantId);
    const q = request.nextUrl.searchParams.get("q")?.trim();
    const sources = await prisma.source.findMany({
      where: {
        tenantId: params.tenantId,
        deletedAt: null,
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { type: { contains: q, mode: "insensitive" } },
                { citation: { contains: q, mode: "insensitive" } }
              ]
            }
          : {})
      },
      include: {
        tree: { select: { id: true, name: true } },
        person: { select: { id: true, firstName: true, lastName: true } }
      },
      orderBy: { updatedAt: "desc" },
      take: 200
    });
    return NextResponse.json({ sources });
  } catch (error) {
    return handleApiError(error);
  }
}
