import { z } from "zod";

export const allowedContentTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain"
]);

export const mediaMetadataSchema = z.object({
  treeId: z.string().min(8).optional(),
  personId: z.string().min(8).optional()
});

export function validateUpload(file: File) {
  const maxBytes = Number(process.env.MAX_UPLOAD_MB ?? 8) * 1024 * 1024;

  if (!allowedContentTypes.has(file.type)) {
    throw new Error("Dieser Dateityp ist nicht erlaubt.");
  }

  if (file.size > maxBytes) {
    throw new Error(`Die Datei ist größer als ${process.env.MAX_UPLOAD_MB ?? 8} MB.`);
  }

  const forbiddenExt = /\.(exe|bat|cmd|com|sh|php|js|jar|msi)$/i;
  if (forbiddenExt.test(file.name)) {
    throw new Error("Ausführbare Dateien sind nicht erlaubt.");
  }
}
