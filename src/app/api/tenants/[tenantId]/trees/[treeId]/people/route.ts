import { AuditAction, type Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { auditLog } from "@/server/audit";
import { badRequest, handleApiError } from "@/server/api/errors";
import { assertRateLimit } from "@/server/api/rate-limit";
import { requestContext } from "@/server/api/request";
import { requireCanEditFamilyTree, requireFamilyTreeAccess } from "@/server/auth/guards";
import { prisma } from "@/server/db";
import { personSchema } from "@/server/validators/family-tree";
import { findPotentialDuplicates, validatePersonDates } from "@/server/validators/plausibility";

export async function GET(request: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string; treeId: string }> }) {
  try {
    const params = await paramsPromise;
    await requireFamilyTreeAccess(params.tenantId, params.treeId);
    const search = request.nextUrl.searchParams.get("q")?.trim();
    const birthYear = request.nextUrl.searchParams.get("birthYear");
    const place = request.nextUrl.searchParams.get("place")?.trim();
    const tag = request.nextUrl.searchParams.get("tag")?.trim();
    const living = request.nextUrl.searchParams.get("living");
    const parsedBirthYear = birthYear && /^\d{4}$/.test(birthYear) ? Number(birthYear) : null;
    const andFilters = [
      ...(search
        ? [
            {
              OR: [
                { firstName: { contains: search, mode: "insensitive" as const } },
                { lastName: { contains: search, mode: "insensitive" as const } },
                { birthName: { contains: search, mode: "insensitive" as const } }
              ]
            }
          ]
        : []),
      ...(place
        ? [
            {
              OR: [
                { birthPlace: { contains: place, mode: "insensitive" as const } },
                { originPlace: { contains: place, mode: "insensitive" as const } }
              ]
            }
          ]
        : [])
    ];

    const people = await prisma.personNode.findMany({
      where: {
        tenantId: params.tenantId,
        treeId: params.treeId,
        deletedAt: null,
        ...(andFilters.length ? { AND: andFilters } : {}),
        ...(parsedBirthYear
          ? {
              birthDate: {
                gte: new Date(`${parsedBirthYear}-01-01T00:00:00.000Z`),
                lt: new Date(`${parsedBirthYear + 1}-01-01T00:00:00.000Z`)
              }
            }
          : {}),
        ...(living === "true" ? { deathDate: null } : living === "false" ? { deathDate: { not: null } } : {}),
        ...(tag ? { tags: { array_contains: [tag] } } : {})
      },
      take: 100,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }]
    });

    return NextResponse.json({ people });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params: paramsPromise }: { params: Promise<{ tenantId: string; treeId: string }> }) {
  try {
    const params = await paramsPromise;
    assertRateLimit(request, "create-person");
    const { session } = await requireCanEditFamilyTree(params.tenantId, params.treeId);
    const input = personSchema.parse(await request.json());

    const existing = await prisma.personNode.findMany({
      where: {
        tenantId: params.tenantId,
        treeId: params.treeId,
        deletedAt: null,
        firstName: { equals: input.firstName, mode: "insensitive" },
        lastName: { equals: input.lastName, mode: "insensitive" }
      },
      take: 5
    });

    const duplicates = findPotentialDuplicates(existing, { ...input, id: "new" });
    if (duplicates.length > 0 && request.nextUrl.searchParams.get("allowDuplicate") !== "true") {
      throw badRequest("Es gibt bereits eine sehr ähnliche Person. Wiederhole die Anfrage mit allowDuplicate=true, wenn das gewollt ist.");
    }

    const person = await prisma.personNode.create({
      data: {
        ...input,
        tags: input.tags as Prisma.InputJsonValue,
        customData: input.customData as Prisma.InputJsonValue,
        tenantId: params.tenantId,
        treeId: params.treeId,
        createdById: session.user.id,
        updatedById: session.user.id
      }
    });

    await auditLog({
      tenantId: params.tenantId,
      actorId: session.user.id,
      action: AuditAction.PERSON_CREATED,
      entityType: "PersonNode",
      entityId: person.id,
      metadata: { firstName: person.firstName, lastName: person.lastName },
      ...requestContext(request)
    });

    return NextResponse.json({ person, warnings: validatePersonDates(person) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
