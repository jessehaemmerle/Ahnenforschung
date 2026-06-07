import { AuditAction } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { auditLog } from "@/server/audit";
import { badRequest, forbidden, handleApiError, notFound } from "@/server/api/errors";
import { assertRateLimit } from "@/server/api/rate-limit";
import { requestContext } from "@/server/api/request";
import { requireAuth } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { hashToken } from "@/server/security/passwordless";

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(request, "accept-invitation");
    const session = await requireAuth();
    const body = (await request.json()) as { token?: string };
    if (!body.token) throw badRequest("Einladungstoken fehlt.");

    const invitation = await prisma.invitation.findUnique({
      where: { tokenHash: hashToken(body.token) },
      include: { tenant: true }
    });

    if (!invitation || invitation.status !== "PENDING") throw notFound("Einladung nicht gefunden.");
    if (invitation.expiresAt < new Date()) {
      await prisma.invitation.update({ where: { id: invitation.id }, data: { status: "EXPIRED" } });
      throw badRequest("Diese Einladung ist abgelaufen.");
    }
    if (!session.user.email || invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
      throw forbidden("Diese Einladung wurde für eine andere E-Mail-Adresse erstellt.");
    }

    await prisma.$transaction([
      prisma.tenantMembership.upsert({
        where: { tenantId_userId: { tenantId: invitation.tenantId, userId: session.user.id } },
        update: { role: invitation.role },
        create: {
          tenantId: invitation.tenantId,
          userId: session.user.id,
          role: invitation.role,
          invitedById: invitation.invitedById
        }
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED", acceptedAt: new Date() }
      })
    ]);

    await auditLog({
      tenantId: invitation.tenantId,
      actorId: session.user.id,
      action: AuditAction.INVITATION_ACCEPTED,
      entityType: "Invitation",
      entityId: invitation.id,
      metadata: { email: invitation.email, role: invitation.role },
      ...requestContext(request)
    });

    return NextResponse.json({ tenantId: invitation.tenantId });
  } catch (error) {
    return handleApiError(error);
  }
}
