import { AuditAction, type Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { auditLog } from "@/server/audit";
import { handleApiError, notFound } from "@/server/api/errors";
import { requestContext } from "@/server/api/request";
import { requireCanEditFamilyTree, requireFamilyTreeAccess } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { updatePersonSchema } from "@/server/validators/family-tree";
import { validatePersonDates } from "@/server/validators/plausibility";

export async function GET(_: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string; treeId: string; personId: string }> }) {
  try {
    const params = await paramsPromise;
    await requireFamilyTreeAccess(params.tenantId, params.treeId);
    const person = await prisma.personNode.findFirst({
      where: {
        id: params.personId,
        tenantId: params.tenantId,
        treeId: params.treeId,
        deletedAt: null
      },
      include: {
        events: { where: { deletedAt: null }, orderBy: { eventDate: "asc" } },
        sources: { where: { deletedAt: null } },
        mediaFiles: { where: { deletedAt: null } },
        customValues: { include: { definition: true } }
      }
    });
    if (!person) throw notFound("Person nicht gefunden.");
    return NextResponse.json({ person, warnings: validatePersonDates(person) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string; treeId: string; personId: string }> }) {
  try {
    const params = await paramsPromise;
    const { session } = await requireCanEditFamilyTree(params.tenantId, params.treeId);
    const input = updatePersonSchema.parse(await request.json());
    const data: Prisma.PersonNodeUncheckedUpdateManyInput = {
      ...input,
      tags: input.tags as Prisma.InputJsonValue | undefined,
      customData: input.customData as Prisma.InputJsonValue | undefined,
      updatedById: session.user.id
    };

    const person = await prisma.personNode.updateMany({
      where: {
        id: params.personId,
        tenantId: params.tenantId,
        treeId: params.treeId,
        deletedAt: null
      },
      data
    });

    if (person.count === 0) throw notFound("Person nicht gefunden.");

    const updated = await prisma.personNode.findUniqueOrThrow({ where: { id: params.personId } });
    await auditLog({
      tenantId: params.tenantId,
      actorId: session.user.id,
      action: AuditAction.PERSON_UPDATED,
      entityType: "PersonNode",
      entityId: params.personId,
      metadata: { fields: Object.keys(input) },
      ...requestContext(request)
    });

    return NextResponse.json({ person: updated, warnings: validatePersonDates(updated) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string; treeId: string; personId: string }> }) {
  try {
    const params = await paramsPromise;
    const { session } = await requireCanEditFamilyTree(params.tenantId, params.treeId);
    const now = new Date();

    await prisma.$transaction([
      prisma.relationship.updateMany({
        where: {
          tenantId: params.tenantId,
          treeId: params.treeId,
          deletedAt: null,
          OR: [{ sourcePersonId: params.personId }, { targetPersonId: params.personId }]
        },
        data: {
          deletedAt: now,
          updatedById: session.user.id
        }
      }),
      prisma.personNode.updateMany({
        where: {
          id: params.personId,
          tenantId: params.tenantId,
          treeId: params.treeId,
          deletedAt: null
        },
        data: {
          deletedAt: now,
          updatedById: session.user.id
        }
      })
    ]);

    await auditLog({
      tenantId: params.tenantId,
      actorId: session.user.id,
      action: AuditAction.PERSON_DELETED,
      entityType: "PersonNode",
      entityId: params.personId,
      ...requestContext(request)
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
