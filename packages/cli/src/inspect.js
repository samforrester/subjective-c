import { readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { compileSubjective, createVariants } from "@subjective-c/core";
import { color } from "./terminal.js";
import { loadConfig } from "./utils.js";

export async function inspectSource(path, options = {}) {
  const input = resolve(path || "app.subjective");
  const metadata = await stat(input);
  const projectDirectory = metadata.isDirectory() ? input : dirname(input);
  const { config } = await loadConfig(projectDirectory, options.config || "subjective.config.js");
  const sourcePath = metadata.isDirectory() ? resolve(projectDirectory, options.spec || config.spec || "app.subjective") : input;
  const source = await readFile(sourcePath, "utf8");
  const novelty = options.novelty ?? config.novelty;
  const manifest = compileSubjective(source, { novelty });
  const variants = createVariants(manifest, {
    count: Number(options.count || 4),
    seed: options.seed || manifest.source.hash,
    novelty,
    context: { experience: options.experience || config.context?.experience || "returning" }
  });

  if (options.json) {
    console.log(JSON.stringify({ manifest, variants }, null, 2));
    return { manifest, variants };
  }

  console.log(`\n${color.bold(manifest.name)} ${color.dim(`(${manifest.slug})`)}`);
  console.log(color.dim(manifest.intent.goal));
  console.log(`\n${color.cyan("Intent")}`);
  console.log(`  must        ${manifest.intent.must.length}`);
  console.log(`  prefer      ${manifest.intent.prefer.length}`);
  console.log(`  avoid       ${manifest.intent.avoid.length}`);
  console.log(`  adapt       ${manifest.intent.adapt.length}`);
  console.log(`  novelty     ${Math.round(manifest.policies.novelty * 100)}%`);
  console.log(`  stability   ${Math.round(manifest.policies.stability * 100)}%`);
  console.log(`\n${color.cyan("Capabilities")}`);
  for (const capability of manifest.capabilities) {
    console.log(`  ${capability.required ? color.green("◆") : color.dim("◇")} ${capability.label.padEnd(20)} ${color.dim(capability.kind)}`);
  }
  console.log(`\n${color.cyan("Sample interpretations")}`);
  for (const variant of variants) {
    console.log(`  ${color.magenta(variant.id.padEnd(12))} ${variant.layout.padEnd(22)} ${variant.density.padEnd(12)} ${variant.composition.collection}`);
  }
  console.log("");
  return { manifest, variants };
}
