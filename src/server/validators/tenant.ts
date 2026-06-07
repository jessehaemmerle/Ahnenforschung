import { TenantRole } from "@prisma/client";
import { z } from "zod";

export const createTenantSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional().or(z.literal(""))
});

export const updateTenantSchema = createTenantSchema.partial();

export const membershipRoleSchema = z.nativeEnum(TenantRole);

export const inviteSchema = z.object({
  email: z.string().email().max(254),
  role: membershipRoleSchema.default("VIEWER")
});

export const updateMembershipSchema = z.object({
  role: membershipRoleSchema
});
