import { describe, expect, it } from "vitest";

import {
  findPotentialDuplicates,
  validateParentChildDates,
  validatePersonDates,
  wouldCreateParentCycle
} from "@/server/validators/plausibility";

describe("Plausibilitätsregeln", () => {
  it("meldet unrealistische Personendaten", () => {
    const warnings = validatePersonDates({
      id: "p1",
      firstName: "Alt",
      lastName: "Demo",
      birthDate: "1800-01-01",
      deathDate: "1950-01-01"
    });
    expect(warnings.some((warning) => warning.code === "unrealistic_age")).toBe(true);
  });

  it("meldet Kind vor Elternteil", () => {
    const warnings = validateParentChildDates(
      { id: "parent", birthDate: "2000-01-01" },
      { id: "child", birthDate: "1990-01-01" }
    );
    expect(warnings.some((warning) => warning.code === "child_before_parent")).toBe(true);
  });

  it("erkennt zirkuläre Eltern-Kind-Beziehungen", () => {
    const cycle = wouldCreateParentCycle(
      [
        { sourcePersonId: "a", targetPersonId: "b", type: "PARENT_OF" },
        { sourcePersonId: "b", targetPersonId: "c", type: "PARENT_OF" }
      ],
      "c",
      "a",
      "PARENT_OF"
    );
    expect(cycle).toBe(true);
  });

  it("findet mögliche Duplikate", () => {
    const duplicates = findPotentialDuplicates(
      [{ id: "1", firstName: "Mira", lastName: "Keller", birthDate: "1970-01-08" }],
      { id: "2", firstName: "mira", lastName: "keller", birthDate: "1970-01-08" }
    );
    expect(duplicates).toHaveLength(1);
  });
});
