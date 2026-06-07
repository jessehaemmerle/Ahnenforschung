import { describe, expect, it } from "vitest";

import { assertSameTenant, tenantScopedWhere } from "@/server/security/tenant-scope";

describe("Tenant-Isolation", () => {
  it("erzwingt tenantId in Query-Scopes", () => {
    expect(tenantScopedWhere("tenant_a", { treeId: "tree_1" })).toEqual({
      tenantId: "tenant_a",
      deletedAt: null,
      treeId: "tree_1"
    });
  });

  it("erkennt Cross-Tenant-Zugriff", () => {
    expect(() => assertSameTenant("tenant_a", "tenant_b")).toThrow("Tenant-Isolation");
  });
});
