#!/usr/bin/env node
import { initProject } from "subjective-c";

const args = process.argv.slice(2);
const force = args.includes("--force");
const target = args.find((value) => !value.startsWith("-")) || "my-subjective-app";

initProject(target, { force }).catch((error) => {
  console.error(`\nCould not create the app: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
