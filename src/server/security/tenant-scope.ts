export function tenantScopedWhere<T extends Record<string, unknown>>(tenantId: string, extra?: T) {
  return {
    tenantId,
    deletedAt: null,
    ...(extra ?? {})
  };
}

export function assertSameTenant(entityTenantId: string, expectedTenantId: string) {
  if (entityTenantId !== expectedTenantId) {
    throw new Error("Tenant-Isolation verletzt.");
  }
}
