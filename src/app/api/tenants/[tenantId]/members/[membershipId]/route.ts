import { AuditAction } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { auditLog } from "@/server/audit";
import { forbidden, handleApiError, notFound } from "@/server/api/errors";
import { requestContext } from "@/server/api/request";
import { requireTenantRole } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { canChangeRole, canDeleteMembership } from "@/server/security/rbac";
import { updateMembershipSchema } from "@/server/validators/tenant";

export async function PATCH(request: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string; membershipId: string }> }) {
  try {
    const params = await paramsPromise;
    const { session, membership: actorMembership } = await requireTenantRole(params.tenantId, "ADMIN");
    const input = updateMembershipSchema.parse(await request.json());
    const target = await prisma.tenantMembership.findFirst({
      where: { id: params.membershipId, tenantId: params.tenantId }
    });
    if (!target) throw notFound("Mitgliedschaft nicht gefunden.");
    if (!canChangeRole(actorMembership.role, input.role)) throw forbidden("Du darfst diese Rolle nicht vergeben.");
    if (target.role === "OWNER" && actorMembership.role !== "OWNER") throw forbidden("Nur Owner dürfen Owner-Rollen ändern.");
    if (target.role === "OWNER" && input.role !== "OWNER") {
      const ownerCount = await prisma.tenantMembership.count({
        where: { tenantId: params.tenantId, role: "OWNER" }
      });
      if (ownerCount <= 1) throw forbidden("Der letzte Owner muss erhalten bleiben.");
    }

    const updated = await prisma.tenantMembership.update({
      where: { id: params.membershipId },
      data: { role: input.role }
    });

    await auditLog({
      tenantId: params.tenantId,
      actorId: session.user.id,
      action: AuditAction.ROLE_CHANGED,
      entityType: "TenantMembership",
      entityId: updated.id,
      metadata: { from: target.role, to: updated.role, userId: updated.userId },
      ...requestContext(request)
    });

    return NextResponse.json({ membership: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string; membershipId: string }> }) {
  try {
    const params = await paramsPromise;
    const { session, membership: actorMembership } = await requireTenantRole(params.tenantId, "ADMIN");
    const target = await prisma.tenantMembership.findFirst({
      where: { id: params.membershipId, tenantId: params.tenantId }
    });
    if (!target) throw notFound("Mitgliedschaft nicht gefunden.");
    if (!canDeleteMembership(actorMembership.role, target.role)) throw forbidden("Du darfst dieses Mitglied nicht entfernen.");
    if (target.userId === session.user.id) throw forbidden("Du kannst dich nicht selbst aus dem Tenant entfernen.");
    if (target.role === "OWNER") {
      const ownerCount = await prisma.tenantMembership.count({
        where: { tenantId: params.tenantId, role: "OWNER" }
      });
      if (ownerCount <= 1) throw forbidden("Der letzte Owner kann nicht entfernt werden.");
    }

    await prisma.tenantMembership.delete({ where: { id: params.membershipId } });

    await auditLog({
      tenantId: params.tenantId,
      actorId: session.user.id,
      action: AuditAction.ROLE_CHANGED,
      entityType: "TenantMembership",
      entityId: target.id,
      metadata: { removedUserId: target.userId },
      ...requestContext(request)
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
