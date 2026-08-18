#!/usr/bin/env node
import { runCli } from "../src/cli.js";

runCli(process.argv.slice(2)).catch((error) => {
  console.error(`\nSubjective C failed: ${error instanceof Error ? error.message : String(error)}\n`);
  if (process.env.SUBJECTIVE_DEBUG && error instanceof Error) console.error(error.stack);
  process.exitCode = 1;
});
