import { z } from "zod";

export const cuidSchema = z.string().min(8).max(64);

export const optionalDateSchema = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  return value;
}, z.coerce.date().optional());

export const tagsSchema = z.preprocess((value) => {
  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return value;
}, z.array(z.string().min(1).max(40)).max(30).default([]));

export const jsonObjectSchema = z.record(z.unknown()).default({});

export function paginationSchema(defaultTake = 25, maxTake = 100) {
  return z.object({
    q: z.string().max(120).optional(),
    cursor: z.string().optional(),
    take: z.coerce.number().int().min(1).max(maxTake).default(defaultTake)
  });
}
