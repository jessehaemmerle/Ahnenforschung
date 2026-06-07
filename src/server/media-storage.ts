import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export async function persistUpload(file: File, tenantId: string) {
  const uploadRoot = process.env.UPLOAD_DIR ?? "./uploads";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120);
  const key = path.join(tenantId, `${crypto.randomUUID()}-${safeName}`);
  const fullPath = path.join(uploadRoot, key);
  await mkdir(path.dirname(fullPath), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buffer, { flag: "wx" });
  return {
    key,
    checksum: crypto.createHash("sha256").update(buffer).digest("hex")
  };
}
