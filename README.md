# sal-blade-icons

Composer package of SVG icons for Laravel Blade Icons.

**Based on Phosphor Icons (MIT).**

This git repo **is** the package. Published files live in `resources/svg/` and are committed. Consumer apps do not copy thousands of SVGs into their own git.

| Variant | File | Blade |
| --- | --- | --- |
| `regular` (real stroke) | `house.svg` | `<x-sal-house />` |
| `fill` | `house-fill.svg` | `<x-sal-house-fill />` |
| `duotone` | `house-duotone.svg` | `<x-sal-house-duotone />` |

There are no `thin`, `light`, or `bold` weights. `stroke-width` / `skw-…` classes only apply to **regular**.

Package name: `sal/sal-blade-icons`  
GitHub: https://github.com/Fvmichelon/sal-blade-icons  
Composer version = **git tag** (e.g. `v1.0.0`). There is no `"version"` field in `composer.json`.

---

## Agent prompt (copy this)

Open a **new** agent chat in this repo. Paste the block below, then paste the SVG code and/or attach the `.svg` file(s). Add a name if you already have one (`--name="parking meter"`). If you omit name or variant, the agent infers them.

```text
You are in the sal-blade-icons repo (Composer package sal/sal-blade-icons).

Add the icon(s) I provide in this message (SVG markup and/or .svg files).

Rules you must follow:
- Families: regular | fill | duotone only. Never thin/light/bold.
- regular = outline with REAL stroke, viewBox "0 0 256 256". fill = solid currentColor, no CSS stroke. duotone = two layers, keep opacity (typically 0.2 + solid), no CSS stroke.
- 24×24 canvases are invalid as-is. Rescale the artwork into viewBox 0 0 256 256 before adding. Do not mix stroke-width scales (16 on 256 ≠ 2 on 24).
- Reject <script>, on* handlers, foreignObject, javascript: / http(s): hrefs. Prefer pnpm icons:add (it sanitizes).
- Prefer a filesystem path (folder or file via @) or pasted SVG markup. Cursor chat “attachments” of .svg often arrive only as PNG previews under the IDE assets cache — that is NOT the SVG source.
- When I point to a path or paste markup: OPEN the .svg and READ its XML/source. Copy that markup into drafts/. Never treat an SVG as a raster/screenshot, never auto-trace or redraw from a preview/thumbnail, and never invent geometry from an image description of the icon.
- If you cannot open the .svg and read its real source (e.g. chat only gave a PNG/preview/caption, or the path is missing): STOP. Ask me whether to (a) wait while I paste the SVG markup / @ a real folder or .svg path, or (b) proceed anyway with a best-effort recreation. Do not proceed with (b) unless I explicitly choose it.
- Do NOT write by hand into resources/svg/. Save drafts under drafts/ (gitignored), then run:
  pnpm icons:add --name="human name" --variant=regular --file=drafts/whatever.svg
  Repeat per variant if I gave fill/duotone too.
- Slug = kebab-case from the name. If that slug+variant already exists, STOP and tell me. Completing a missing variant of an existing slug is OK.
- If I did not specify variant: outline/stroke → regular; solid filled → fill; two opacities → duotone.
- If I did not specify a name: derive a short English kebab-case slug from the file or the drawing.
- After each add, the CLI writes assets/{variant}/{slug}.svg AND resources/svg/{slug}.svg (or -fill / -duotone) and updates catalog/icons.json.
- Run pnpm test. Update CHANGELOG.md [Unreleased] with the new slug(s).
- Do not git tag, do not push, do not commit unless I explicitly ask. Do not build a web UI.
- Read README.md sections "Add a new icon" and "What the SVG should look like" if unsure.

Then reply with: slug, variant(s), flatten path(s), Blade <x-sal-… />, and whether a new Composer tag is still needed for apps to see it (yes).
```

After the agent finishes, publish a new package version (tag) so other Laravel apps can `composer update` — see [Publish a new version](#2-publish-a-new-version-after-the-first-release) below.

---

## 1. Publish the package (first time)

The code is already on `main` at https://github.com/Fvmichelon/sal-blade-icons. Composer does **not** use a version in `composer.json`. Apps only see a release after a **semver git tag**.

There is no tag yet. First release is `v1.0.0`.

### A. Tag the current `main`

On a clean working tree, in this repo:

```bash
git checkout main
git pull origin main
git tag v1.0.0
git push origin v1.0.0
```

Check the tag on GitHub: **Releases** or `https://github.com/Fvmichelon/sal-blade-icons/releases/tag/v1.0.0`.

### B. Register on Packagist (public — preferred)

Do this **once**. After that, each new tag can update automatically.

1. Sign in at [packagist.org](https://packagist.org) with GitHub.
2. Confirm you can publish under the vendor **`sal`**. Packagist vendor names are claimed per account. If submit fails because `sal` is taken or not yours, either get access to that vendor or change `"name"` in `composer.json` (and this README) to a vendor you own, then commit before tagging.
3. [Submit package](https://packagist.org/packages/submit) → Git repository URL:

   `https://github.com/Fvmichelon/sal-blade-icons`

4. Packagist should create a GitHub webhook. Confirm under the GitHub repo **Settings → Webhooks**. If the hook is missing, on the Packagist package page use **Update** after each tag, or add the hook from Packagist’s package settings.
5. Wait until the package page shows version `1.0.0`.

Until Packagist is live, other projects can still install via Git VCS (step 3 below).

### C. Private Packagist / Satis

If you already have a private mirror: point that mirror at the same git repo + tags. Do not invent a second registry.

---

## 2. Publish a new version (after the first release)

Use this every time you add or fix icons.

| Change | Bump |
| --- | --- |
| New icons / SVG / catalog | **minor** `v1.x.0` (or **patch** `v1.0.x` if you only corrected an already published SVG) |
| Large upstream icon sync | minor, or major if names break |
| PHP / docs / provider bugfix only | patch |

```bash
# clean tree, on main
pnpm test && pnpm build:icons
# edit CHANGELOG.md (move [Unreleased] items into the new version heading)

git add -A
git commit -m "feat(icons): add {slug}"
git push origin main

git tag v1.1.0
git push origin v1.1.0
```

If the Packagist webhook is connected, the new version appears on its own. Otherwise click **Update** on the Packagist package page.

Apps do **not** see the icon until they install/update that tag. Do not hand-edit the consumer’s `composer.lock` to inject SVGs.

---

## 3. `composer require` in another Laravel project

Pick **one** install mode.

### Mode 1 — Packagist (after step 1.B)

No extra `repositories` entry:

```bash
cd path/to/laravel-app
composer require sal/sal-blade-icons
php artisan icons:cache
```

Later, after a new tag:

```bash
composer update sal/sal-blade-icons
php artisan icons:cache
```

### Mode 2 — GitHub VCS (works as soon as `v1.0.0` exists; no Packagist)

In the **Laravel app** `composer.json`:

```json
{
  "repositories": [
    {
      "type": "vcs",
      "url": "https://github.com/Fvmichelon/sal-blade-icons.git"
    }
  ]
}
```

Private clone: use `git@github.com:Fvmichelon/sal-blade-icons.git` and an SSH key (or HTTPS credentials) on that machine.

```bash
composer require sal/sal-blade-icons:^1.0
php artisan icons:cache
```

The constraint still resolves to **tags** (`v1.0.0`, `v1.1.0`, …). `dev-main` is only for local experiments, not production.

### Mode 3 — Path (this machine only, before you tag)

In the Laravel app `composer.json`, with this repo as a sibling directory:

```json
{
  "repositories": [
    {
      "type": "path",
      "url": "../sal-blade-icons",
      "options": { "symlink": true }
    }
  ]
}
```

```bash
composer require sal/sal-blade-icons:@dev
```

Useful to preview an icon before tagging. Not a distribution method.

---

## 4. Use the icons in the app

Blade prefix is `sal` (`config/sal-icons.php`). Filename → component:

```blade
<x-sal-house class="w-6 h-6" />
<x-sal-house-fill class="w-6 h-6 text-slate-900" />
<x-sal-house-duotone class="w-6 h-6" />
```

Regular only — CSS can change the stroke (viewBox 256, default `stroke-width="16"` on the `<svg>`):

```blade
<x-sal-house class="w-8 h-8" style="stroke-width: 12" />
```

Helper (Blade Icons):

```blade
{!! svg('sal-house')->class('w-6 h-6') !!}
```

Optional publish of config:

```bash
php artisan vendor:publish --tag=sal-blade-icons-config
```

SVGs install under `vendor/sal/sal-blade-icons/resources/svg`. Run `php artisan icons:cache` on deploy.

---

## Add a new icon (any SVG you found)

Cadastro is **file + CLI**. There is no website or admin UI.

You may start from outline drawings, Figma exports, or an SVG you found — as long as the license allows reuse here (keep MIT attribution in `NOTICE` if you incorporate third-party work).

### 1. Choose the family

| Looks like | Variant | You will get |
| --- | --- | --- |
| Outline, line art, CSS should control thickness | `regular` | `resources/svg/{slug}.svg` |
| Solid silhouette, no outline | `fill` | `resources/svg/{slug}-fill.svg` |
| Two tones / a faded under-layer + a crisp overlay | `duotone` | `resources/svg/{slug}-duotone.svg` |

Same logical icon can have 1–3 files (regular and/or fill and/or duotone). Each variant is a separate `pnpm icons:add` call.

### 2. Where to put the file **before** the CLI

Put the **draft** anywhere; `drafts/` is the convention (gitignored). Examples:

```text
drafts/parking-meter.svg              →  --variant=regular
drafts/parking-meter-fill.svg         →  --variant=fill
drafts/parking-meter-duotone.svg      →  --variant=duotone
```

Do **not** drop drafts into:

| Folder | Why not |
| --- | --- |
| `resources/svg/` | Published flatten; the CLI writes this after normalize |
| `raw/regular/` | Upstream stroke snapshot only (`pnpm sync:upstream`) |
| `assets/thin` etc. | Those weights do not exist |

### 3. Where the CLI writes **after** a successful add

| Variant | Canonical source (keep in git) | Published flatten (what Laravel loads) |
| --- | --- | --- |
| regular | `assets/regular/{slug}.svg` | `resources/svg/{slug}.svg` |
| fill | `assets/fill/{slug}.svg` | `resources/svg/{slug}-fill.svg` |
| duotone | `assets/duotone/{slug}.svg` | `resources/svg/{slug}-duotone.svg` |

`catalog/icons.json` is updated automatically.

### 4. Run the CLI

```bash
pnpm install   # first time in this clone

pnpm icons:add --name="parking meter" --variant=regular --file=drafts/parking-meter.svg
pnpm icons:add --name="parking meter" --variant=fill --file=drafts/parking-meter-fill.svg
pnpm icons:add --name="parking meter" --variant=duotone --file=drafts/parking-meter-duotone.svg

pnpm test
```

`--name` becomes a kebab-case slug (`parking-meter`). It must match `[a-z0-9]+(-[a-z0-9]+)*`.

If `resources/svg/parking-meter.svg` already exists, regular is refused (exit ≠ 0, nothing written). You can still add fill/duotone for that slug.

Then commit **this** repo and **tag** a new version (section 2). Until you tag, other projects will not see the icon.

Bulk upstream updates: `pnpm sync:upstream --tag=v2.0.8` then `pnpm build:icons`, not `icons:add`.

---

## What the SVG should look like

All variants:

- Root is `<svg>`, parseable XML.
- `viewBox="0 0 256 256"`. **Not** a 24×24 canvas.
- No `width` / `height` required (the CLI strips them).
- No editor junk needed (`id`, Inkscape/Adobe metadata, comments) — stripped.
- No `<script>`, `onclick` / other `on*`, `<foreignObject>`, or `href="javascript:…"` / `http(s):…` — those are **rejected**, not silently stripped.
- Keep it small (limit 100 KB).
- Prefer `currentColor` (or `#000`; the CLI rewrites black to `currentColor`) so Blade `class="text-…"` works.
- Do not include a full-canvas spacer `<rect width="256" height="256">`. The CLI removes it; if it stayed, regular icons would draw a frame because stroke lives on the root.

### `regular` (stroke)

Artwork should be **strokes**, not a filled logo pretending to be outline.

After normalize, the root looks like this (children keep `d` / geometry only):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round">
  <path d="M104,216V152h48v64h64V120a8,8,0,0,0-2.34-5.66l-80-80a8,8,0,0,0-11.32,0l-80,80A8,8,0,0,0,40,120v96Z"/>
</svg>
```

Drafts may still have `stroke` / `stroke-width` on `<path>` / `<line>`; the CLI **moves** stroke to the root so CSS `stroke-width` on `<x-sal-…>` works.

A typical draft:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <path d="…" fill="none" stroke="#000" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

If you only have a 24×24 outline: scale path coordinates × (256/24) and set `viewBox="0 0 256 256"`. Do not set `stroke-width="2"` on a 256 canvas for regular icons.

### `fill`

Solid shapes. Root `fill="currentColor"`. No presentation `stroke` on the root.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
  <path d="M224,120v96a8,8,0,0,1-8,8H160a8,8,0,0,1-8-8V164…"/>
</svg>
```

Keep `fill="none"` on a child only when that child is a hole/cut, not the 256 canvas rect.

### `duotone`

Two (or more) layers. Preserve `opacity` on the light layer (typically `0.2`). Root `fill="currentColor"`. No CSS stroke.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
  <path d="…" opacity="0.2"/>
  <path d="…"/>
</svg>
```

Published duotone uses fill-style layers (`assets/duotone`), not stroke+opacity outlines.

---

## Tooling in this repo

```bash
pnpm install
pnpm test
pnpm build:icons
pnpm icons:add --name="My Icon" --variant=regular --file=./drafts/my-icon.svg
pnpm sync:upstream --tag=v2.0.8
```

- `build:icons` — normalize `raw/regular` + `assets/fill` + `assets/duotone`, write canonical `assets/{variant}/{slug}.svg`, flatten `resources/svg/`, rewrite `catalog/icons.json`.
- `sync:upstream` — fetch an upstream core tag (three families only) and collate.
- Regular source of truth is `raw/regular` (stroke). Fill/duotone sources are `assets/fill` and `assets/duotone`.

Upstream pin: `catalog/sync-meta.json`.

---

## Layout

```text
composer.json                 # sal/sal-blade-icons
src/SalBladeIconsServiceProvider.php
config/sal-icons.php          # prefix: sal
resources/svg/                # flatten published to Laravel (committed)
assets/{regular,fill,duotone}/
raw/regular/                  # stroke upstream
catalog/icons.json
catalog/sync-meta.json
drafts/                       # your incoming SVGs (gitignored)
scripts/                      # normalize, collate, add-icon, sync-upstream
```

---

## License

MIT. See `LICENSE` and `NOTICE`.

Commercial use and Packagist redistribution are allowed **with** attribution. Do not remove the Phosphor credits in `NOTICE` / `LICENSE`.
