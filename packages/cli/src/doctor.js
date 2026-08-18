import { constants as fsConstants } from "node:fs";
import { access, readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { compileSubjective, createSubjectivePlan, createVariant, diagnoseSubjective, SUBJECTIVE_C_VERSION } from "@subjective-c/core";
import { resolveSafeOutputDirectory } from "./build.js";
import { color, logStep } from "./terminal.js";
import { exists, loadConfig, resolvePackageFile } from "./utils.js";

export async function doctorProject(projectDirectory) {
  const project = resolve(projectDirectory || ".");
  const major = Number(process.versions.node.split(".")[0]);
  const checks = [];
  checks.push({ name: "Node.js >= 20", ok: major >= 20, detail: process.version });
  checks.push({ name: "app.subjective", ok: await exists(resolve(project, "app.subjective")), detail: resolve(project, "app.subjective") });
  const loaded = await loadConfig(project).catch((error) => ({ error }));
  checks.push({ name: "subjective.config.js", ok: !loaded.error, detail: loaded.error?.message || (loaded.path ? loaded.path : "optional; using defaults") });
  const config = loaded.config || {};
  const specPath = resolve(project, config.spec || "app.subjective");
  try {
    await access(project, fsConstants.W_OK);
    checks.push({ name: "Project is writable", ok: true, detail: project });
  } catch (error) {
    checks.push({ name: "Project is writable", ok: false, detail: error.message });
  }
  try {
    const output = resolveSafeOutputDirectory(project, config.outDir || "dist", { allowExternal: config.allowExternalOutDir === true });
    checks.push({ name: "Safe output path", ok: true, detail: output });
  } catch (error) {
    checks.push({ name: "Safe output path", ok: false, detail: error.message });
  }
  try {
    const manifest = compileSubjective(await readFile(specPath, "utf8"), { ...(config.compiler || {}), novelty: config.novelty });
    const variant = createVariant(manifest, { seed: manifest.source.hash, context: { ...config.context, device: config.context?.device === "auto" ? "desktop" : config.context?.device } });
    const registry = config.componentPackage?.registry || config.registry;
    const plan = createSubjectivePlan(manifest, variant, registry ? { registry } : undefined);
    const diagnostics = diagnoseSubjective({ manifest, registry, plan });
    const errors = diagnostics.filter(({ severity }) => severity === "error");
    checks.push({
      name: "Manifest and plan contracts",
      ok: errors.length === 0,
      detail: errors.length ? errors.map(({ message }) => message).join(" ") : `${manifest.schema} · ${plan.schema} · ${plan.reachableCapabilities.length} reachable capabilities · ${diagnostics.length} diagnostics`
    });
  } catch (error) {
    checks.push({ name: "Manifest and plan contracts", ok: false, detail: error.message });
  }
  const staleStages = (await readdir(project).catch(() => [])).filter((name) => name.startsWith(".subjective-stage-"));
  checks.push({ name: "No stale build staging", ok: staleStages.length === 0, detail: staleStages.length ? staleStages.join(", ") : "clean" });
  checks.push({ name: "Framework version", ok: SUBJECTIVE_C_VERSION === "0.2.0-alpha.2", detail: SUBJECTIVE_C_VERSION });
  try {
    checks.push({ name: "@subjective-c/core", ok: true, detail: resolvePackageFile("@subjective-c/core") });
  } catch (error) {
    checks.push({ name: "@subjective-c/core", ok: false, detail: error.message });
  }
  try {
    checks.push({ name: "@subjective-c/runtime", ok: true, detail: resolvePackageFile("@subjective-c/runtime/browser") });
  } catch (error) {
    checks.push({ name: "@subjective-c/runtime", ok: false, detail: error.message });
  }

  console.log("");
  for (const check of checks) {
    logStep(check.ok ? color.green("✓") : color.red("×"), check.name, check.detail);
  }
  console.log("");
  if (checks.some((check) => !check.ok)) {
    throw new Error("One or more doctor checks failed.");
  }
  return checks;
}
