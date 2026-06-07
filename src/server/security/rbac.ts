import type { TenantRole } from "@prisma/client";

export const ROLE_WEIGHT: Record<TenantRole, number> = {
  VIEWER: 0,
  EDITOR: 1,
  ADMIN: 2,
  OWNER: 3
};

export function hasAtLeastRole(actual: TenantRole, required: TenantRole) {
  return ROLE_WEIGHT[actual] >= ROLE_WEIGHT[required];
}

export function canEdit(role: TenantRole) {
  return hasAtLeastRole(role, "EDITOR");
}

export function canManageMembers(role: TenantRole) {
  return hasAtLeastRole(role, "ADMIN");
}

export function canChangeRole(actorRole: TenantRole, targetRole: TenantRole) {
  if (actorRole === "OWNER") return true;
  if (actorRole !== "ADMIN") return false;
  return ROLE_WEIGHT[targetRole] < ROLE_WEIGHT.ADMIN;
}

export function canDeleteMembership(actorRole: TenantRole, targetRole: TenantRole) {
  if (targetRole === "OWNER") return actorRole === "OWNER";
  return canManageMembers(actorRole);
}
