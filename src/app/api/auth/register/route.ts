import { NextRequest, NextResponse } from "next/server";

import { badRequest, handleApiError } from "@/server/api/errors";
import { assertRateLimit } from "@/server/api/rate-limit";
import { ensureDefaultTenantForUser } from "@/server/auth/onboarding";
import { prisma } from "@/server/db";
import { hashPassword } from "@/server/security/password";
import { registerSchema } from "@/server/validators/auth";

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(request, "register");
    const body = await request.json().catch(() => {
      throw badRequest("Ungültiger JSON-Body.");
    });
    const data = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true }
    });
    if (existingUser) {
      throw badRequest("Für diese E-Mail-Adresse existiert bereits ein Konto.");
    }

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        emailVerified: new Date(),
        passwordHash
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    await ensureDefaultTenantForUser(user);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
