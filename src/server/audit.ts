import type { AuditAction, Prisma } from "@prisma/client";

import { prisma } from "@/server/db";

type AuditInput = {
  tenantId: string;
  actorId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
};

export async function auditLog(input: AuditInput) {
  await prisma.auditLog.create({
    data: {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata ?? {},
      ipAddress: input.ipAddress,
      userAgent: input.userAgent
    }
  });
}
