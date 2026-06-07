import { AuditAction } from "@prisma/client";
import { addDays } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

import { auditLog } from "@/server/audit";
import { assertRateLimit } from "@/server/api/rate-limit";
import { handleApiError } from "@/server/api/errors";
import { requestContext } from "@/server/api/request";
import { requireTenantRole } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { sendInvitationEmail } from "@/server/email";
import { createSecureToken, hashToken } from "@/server/security/passwordless";
import { inviteSchema } from "@/server/validators/tenant";

export async function GET(_: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string }> }) {
  try {
    const params = await paramsPromise;
    await requireTenantRole(params.tenantId, "ADMIN");
    const invitations = await prisma.invitation.findMany({
      where: { tenantId: params.tenantId },
      include: { invitedBy: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    return NextResponse.json({ invitations });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string }> }) {
  try {
    const params = await paramsPromise;
    assertRateLimit(request, "create-invitation");
    const { session, tenant } = await requireTenantRole(params.tenantId, "ADMIN");
    const input = inviteSchema.parse(await request.json());
    const token = createSecureToken();
    const tokenHash = hashToken(token);
    const invitation = await prisma.invitation.create({
      data: {
        tenantId: params.tenantId,
        email: input.email.toLowerCase(),
        role: input.role,
        tokenHash,
        invitedById: session.user.id,
        expiresAt: addDays(new Date(), 14)
      }
    });
    const baseUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;
    const inviteUrl = `${baseUrl}/login?invite=${token}`;
    const mail = await sendInvitationEmail({
      to: input.email,
      tenantName: tenant.name,
      role: input.role,
      inviteUrl
    });

    await auditLog({
      tenantId: params.tenantId,
      actorId: session.user.id,
      action: AuditAction.INVITATION_CREATED,
      entityType: "Invitation",
      entityId: invitation.id,
      metadata: { email: input.email, role: input.role, mailSent: mail.sent },
      ...requestContext(request)
    });

    return NextResponse.json({ invitation, inviteUrl, mail }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
