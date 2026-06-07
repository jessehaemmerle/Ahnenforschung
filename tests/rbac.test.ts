import { describe, expect, it } from "vitest";

import { canChangeRole, canDeleteMembership, canEdit, canManageMembers, hasAtLeastRole } from "@/server/security/rbac";

describe("RBAC", () => {
  it("ordnet Rollen korrekt", () => {
    expect(hasAtLeastRole("OWNER", "ADMIN")).toBe(true);
    expect(hasAtLeastRole("ADMIN", "EDITOR")).toBe(true);
    expect(hasAtLeastRole("EDITOR", "ADMIN")).toBe(false);
    expect(hasAtLeastRole("VIEWER", "EDITOR")).toBe(false);
  });

  it("erlaubt Bearbeitung erst ab Editor", () => {
    expect(canEdit("VIEWER")).toBe(false);
    expect(canEdit("EDITOR")).toBe(true);
  });

  it("trennt Mitgliederverwaltung von Editor-Rechten", () => {
    expect(canManageMembers("EDITOR")).toBe(false);
    expect(canManageMembers("ADMIN")).toBe(true);
  });

  it("verhindert Admin-Eskalation zu Owner/Admin", () => {
    expect(canChangeRole("ADMIN", "EDITOR")).toBe(true);
    expect(canChangeRole("ADMIN", "OWNER")).toBe(false);
    expect(canChangeRole("OWNER", "OWNER")).toBe(true);
  });

  it("schützt Owner-Mitgliedschaften", () => {
    expect(canDeleteMembership("ADMIN", "OWNER")).toBe(false);
    expect(canDeleteMembership("OWNER", "OWNER")).toBe(true);
  });
});
