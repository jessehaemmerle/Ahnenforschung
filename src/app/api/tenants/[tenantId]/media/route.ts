import { AuditAction, MediaKind } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { auditLog } from "@/server/audit";
import { badRequest, handleApiError } from "@/server/api/errors";
import { assertRateLimit } from "@/server/api/rate-limit";
import { requestContext } from "@/server/api/request";
import { requireTenantRole } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { persistUpload } from "@/server/media-storage";
import { mediaMetadataSchema, validateUpload } from "@/server/validators/media";

export async function GET(_: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string }> }) {
  try {
    const params = await paramsPromise;
    await requireTenantRole(params.tenantId, "EDITOR");
    const media = await prisma.mediaFile.findMany({
      where: { tenantId: params.tenantId, deletedAt: null },
      include: { uploader: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    return NextResponse.json({ media });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string }> }) {
  try {
    const params = await paramsPromise;
    assertRateLimit(request, "media-upload");
    const { session } = await requireTenantRole(params.tenantId, "EDITOR");
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw badRequest("Datei fehlt.");
    validateUpload(file);
    const metadata = mediaMetadataSchema.parse({
      treeId: form.get("treeId") || undefined,
      personId: form.get("personId") || undefined
    });

    if (metadata.treeId) {
      const tree = await prisma.familyTree.findFirst({
        where: { id: metadata.treeId, tenantId: params.tenantId, deletedAt: null }
      });
      if (!tree) throw badRequest("Stammbaum nicht gefunden.");
    }

    if (metadata.personId) {
      const person = await prisma.personNode.findFirst({
        where: { id: metadata.personId, tenantId: params.tenantId, deletedAt: null }
      });
      if (!person) throw badRequest("Person nicht gefunden.");
    }

    const stored = await persistUpload(file, params.tenantId);
    const media = await prisma.mediaFile.create({
      data: {
        tenantId: params.tenantId,
        treeId: metadata.treeId,
        personId: metadata.personId,
        uploaderId: session.user.id,
        kind: file.type.startsWith("image/") ? MediaKind.IMAGE : file.type === "application/pdf" ? MediaKind.DOCUMENT : MediaKind.OTHER,
        filename: file.name,
        contentType: file.type,
        size: file.size,
        storageKey: stored.key,
        checksum: stored.checksum
      }
    });

    await auditLog({
      tenantId: params.tenantId,
      actorId: session.user.id,
      action: AuditAction.MEDIA_UPLOADED,
      entityType: "MediaFile",
      entityId: media.id,
      metadata: { filename: media.filename, contentType: media.contentType, size: media.size },
      ...requestContext(request)
    });

    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
