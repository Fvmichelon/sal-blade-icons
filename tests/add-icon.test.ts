import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { addIcon } from "../scripts/lib/add-icon";
import { AddIconError } from "../scripts/lib/types";

const fixtures = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "input"
);

const temps: string[] = [];

function tmpRoot(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sal-icons-add-"));
  temps.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of temps.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("addIcon", () => {
  it("writes source + flatten and updates the catalog", () => {
    const root = tmpRoot();
    const result = addIcon({
      name: "My Icon",
      variant: "regular",
      file: path.join(fixtures, "house-regular.svg"),
      root,
    });

    expect(result.slug).toBe("my-icon");
    expect(fs.existsSync(path.join(root, "assets", "regular", "my-icon.svg"))).toBe(
      true
    );
    expect(fs.existsSync(path.join(root, "resources", "svg", "my-icon.svg"))).toBe(
      true
    );

    const catalog = JSON.parse(
      fs.readFileSync(path.join(root, "catalog", "icons.json"), "utf8")
    );
    expect(catalog.icons).toEqual([
      { slug: "my-icon", variants: ["regular"] },
    ]);
  });

  it("allows completing a family when only another variant exists", () => {
    const root = tmpRoot();
    addIcon({
      name: "house",
      variant: "regular",
      file: path.join(fixtures, "house-regular.svg"),
      root,
    });
    addIcon({
      name: "house",
      variant: "fill",
      file: path.join(fixtures, "house-fill.svg"),
      root,
    });

    expect(fs.existsSync(path.join(root, "resources", "svg", "house.svg"))).toBe(
      true
    );
    expect(
      fs.existsSync(path.join(root, "resources", "svg", "house-fill.svg"))
    ).toBe(true);
  });

  it("rejects a duplicate slug+variant and writes nothing", () => {
    const root = tmpRoot();
    addIcon({
      name: "house",
      variant: "regular",
      file: path.join(fixtures, "house-regular.svg"),
      root,
    });

    const before = snapshotTree(root);

    expect(() =>
      addIcon({
        name: "house",
        variant: "regular",
        file: path.join(fixtures, "flag-regular.svg"),
        root,
      })
    ).toThrow(AddIconError);

    expect(snapshotTree(root)).toEqual(before);
    expect(
      fs.readFileSync(path.join(root, "resources", "svg", "house.svg"), "utf8")
    ).not.toContain("x1=");
  });

  it("rejects script SVGs without writing", () => {
    const root = tmpRoot();
    expect(() =>
      addIcon({
        name: "evil",
        variant: "regular",
        file: path.join(fixtures, "script.svg"),
        root,
      })
    ).toThrow(/script/i);

    expect(fs.existsSync(path.join(root, "resources", "svg"))).toBe(false);
    expect(fs.existsSync(path.join(root, "assets", "regular", "evil.svg"))).toBe(
      false
    );
  });
});

function snapshotTree(root: string): string[] {
  const files: string[] = [];
  function walk(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else files.push(`${path.relative(root, full)}:${fs.readFileSync(full, "utf8")}`);
    }
  }
  walk(root);
  return files.sort();
}
