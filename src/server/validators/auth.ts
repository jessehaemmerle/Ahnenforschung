import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("Bitte gib eine gültige E-Mail-Adresse ein.")
  .max(254)
  .transform((email) => email.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, "Das Passwort muss mindestens 8 Zeichen lang sein.")
  .max(128, "Das Passwort darf höchstens 128 Zeichen lang sein.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Bitte gib dein Passwort ein.").max(128)
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Bitte gib deinen Namen ein.").max(80),
  email: emailSchema,
  password: passwordSchema
});

