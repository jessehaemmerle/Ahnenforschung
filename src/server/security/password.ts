import crypto from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(crypto.scrypt);
const keyLength = 64;

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("base64url");
  const key = (await scryptAsync(password, salt, keyLength)) as Buffer;
  return `scrypt:${salt}:${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, passwordHash?: string | null) {
  if (!passwordHash) return false;

  const [algorithm, salt, storedKey] = passwordHash.split(":");
  if (algorithm !== "scrypt" || !salt || !storedKey) return false;

  const candidate = (await scryptAsync(password, salt, keyLength)) as Buffer;
  const stored = Buffer.from(storedKey, "base64url");
  if (candidate.length !== stored.length) return false;

  return crypto.timingSafeEqual(candidate, stored);
}

