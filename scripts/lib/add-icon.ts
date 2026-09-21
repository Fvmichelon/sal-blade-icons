import fs from "node:fs";
import path from "node:path";
import { upsertIcon } from "./catalog";
import { loadCatalog } from "./collate";
import { normalizeSvg } from "./normalize";
import {
  canonicalDir,
  catalogPath,
  ensureDir,
  flattenDir,
  resolveRoot,
} from "./paths";
import { slugify } from "./slug";
import {
  AddIconError,
  flattenFileName,
  isPublishedVariant,
  type Variant,
} from "./types";

export interface AddIconOptions {
  name: string;
  variant: string;
  file: string;
  root?: string;
}

export interface AddIconResult {
  slug: string;
  variant: Variant;
  sourcePath: string;
  flattenPath: string;
}

export function addIcon(options: AddIconOptions): AddIconResult {
  const root = resolveRoot(options.root);
  const variant = options.variant.trim().toLowerCase();

  if (!isPublishedVariant(variant)) {
    throw new AddIconError(
      `Invalid variant "${options.variant}". Use regular, fill, or duotone.`
    );
  }

  const slug = slugify(options.name);
  const inputPath = path.resolve(options.file);

  if (!fs.existsSync(inputPath)) {
    throw new AddIconError(`SVG file not found: ${inputPath}`);
  }

  const flattenPath = path.join(flattenDir(root), flattenFileName(slug, variant));
  const sourcePath = path.join(canonicalDir(variant, root), `${slug}.svg`);

  if (fs.existsSync(flattenPath) || fs.existsSync(sourcePath)) {
    throw new AddIconError(
      `Slug already exists for variant ${variant}: ${slug}. Choose another name, or add a missing family variant.`
    );
  }

  const raw = fs.readFileSync(inputPath, "utf8");
  const normalized = normalizeSvg(raw, variant);

  ensureDir(path.dirname(sourcePath));
  ensureDir(path.dirname(flattenPath));
  fs.writeFileSync(sourcePath, `${normalized}\n`, "utf8");
  fs.writeFileSync(flattenPath, `${normalized}\n`, "utf8");

  const catalog = upsertIcon(loadCatalog(root), slug, variant);
  catalog.icons.sort((a, b) => a.slug.localeCompare(b.slug));
  ensureDir(path.dirname(catalogPath(root)));
  fs.writeFileSync(
    catalogPath(root),
    `${JSON.stringify(catalog, null, 2)}\n`,
    "utf8"
  );

  return { slug, variant, sourcePath, flattenPath };
}
