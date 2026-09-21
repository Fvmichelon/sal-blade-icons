#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { addIcon } from "./lib/add-icon";

const program = new Command();

program
  .name("icons:add")
  .description("Register a custom icon (regular | fill | duotone)")
  .requiredOption("-n, --name <name>", "Icon name (slugified to kebab-case)")
  .requiredOption(
    "-v, --variant <variant>",
    "Variant: regular, fill, or duotone"
  )
  .requiredOption("-f, --file <file>", "Path to the source SVG");

program.parse(process.argv);
const opts = program.opts<{ name: string; variant: string; file: string }>();

try {
  const result = addIcon({
    name: opts.name,
    variant: opts.variant,
    file: opts.file,
  });
  console.log(
    chalk.green(
      `Added ${result.slug} (${result.variant}) → ${result.flattenPath}`
    )
  );
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(chalk.inverse.red(" FAIL "), message);
  process.exit(1);
}
