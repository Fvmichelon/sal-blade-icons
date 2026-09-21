#!/usr/bin/env node
import chalk from "chalk";
import { collateIcons } from "./lib/collate";
import { syncMetaPath } from "./lib/paths";
import fs from "node:fs";

const started = Date.now();

try {
  const result = collateIcons();
  const metaFile = syncMetaPath();
  if (fs.existsSync(metaFile)) {
    const meta = JSON.parse(fs.readFileSync(metaFile, "utf8")) as {
      lastBuildAt?: string;
    };
    meta.lastBuildAt = new Date().toISOString();
    fs.writeFileSync(metaFile, `${JSON.stringify(meta, null, 2)}\n`, "utf8");
  }

  console.log(
    chalk.green(
      `Wrote ${result.written} SVGs (${result.slugs} slugs) in ${Date.now() - started}ms`
    )
  );
} catch (err) {
  console.error(chalk.inverse.red(" FAIL "), err instanceof Error ? err.message : err);
  process.exit(1);
}
