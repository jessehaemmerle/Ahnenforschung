import { describe, expect, it } from "vitest";

import { personSchema, relationshipSchema } from "@/server/validators/family-tree";

describe("Zod-Validierungen", () => {
  it("verhindert Sterbedatum vor Geburtsdatum", () => {
    const result = personSchema.safeParse({
      firstName: "Ada",
      lastName: "Demo",
      birthDate: "2000-01-01",
      deathDate: "1999-01-01"
    });
    expect(result.success).toBe(false);
  });

  it("validiert minimale Personendaten", () => {
    const result = personSchema.safeParse({
      firstName: "Ada",
      lastName: "Demo",
      tags: "Linie A, Wien"
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual(["Linie A", "Wien"]);
    }
  });

  it("verhindert Selbstbeziehungen", () => {
    const result = relationshipSchema.safeParse({
      sourcePersonId: "person_123456",
      targetPersonId: "person_123456",
      type: "PARENT_OF"
    });
    expect(result.success).toBe(false);
  });
});
