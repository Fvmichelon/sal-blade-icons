import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { normalizeSvg } from "../scripts/lib/normalize";
import { NormalizeError } from "../scripts/lib/types";

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

function read(rel: string): string {
  return fs.readFileSync(path.join(fixtures, rel), "utf8").trim();
}

describe("normalizeSvg", () => {
  it("puts real stroke on the regular root and drops the 256 spacer rect", () => {
    const out = normalizeSvg(read("input/house-regular.svg"), "regular");

    expect(out).toMatch(
      /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round">/
    );
    expect(out).not.toMatch(/<rect\b/);
    expect(out).not.toMatch(/\bwidth="256"/);
    expect(out).not.toMatch(/stroke-width="16"\/>/);
    expect(out).toBe(read("golden/house.svg"));
  });

  it("treats empty x/y on the spacer rect as 0", () => {
    const out = normalizeSvg(read("input/house-regular-empty-xy.svg"), "regular");
    expect(out).not.toMatch(/<rect\b/);
    expect(out).toBe(read("golden/house.svg"));
  });

  it("normalizes fill without presentation stroke", () => {
    const out = normalizeSvg(read("input/house-fill.svg"), "fill");
    expect(out).toContain('fill="currentColor"');
    expect(out).not.toContain("stroke=");
    expect(out).toBe(read("golden/house-fill.svg"));
  });

  it("preserves duotone opacity layers", () => {
    const out = normalizeSvg(read("input/house-duotone.svg"), "duotone");
    expect(out).toContain('opacity="0.2"');
    expect(out).toContain('fill="currentColor"');
    expect(out).not.toContain("stroke=");
    expect(out).toBe(read("golden/house-duotone.svg"));
  });

  it("snapshots flag regular", () => {
    const out = normalizeSvg(read("input/flag-regular.svg"), "regular");
    expect(out).not.toMatch(/<rect\b/);
    expect(out).toBe(read("golden/flag.svg"));
  });

  it("is idempotent", () => {
    const once = normalizeSvg(read("input/house-regular.svg"), "regular");
    const twice = normalizeSvg(once, "regular");
    expect(twice).toBe(once);
  });

  it("rejects <script>", () => {
    expect(() => normalizeSvg(read("input/script.svg"), "regular")).toThrow(
      NormalizeError
    );
    expect(() => normalizeSvg(read("input/script.svg"), "regular")).toThrow(
      /script/i
    );
  });

  it("rejects Lucide viewBox 24", () => {
    expect(() => normalizeSvg(read("input/lucide-house.svg"), "regular")).toThrow(
      /24/
    );
  });

  it("rejects javascript: href", () => {
    const raw =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><a href="javascript:alert(1)"/></svg>';
    expect(() => normalizeSvg(raw, "fill")).toThrow(NormalizeError);
  });

  it("rejects event handlers", () => {
    const raw =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" onclick="alert(1)"><path d="M4,4h8v8H4z"/></svg>';
    expect(() => normalizeSvg(raw, "fill")).toThrow(/event handler/i);
  });

  it("rejects non-SVG markup", () => {
    expect(() => normalizeSvg("<html><body>nope</body></html>", "regular")).toThrow(
      /not SVG/i
    );
  });
});
