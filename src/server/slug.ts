export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function uniqueSlug(base: string, suffix: string) {
  const slug = slugify(base) || "eintrag";
  return `${slug}-${suffix.slice(-6)}`;
}
