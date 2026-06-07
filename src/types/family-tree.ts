import type { Gender, PrivacyStatus, RelationshipStatus, RelationshipType, TenantRole } from "@prisma/client";

export type PersonDto = {
  id: string;
  firstName: string;
  lastName: string;
  birthName: string | null;
  gender: Gender;
  birthDate: string | Date | null;
  birthPlace: string | null;
  deathDate: string | Date | null;
  deathPlace: string | null;
  biography: string | null;
  profession: string | null;
  address: string | null;
  originPlace: string | null;
  profileImageUrl: string | null;
  privacy: PrivacyStatus;
  tags: unknown;
  customData: unknown;
  x: number;
  y: number;
};

export type RelationshipDto = {
  id: string;
  sourcePersonId: string;
  targetPersonId: string;
  type: RelationshipType;
  status: RelationshipStatus;
  startDate: string | Date | null;
  endDate: string | Date | null;
  place: string | null;
  description: string | null;
  sourceNote: string | null;
  privacy: PrivacyStatus;
  metadata: unknown;
};

export type FamilyTreeEditorData = {
  tenantId: string;
  treeId: string;
  treeName: string;
  role: TenantRole;
  people: PersonDto[];
  relationships: RelationshipDto[];
};
