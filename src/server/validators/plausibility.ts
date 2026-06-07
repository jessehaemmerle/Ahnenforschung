import { RelationshipType } from "@prisma/client";

type PersonLike = {
  id: string;
  firstName?: string;
  lastName?: string;
  birthDate?: Date | string | null;
  deathDate?: Date | string | null;
};

type RelationshipLike = {
  id?: string;
  sourcePersonId: string;
  targetPersonId: string;
  type: RelationshipType;
};

export type PlausibilityWarning = {
  code: string;
  message: string;
  personId?: string;
  relationshipId?: string;
};

const parentTypes = new Set<RelationshipType>(["PARENT_OF"]);
const childTypes = new Set<RelationshipType>(["SON_OF", "DAUGHTER_OF", "CHILD_OF", "ADOPTED_CHILD", "STEPCHILD"]);

function toDate(value: PersonLike["birthDate"]) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function yearsBetween(start: Date, end: Date) {
  return (end.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
}

export function validatePersonDates(person: PersonLike): PlausibilityWarning[] {
  const warnings: PlausibilityWarning[] = [];
  const birth = toDate(person.birthDate);
  const death = toDate(person.deathDate);

  if (birth && death && death < birth) {
    warnings.push({
      code: "death_before_birth",
      message: "Sterbedatum liegt vor dem Geburtsdatum.",
      personId: person.id
    });
  }

  if (birth && death && yearsBetween(birth, death) > 125) {
    warnings.push({
      code: "unrealistic_age",
      message: "Die errechnete Lebensdauer wirkt ungewöhnlich hoch.",
      personId: person.id
    });
  }

  return warnings;
}

export function validateParentChildDates(parent: PersonLike, child: PersonLike): PlausibilityWarning[] {
  const warnings: PlausibilityWarning[] = [];
  const parentBirth = toDate(parent.birthDate);
  const childBirth = toDate(child.birthDate);

  if (!parentBirth || !childBirth) return warnings;

  if (childBirth < parentBirth) {
    warnings.push({
      code: "child_before_parent",
      message: "Ein Kind kann nicht vor dem Elternteil geboren sein.",
      personId: child.id
    });
  }

  const ageAtBirth = yearsBetween(parentBirth, childBirth);
  if (ageAtBirth < 12 || ageAtBirth > 80) {
    warnings.push({
      code: "unrealistic_parent_age",
      message: "Der Altersunterschied zwischen Elternteil und Kind wirkt ungewöhnlich.",
      personId: child.id
    });
  }

  return warnings;
}

export function wouldCreateParentCycle(
  relationships: RelationshipLike[],
  sourcePersonId: string,
  targetPersonId: string,
  type: RelationshipType
) {
  const edges = relationships.flatMap((relationship) => {
    if (relationship.type === "PARENT_OF") {
      return [{ parent: relationship.sourcePersonId, child: relationship.targetPersonId }];
    }
    if (childTypes.has(relationship.type)) {
      return [{ parent: relationship.targetPersonId, child: relationship.sourcePersonId }];
    }
    return [];
  });

  if (parentTypes.has(type)) {
    edges.push({ parent: sourcePersonId, child: targetPersonId });
  }
  if (childTypes.has(type)) {
    edges.push({ parent: targetPersonId, child: sourcePersonId });
  }

  const childrenByParent = new Map<string, string[]>();
  for (const edge of edges) {
    childrenByParent.set(edge.parent, [...(childrenByParent.get(edge.parent) ?? []), edge.child]);
  }

  const seen = new Set<string>();
  const visit = (personId: string, path: Set<string>): boolean => {
    if (path.has(personId)) return true;
    if (seen.has(personId)) return false;
    seen.add(personId);
    path.add(personId);
    for (const child of childrenByParent.get(personId) ?? []) {
      if (visit(child, path)) return true;
    }
    path.delete(personId);
    return false;
  };

  return [...childrenByParent.keys()].some((personId) => visit(personId, new Set()));
}

export function findPotentialDuplicates(people: PersonLike[], candidate: PersonLike) {
  const normalize = (value?: string) => value?.trim().toLowerCase() ?? "";
  return people.filter((person) => {
    if (person.id === candidate.id) return false;
    return (
      normalize(person.firstName) === normalize(candidate.firstName) &&
      normalize(person.lastName) === normalize(candidate.lastName) &&
      String(person.birthDate ?? "") === String(candidate.birthDate ?? "")
    );
  });
}
