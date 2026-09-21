export const PUBLISHED_VARIANTS = ["regular", "fill", "duotone"] as const;

export type Variant = (typeof PUBLISHED_VARIANTS)[number];

export const FORBIDDEN_WEIGHTS = ["thin", "light", "bold", "boldduotone"] as const;

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const MAX_SVG_BYTES = 100 * 1024;

export class NormalizeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NormalizeError";
  }
}

export class AddIconError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AddIconError";
  }
}

export function isPublishedVariant(value: string): value is Variant {
  return (PUBLISHED_VARIANTS as readonly string[]).includes(value);
}

export function flattenFileName(slug: string, variant: Variant): string {
  return variant === "regular" ? `${slug}.svg` : `${slug}-${variant}.svg`;
}
