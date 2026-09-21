#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import { collateIcons } from "./lib/collate";
import { canonicalDir, rawRegularDir, resolveRoot, syncMetaPath } from "./lib/paths";
import { ensureDir } from "./lib/paths";

const UPSTREAM = "https://github.com/phosphor-icons/core.git";
const DEFAULT_TAG = "v2.0.8";

function run(cmd: string, args: string[], cwd: string): string {
  const result = spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    shell: false,
  });
  if (result.status !== 0) {
    throw new Error(
      `${cmd} ${args.join(" ")} failed:\n${result.stderr || result.stdout}`
    );
  }
  return result.stdout.trim();
}

function copyDirContents(from: string, to: string): number {
  ensureDir(to);
  let count = 0;
  for (const entry of fs.readdirSync(from)) {
    const src = path.join(from, entry);
    if (!fs.statSync(src).isFile()) continue;
    if (!entry.toLowerCase().endsWith(".svg")) continue;
    fs.copyFileSync(src, path.join(to, entry));
    count += 1;
  }
  return count;
}

const program = new Command();
program
  .option(
    "-t, --tag <tag>",
    "phosphor-icons/core git tag to copy from",
    DEFAULT_TAG
  )
  .option(
    "--repo <url>",
    "Upstream git URL",
    UPSTREAM
  );

program.parse(process.argv);
const opts = program.opts<{ tag: string; repo: string }>();
const root = resolveRoot();

try {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sal-blade-icons-upstream-"));
  console.log(chalk.cyan(`Cloning ${opts.repo} @ ${opts.tag} (sparse, 3 families)`));

  run("git", ["init"], tmp);
  run("git", ["remote", "add", "origin", opts.repo], tmp);
  run("git", ["sparse-checkout", "init", "--cone"], tmp);
  run(
    "git",
    ["sparse-checkout", "set", "raw/regular", "assets/fill", "assets/duotone"],
    tmp
  );
  run("git", ["fetch", "--depth", "1", "origin", `refs/tags/${opts.tag}:refs/tags/${opts.tag}`], tmp);
  run("git", ["checkout", opts.tag], tmp);

  const commit = run("git", ["rev-parse", "HEAD"], tmp);
  const copied = {
    regular: copyDirContents(path.join(tmp, "raw", "regular"), rawRegularDir(root)),
    fill: copyDirContents(path.join(tmp, "assets", "fill"), canonicalDir("fill", root)),
    duotone: copyDirContents(
      path.join(tmp, "assets", "duotone"),
      canonicalDir("duotone", root)
    ),
  };

  fs.rmSync(tmp, { recursive: true, force: true });

  const result = collateIcons(root);
  const meta = {
    upstreamRepo: opts.repo,
    upstreamTag: opts.tag,
    upstreamCommit: commit,
    variants: ["regular", "fill", "duotone"],
    copied,
    slugs: result.slugs,
    written: result.written,
    syncedAt: new Date().toISOString(),
    note:
      "Only regular (raw), fill, and duotone are imported. thin/light/bold are discarded.",
  };

  ensureDir(path.dirname(syncMetaPath(root)));
  fs.writeFileSync(syncMetaPath(root), `${JSON.stringify(meta, null, 2)}\n`, "utf8");

  console.log(
    chalk.green(
      `Synced ${opts.tag} (${commit.slice(0, 8)}): ${result.written} SVGs, ${result.slugs} slugs`
    )
  );
} catch (err) {
  console.error(chalk.inverse.red(" FAIL "), err instanceof Error ? err.message : err);
  process.exit(1);
}
