import { Gender, PrivacyStatus, RelationshipStatus, RelationshipType } from "@prisma/client";
import { z } from "zod";

import { jsonObjectSchema, optionalDateSchema, tagsSchema } from "./common";

export const createFamilyTreeSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).optional().or(z.literal(""))
});

export const updateFamilyTreeSchema = createFamilyTreeSchema.partial();

const validatePersonDateRange = (value: { birthDate?: Date; deathDate?: Date }, context: z.RefinementCtx) => {
  if (value.birthDate && value.deathDate && value.deathDate < value.birthDate) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Das Sterbedatum darf nicht vor dem Geburtsdatum liegen.",
      path: ["deathDate"]
    });
  }
};

export const personBaseSchema = z.object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    birthName: z.string().trim().max(80).optional().or(z.literal("")),
    gender: z.nativeEnum(Gender).default("UNKNOWN"),
    birthDate: optionalDateSchema,
    birthPlace: z.string().trim().max(120).optional().or(z.literal("")),
    deathDate: optionalDateSchema,
    deathPlace: z.string().trim().max(120).optional().or(z.literal("")),
    biography: z.string().trim().max(20_000).optional().or(z.literal("")),
    profession: z.string().trim().max(120).optional().or(z.literal("")),
    address: z.string().trim().max(240).optional().or(z.literal("")),
    originPlace: z.string().trim().max(120).optional().or(z.literal("")),
    profileImageUrl: z.string().url().max(1000).optional().or(z.literal("")),
    privacy: z.nativeEnum(PrivacyStatus).default("TENANT"),
    tags: tagsSchema,
    customData: jsonObjectSchema,
    x: z.coerce.number().finite().default(0),
    y: z.coerce.number().finite().default(0)
  });

export const personSchema = personBaseSchema.superRefine(validatePersonDateRange);

export const updatePersonSchema = personBaseSchema.partial().superRefine(validatePersonDateRange);

const validateRelationshipDateRange = (
  value: { sourcePersonId?: string; targetPersonId?: string; startDate?: Date; endDate?: Date },
  context: z.RefinementCtx
) => {
  if (value.sourcePersonId && value.targetPersonId && value.sourcePersonId === value.targetPersonId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Eine Person kann nicht mit sich selbst verbunden werden.",
      path: ["targetPersonId"]
    });
  }
  if (value.startDate && value.endDate && value.endDate < value.startDate) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Das Enddatum darf nicht vor dem Startdatum liegen.",
      path: ["endDate"]
    });
  }
};

export const relationshipBaseSchema = z.object({
    sourcePersonId: z.string().min(8),
    targetPersonId: z.string().min(8),
    type: z.nativeEnum(RelationshipType),
    status: z.nativeEnum(RelationshipStatus).default("UNKNOWN"),
    startDate: optionalDateSchema,
    endDate: optionalDateSchema,
    place: z.string().trim().max(120).optional().or(z.literal("")),
    description: z.string().trim().max(5000).optional().or(z.literal("")),
    sourceNote: z.string().trim().max(2000).optional().or(z.literal("")),
    privacy: z.nativeEnum(PrivacyStatus).default("TENANT"),
    metadata: jsonObjectSchema
  });

export const relationshipSchema = relationshipBaseSchema.superRefine(validateRelationshipDateRange);

export const updateRelationshipSchema = relationshipBaseSchema.partial().superRefine(validateRelationshipDateRange);

export const snapshotPersonSchema = z.object({
  id: z.string().min(8),
  x: z.coerce.number().finite(),
  y: z.coerce.number().finite()
});

export const editorSnapshotSchema = z.object({
  people: z.array(snapshotPersonSchema).max(10_000)
});

export const importFamilyTreeSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  people: z.array(personBaseSchema.extend({ id: z.string().optional() })).max(10_000),
  relationships: z
    .array(
      relationshipBaseSchema.extend({
        id: z.string().optional()
      })
    )
    .max(20_000)
    .default([])
});

export const sourceSchema = z.object({
  personId: z.string().min(8).optional(),
  relationshipId: z.string().min(8).optional(),
  mediaFileId: z.string().min(8).optional(),
  title: z.string().trim().min(2).max(160),
  type: z.string().trim().min(2).max(80),
  citation: z.string().trim().max(5000).optional().or(z.literal("")),
  url: z.string().url().max(1000).optional().or(z.literal("")),
  notes: z.string().trim().max(5000).optional().or(z.literal(""))
});
