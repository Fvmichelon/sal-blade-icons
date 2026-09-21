import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { collateIcons } from "../scripts/lib/collate";

const fixtures = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "input"
);

const temps: string[] = [];

afterEach(() => {
  for (const dir of temps.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function tmpRoot(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sal-icons-collate-"));
  temps.push(dir);
  return dir;
}

function copy(src: string, dest: string) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

describe("collateIcons", () => {
  it("publishes only regular, fill, and duotone into flatten + catalog", () => {
    const root = tmpRoot();

    copy(
      path.join(fixtures, "house-regular.svg"),
      path.join(root, "raw", "regular", "house.svg")
    );
    copy(
      path.join(fixtures, "flag-regular.svg"),
      path.join(root, "raw", "regular", "flag.svg")
    );
    copy(
      path.join(fixtures, "house-fill.svg"),
      path.join(root, "assets", "fill", "house-fill.svg")
    );
    copy(
      path.join(fixtures, "house-duotone.svg"),
      path.join(root, "assets", "duotone", "house-duotone.svg")
    );

    copy(
      path.join(fixtures, "house-fill.svg"),
      path.join(root, "assets", "thin", "house-thin.svg")
    );
    copy(
      path.join(fixtures, "house-fill.svg"),
      path.join(root, "assets", "light", "house-light.svg")
    );
    copy(
      path.join(fixtures, "house-fill.svg"),
      path.join(root, "assets", "bold", "house-bold.svg")
    );
    copy(
      path.join(fixtures, "house-regular.svg"),
      path.join(root, "raw", "bold", "house-bold.svg")
    );

    const result = collateIcons(root);
    const flatten = fs.readdirSync(path.join(root, "resources", "svg")).sort();

    expect(flatten).toEqual([
      "flag.svg",
      "house-duotone.svg",
      "house-fill.svg",
      "house.svg",
    ]);
    expect(flatten.some((name) => /-(thin|light|bold)\.svg$/.test(name))).toBe(
      false
    );

    const catalog = JSON.parse(
      fs.readFileSync(path.join(root, "catalog", "icons.json"), "utf8")
    );
    expect(catalog.variants).toEqual(["regular", "fill", "duotone"]);
    for (const icon of catalog.icons) {
      expect(icon.variants.every((v: string) => ["regular", "fill", "duotone"].includes(v))).toBe(
        true
      );
    }
    expect(result.written).toBe(4);

    const regular = fs.readFileSync(
      path.join(root, "resources", "svg", "house.svg"),
      "utf8"
    );
    expect(regular).toContain('stroke="currentColor"');
    expect(regular).not.toContain("<rect");
  });
});
