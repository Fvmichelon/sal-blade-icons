# Changelog

All notable changes to this Composer package are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

Package versions are **git tags** (for example `v1.0.0`), not a `version` field in `composer.json`.

## [Unreleased]

### Changed

- Packagist package name is `fvmichelon/sal-blade-icons` (vendor `sal` was already claimed). Blade prefix stays `sal`; PHP namespace stays `Sal\SalBladeIcons`.
- Documentation trimmed to SAL product docs only (no third-party consumer-app or Blade-package tour links).

### Added

- Icons (regular): `analyze`, `humanize`, `implement`, `optimize`, `search`, `transform`.
- README: copy-paste agent prompt for adding SVGs, plus step-by-step publish / `composer require` / usage.

## [1.0.0] - 2026-09-21

### Added

- Composer package `fvmichelon/sal-blade-icons` with Blade prefix `sal`.
- Three published families only: `regular` (real CSS-controllable stroke), `fill`, and `duotone`.
- Flattened SVGs in `resources/svg` (`{slug}.svg`, `{slug}-fill.svg`, `{slug}-duotone.svg`).
- CLI: `pnpm build:icons`, `pnpm icons:add`, `pnpm sync:upstream`.
- Catalog at `catalog/icons.json`.

### Changed

- Based on Phosphor Icons (MIT). Regular icons come from `raw/regular` (stroke). Fill and duotone come from `assets/fill` and `assets/duotone`.
- Unpublished weights: `thin`, `light`, `bold`.

### Credits

- Based on Phosphor Icons (MIT).
