import type { Variant } from "./types";
import { PUBLISHED_VARIANTS } from "./types";
import { flattenFileName } from "./types";

export interface CatalogIcon {
  slug: string;
  variants: Variant[];
}

export interface IconCatalog {
  variants: Variant[];
  icons: CatalogIcon[];
}

export function emptyCatalog(): IconCatalog {
  return { variants: [...PUBLISHED_VARIANTS], icons: [] };
}

export function upsertIcon(
  catalog: IconCatalog,
  slug: string,
  variant: Variant
): IconCatalog {
  const existing = catalog.icons.find((icon) => icon.slug === slug);
  if (existing) {
    if (!existing.variants.includes(variant)) {
      existing.variants = [...existing.variants, variant].sort(sortVariants);
    }
    return catalog;
  }

  catalog.icons.push({ slug, variants: [variant] });
  catalog.icons.sort((a, b) => a.slug.localeCompare(b.slug));
  return catalog;
}

export function sortVariants(a: Variant, b: Variant): number {
  return PUBLISHED_VARIANTS.indexOf(a) - PUBLISHED_VARIANTS.indexOf(b);
}

export function catalogHasVariant(
  catalog: IconCatalog,
  slug: string,
  variant: Variant
): boolean {
  return Boolean(
    catalog.icons.find(
      (icon) => icon.slug === slug && icon.variants.includes(variant)
    )
  );
}

export function flattenEntries(catalog: IconCatalog): string[] {
  return catalog.icons.flatMap((icon) =>
    icon.variants.map((variant) => flattenFileName(icon.slug, variant))
  );
}

export function assertPublishedOnly(catalog: IconCatalog): void {
  const allowed = new Set<string>(PUBLISHED_VARIANTS);
  for (const icon of catalog.icons) {
    for (const variant of icon.variants) {
      if (!allowed.has(variant)) {
        throw new Error(
          `Catalog contains unpublished variant "${variant}" on ${icon.slug}`
        );
      }
    }
  }
}
