import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Variant } from "./types";

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_ROOT = path.resolve(HERE, "../..");

export function resolveRoot(root = DEFAULT_ROOT): string {
  return path.resolve(root);
}

export function rawRegularDir(root = DEFAULT_ROOT): string {
  return path.join(resolveRoot(root), "raw", "regular");
}

export function canonicalDir(variant: Variant, root = DEFAULT_ROOT): string {
  return path.join(resolveRoot(root), "assets", variant);
}

export function flattenDir(root = DEFAULT_ROOT): string {
  return path.join(resolveRoot(root), "resources", "svg");
}

export function catalogPath(root = DEFAULT_ROOT): string {
  return path.join(resolveRoot(root), "catalog", "icons.json");
}

export function syncMetaPath(root = DEFAULT_ROOT): string {
  return path.join(resolveRoot(root), "catalog", "sync-meta.json");
}

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}
