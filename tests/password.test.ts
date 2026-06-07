import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/server/security/password";

describe("Passwort-Hashing", () => {
  it("verifiziert das richtige Passwort und lehnt falsche Werte ab", async () => {
    const passwordHash = await hashPassword("DemoPasswort123");

    expect(passwordHash).not.toBe("DemoPasswort123");
    await expect(verifyPassword("DemoPasswort123", passwordHash)).resolves.toBe(true);
    await expect(verifyPassword("anderes-passwort", passwordHash)).resolves.toBe(false);
    await expect(verifyPassword("DemoPasswort123", "ungueltig")).resolves.toBe(false);
  });
});
