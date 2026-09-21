import { DOMParser } from "@xmldom/xmldom";
import {
  MAX_SVG_BYTES,
  NormalizeError,
  type Variant,
} from "./types";

const VIEWBOX_256 = /^0\s+0\s+256\s+256$/;
const VIEWBOX_24 = /^0\s+0\s+24\s+24$/;
const DROP_ELEMENTS = new Set([
  "metadata",
  "title",
  "desc",
  "sodipodi:namedview",
]);
const DROP_ATTR_PREFIXES = [
  "inkscape:",
  "sodipodi:",
  "serif:",
  "sketch:",
  "xmlns:inkscape",
  "xmlns:sodipodi",
  "xmlns:serif",
  "xmlns:i",
];
const DROP_ATTRS = new Set([
  "id",
  "class",
  "enable-background",
  "xml:space",
  "version",
  "baseprofile",
  "baseProfile",
  "data-name",
]);
const STROKE_ATTRS = [
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-opacity",
];
const HREF_ATTRS = new Set(["href", "xlink:href", "src"]);

type ElementNode = {
  nodeName: string;
  nodeType: number;
  attributes: {
    length: number;
    [index: number]: { name: string; value: string };
  };
  childNodes: { length: number; [index: number]: ChildNode };
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  removeChild(child: ChildNode): ChildNode;
};

type ChildNode = {
  nodeType: number;
  nodeName: string;
  nodeValue: string | null;
};

function attrValue(el: ElementNode, name: string): string {
  const value = el.getAttribute(name);
  return value == null ? "" : value;
}

function numericAttr(el: ElementNode, name: string): string {
  const raw = attrValue(el, name);
  return raw === "" ? "0" : raw;
}

function isElement(node: ChildNode): node is ChildNode & ElementNode {
  return node.nodeType === 1;
}

function childrenOf(el: ElementNode): ChildNode[] {
  const out: ChildNode[] = [];
  for (let i = 0; i < el.childNodes.length; i++) {
    out.push(el.childNodes[i]);
  }
  return out;
}

function attributesOf(el: ElementNode): { name: string; value: string }[] {
  const out: { name: string; value: string }[] = [];
  for (let i = 0; i < el.attributes.length; i++) {
    out.push({ name: el.attributes[i].name, value: el.attributes[i].value });
  }
  return out;
}

function isSpacerRect(el: ElementNode): boolean {
  if (el.nodeName.toLowerCase() !== "rect") return false;
  const width = attrValue(el, "width");
  const height = attrValue(el, "height");
  const x = numericAttr(el, "x");
  const y = numericAttr(el, "y");
  return width === "256" && height === "256" && x === "0" && y === "0";
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function serializeElement(el: ElementNode): string {
  const tag = el.nodeName;
  const attrs = attributesOf(el)
    .map(({ name, value }) => `${name}="${escapeAttr(value)}"`)
    .join(" ");
  const attrStr = attrs ? ` ${attrs}` : "";
  const childXml: string[] = [];

  for (const child of childrenOf(el)) {
    if (child.nodeType === 1) {
      childXml.push(serializeElement(child as unknown as ElementNode));
    } else if (child.nodeType === 3) {
      const text = child.nodeValue?.trim();
      if (text) childXml.push(text);
    }
  }

  if (childXml.length === 0) {
    return `<${tag}${attrStr}/>`;
  }

  return `<${tag}${attrStr}>${childXml.join("")}</${tag}>`;
}

function walkElements(el: ElementNode, visit: (node: ElementNode) => void): void {
  visit(el);
  for (const child of childrenOf(el)) {
    if (isElement(child)) {
      walkElements(child as unknown as ElementNode, visit);
    }
  }
}

function assertSafe(root: ElementNode): void {
  walkElements(root, (el) => {
    const name = el.nodeName.toLowerCase();
    if (name === "script" || name === "foreignobject") {
      throw new NormalizeError(`Rejected element <${el.nodeName}>`);
    }

    for (const attr of attributesOf(el)) {
      if (/^on/i.test(attr.name)) {
        throw new NormalizeError(`Rejected event handler ${attr.name}`);
      }

      if (HREF_ATTRS.has(attr.name.toLowerCase())) {
        const value = attr.value.trim();
        if (/^(javascript:|https?:)/i.test(value)) {
          throw new NormalizeError(`Rejected URL in ${attr.name}`);
        }
      }
    }
  });
}

function replaceCurrentColor(el: ElementNode): void {
  for (const attr of attributesOf(el)) {
    if (/#0+\b/i.test(attr.value)) {
      el.setAttribute(attr.name, attr.value.replace(/#0+\b/gi, "currentColor"));
    }
  }
}

function stripEditorAttrs(el: ElementNode): void {
  for (const attr of attributesOf(el)) {
    const name = attr.name;
    const lower = name.toLowerCase();
    const drop =
      DROP_ATTRS.has(name) ||
      DROP_ATTRS.has(lower) ||
      lower.startsWith("data-") ||
      DROP_ATTR_PREFIXES.some((prefix) => lower.startsWith(prefix));
    if (drop) {
      el.removeAttribute(name);
    }
  }
}

function stripStrokeAttrs(el: ElementNode): void {
  for (const name of STROKE_ATTRS) {
    el.removeAttribute(name);
  }
}

function pruneTree(el: ElementNode): void {
  for (const child of childrenOf(el)) {
    if (child.nodeType === 8) {
      el.removeChild(child);
      continue;
    }
    if (child.nodeType !== 1) {
      if (child.nodeType === 3 && !child.nodeValue?.trim()) {
        el.removeChild(child);
      }
      continue;
    }

    const childEl = child as unknown as ElementNode;
    const name = childEl.nodeName.toLowerCase();

    if (DROP_ELEMENTS.has(name) || isSpacerRect(childEl)) {
      el.removeChild(child);
      continue;
    }

    pruneTree(childEl);
  }
}

function applyVariant(svg: ElementNode, variant: Variant): void {
  const xmlns = attrValue(svg, "xmlns") || "http://www.w3.org/2000/svg";

  while (svg.attributes.length > 0) {
    svg.removeAttribute(svg.attributes[0].name);
  }

  svg.setAttribute("xmlns", xmlns);
  svg.setAttribute("viewBox", "0 0 256 256");

  if (variant === "regular") {
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "16");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
  } else {
    svg.setAttribute("fill", "currentColor");
  }

  walkElements(svg, (el) => {
    if (el === svg) return;
    replaceCurrentColor(el);
    stripEditorAttrs(el);
    stripStrokeAttrs(el);
    if (variant === "regular" && attrValue(el, "fill") === "none") {
      el.removeAttribute("fill");
    }
  });
}

function parseSvg(raw: string): ElementNode {
  const errors: string[] = [];
  const parser = new DOMParser({
    onError(level, message) {
      if (level === "warning") return;
      errors.push(String(message));
    },
  });

  let doc: { documentElement: ElementNode | null };
  try {
    doc = parser.parseFromString(raw, "image/svg+xml") as unknown as {
      documentElement: ElementNode | null;
    };
  } catch (err) {
    throw new NormalizeError(
      `Unparseable SVG: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (errors.length > 0) {
    throw new NormalizeError(`Unparseable SVG: ${errors[0]}`);
  }

  const root = doc.documentElement;
  if (!root || root.nodeName.toLowerCase() !== "svg") {
    throw new NormalizeError("Rejected markup that is not an <svg> document");
  }

  return root;
}

function assertViewBox(svg: ElementNode): void {
  const viewBox = attrValue(svg, "viewBox").trim();
  const width = attrValue(svg, "width").trim();
  const height = attrValue(svg, "height").trim();

  if (VIEWBOX_24.test(viewBox) || width === "24" || height === "24") {
    throw new NormalizeError(
      "Rejected Lucide-style viewBox 24 (expected 0 0 256 256)"
    );
  }

  if (viewBox && !VIEWBOX_256.test(viewBox)) {
    throw new NormalizeError(
      `Rejected viewBox "${viewBox}" (expected 0 0 256 256)`
    );
  }
}

export function normalizeSvg(raw: string, variant: Variant): string {
  if (typeof raw !== "string" || raw.trim() === "") {
    throw new NormalizeError("Rejected empty SVG");
  }

  const bytes = Buffer.byteLength(raw, "utf8");
  if (bytes > MAX_SVG_BYTES) {
    throw new NormalizeError(
      `Rejected SVG over ${MAX_SVG_BYTES} bytes (${bytes})`
    );
  }

  if (!/<svg[\s>]/i.test(raw)) {
    throw new NormalizeError("Rejected markup that is not SVG");
  }

  const svg = parseSvg(raw);
  assertSafe(svg);
  assertViewBox(svg);
  pruneTree(svg);
  applyVariant(svg, variant);

  return serializeElement(svg);
}
