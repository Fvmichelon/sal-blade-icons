import { AddIconError, SLUG_PATTERN } from "./types";

export function slugify(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  if (!SLUG_PATTERN.test(slug)) {
    throw new AddIconError(
      `Invalid slug "${slug}" from name "${name}". Use kebab-case matching [a-z0-9]+(-[a-z0-9]+)*.`
    );
  }

  return slug;
}

export function assertSlug(slug: string): void {
  if (!SLUG_PATTERN.test(slug)) {
    throw new AddIconError(
      `Invalid slug "${slug}". Use kebab-case matching [a-z0-9]+(-[a-z0-9]+)*.`
    );
  }
}

export function slugFromFilename(filename: string, variantSuffix?: string): string {
  const base = filename.replace(/\.svg$/i, "");
  if (variantSuffix && base.endsWith(`-${variantSuffix}`)) {
    return base.slice(0, -(variantSuffix.length + 1));
  }
  return base;
}
