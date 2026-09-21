import fs from "node:fs";
import path from "node:path";
import {
  assertPublishedOnly,
  emptyCatalog,
  upsertIcon,
  type IconCatalog,
} from "./catalog";
import { normalizeSvg } from "./normalize";
import {
  canonicalDir,
  ensureDir,
  flattenDir,
  rawRegularDir,
  catalogPath,
  resolveRoot,
} from "./paths";
import { slugFromFilename } from "./slug";
import {
  FORBIDDEN_WEIGHTS,
  PUBLISHED_VARIANTS,
  flattenFileName,
  type Variant,
} from "./types";

export interface CollateResult {
  catalog: IconCatalog;
  written: number;
  slugs: number;
}

function listSvgFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.toLowerCase().endsWith(".svg"))
    .sort();
}

function collectVariantInputs(
  dir: string,
  variant: Variant
): Map<string, string> {
  const inputs = new Map<string, string>();
  const suffix = variant === "regular" ? undefined : variant;

  for (const file of listSvgFiles(dir)) {
    const slug = slugFromFilename(file, suffix);
    const full = path.join(dir, file);
    const isSuffixed = Boolean(suffix && file.endsWith(`-${suffix}.svg`));
    if (!inputs.has(slug) || isSuffixed) {
      inputs.set(slug, full);
    }
  }

  return inputs;
}

function writeSvg(filePath: string, contents: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${contents}\n`, "utf8");
}

function removeLeftoverSuffixedFiles(dir: string, variant: Variant): void {
  if (variant === "regular") return;
  for (const file of listSvgFiles(dir)) {
    if (file.endsWith(`-${variant}.svg`)) {
      fs.unlinkSync(path.join(dir, file));
    }
  }
}

function assertNoForbiddenOutput(root: string): void {
  const published = flattenDir(root);
  if (!fs.existsSync(published)) return;

  const forbidden = listSvgFiles(published).filter((name) =>
    FORBIDDEN_WEIGHTS.some((weight) => name.endsWith(`-${weight}.svg`))
  );

  if (forbidden.length > 0) {
    throw new Error(
      `Flatten contains unpublished weights: ${forbidden.slice(0, 8).join(", ")}`
    );
  }
}

export function collateIcons(root = resolveRoot()): CollateResult {
  const repo = resolveRoot(root);
  const catalog = emptyCatalog();
  const flatten = flattenDir(repo);
  ensureDir(flatten);

  const stale = listSvgFiles(flatten);
  for (const file of stale) {
    fs.unlinkSync(path.join(flatten, file));
  }

  let written = 0;

  for (const variant of PUBLISHED_VARIANTS) {
    const dest = canonicalDir(variant, repo);
    ensureDir(dest);

    const inputs = new Map<string, string>();

    if (variant === "regular") {
      for (const [slug, file] of collectVariantInputs(
        rawRegularDir(repo),
        variant
      )) {
        inputs.set(slug, file);
      }
      for (const [slug, file] of collectVariantInputs(dest, variant)) {
        if (!inputs.has(slug)) inputs.set(slug, file);
      }
    } else {
      for (const [slug, file] of collectVariantInputs(dest, variant)) {
        inputs.set(slug, file);
      }
    }

    const normalized = new Map<string, string>();
    for (const [slug, file] of inputs) {
      const raw = fs.readFileSync(file, "utf8");
      normalized.set(slug, normalizeSvg(raw, variant));
    }

    removeLeftoverSuffixedFiles(dest, variant);

    for (const [slug, svg] of normalized) {
      writeSvg(path.join(dest, `${slug}.svg`), svg);
      writeSvg(path.join(flatten, flattenFileName(slug, variant)), svg);
      upsertIcon(catalog, slug, variant);
      written += 1;
    }
  }

  catalog.icons.sort((a, b) => a.slug.localeCompare(b.slug));
  assertPublishedOnly(catalog);
  assertNoForbiddenOutput(repo);

  ensureDir(path.dirname(catalogPath(repo)));
  fs.writeFileSync(
    catalogPath(repo),
    `${JSON.stringify(catalog, null, 2)}\n`,
    "utf8"
  );

  return { catalog, written, slugs: catalog.icons.length };
}

export function loadCatalog(root = resolveRoot()): IconCatalog {
  const file = catalogPath(root);
  if (!fs.existsSync(file)) return emptyCatalog();
  return JSON.parse(fs.readFileSync(file, "utf8")) as IconCatalog;
}
