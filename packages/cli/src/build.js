import { basename, dirname, extname, isAbsolute, parse, relative, resolve } from "node:path";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { compileSubjective, compileWithProvider, createSubjectivePlan, createVariant, SUBJECTIVE_C_VERSION } from "@subjective-c/core";
import { color, logStep } from "./terminal.js";
import {
  copyDirectory,
  exists,
  loadConfig,
  resolvePackageFile,
  serializable
} from "./utils.js";


function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function resolveSafeOutputDirectory(projectDirectory, requested = "dist", options = {}) {
  const project = resolve(projectDirectory);
  const output = resolve(project, requested);
  const relativePath = relative(project, output);
  const outsideProject = relativePath === ".." || relativePath.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) || isAbsolute(relativePath);
  if (output === project) throw new Error("Refusing to use the project root as the build output directory.");
  if (output === parse(output).root) throw new Error("Refusing to use a filesystem root as the build output directory.");
  if (output === resolve(homedir())) throw new Error("Refusing to use the user home directory as the build output directory.");
  if (outsideProject && options.allowExternal !== true) {
    throw new Error(`Build output must stay inside the project: ${output}. Set allowExternalOutDir only for an intentional external path.`);
  }
  return output;
}

function defaultData(manifest) {
  const singular = manifest.domain.singular;
  const examples = [
    {
      name: `Launch ${manifest.name}`,
      status: "In progress",
      owner: "Demo user",
      progress: 72,
      due: "This week",
      description: `Turn the ${manifest.name} intent into something people can use and critique.`,
      tags: ["Launch", "Core"]
    },
    {
      name: `Define the ${singular.toLowerCase()} model`,
      status: "Review",
      owner: "Alex Chen",
      progress: 88,
      due: "Tomorrow",
      description: `Make the generated interface understand the important parts of a ${singular.toLowerCase()}.`,
      tags: ["Schema", "Product"]
    },
    {
      name: "Test a novice interpretation",
      status: "Planned",
      owner: "Maya Singh",
      progress: 20,
      due: "Next week",
      description: "Check that guidance appears without making the product feel slow or patronizing.",
      tags: ["Research", "UX"]
    },
    {
      name: "Stabilize primary actions",
      status: "Done",
      owner: "Jordan Lee",
      progress: 100,
      due: "Completed",
      description: "Keep semantics and high-frequency actions familiar across visual interpretations.",
      tags: ["Runtime", "Safety"]
    },
    {
      name: "Provider adapter RFC",
      status: "Blocked",
      owner: "Riley Park",
      progress: 18,
      due: "Friday",
      description: "Define a clean boundary for external language-model compilers.",
      tags: ["RFC", "Providers"]
    },
    {
      name: "Open-source launch checklist",
      status: "In progress",
      owner: "Demo user",
      progress: 54,
      due: "Aug 28",
      description: "Documentation, examples, contribution flow, package publishing, and governance.",
      tags: ["OSS", "Docs"]
    }
  ];

  return {
    metrics: [
      { label: `Active ${manifest.domain.plural.toLowerCase()}`, value: "12", delta: "+3 this week" },
      { label: "Completion rate", value: "68%", delta: "+8.4%" },
      { label: "Needs attention", value: "3", delta: "-1 today" },
      { label: "Team velocity", value: "1.7×", delta: "+0.2×" }
    ],
    items: examples,
    activity: [
      { actor: "Maya", text: "moved novice interpretation into review", time: "8 minutes ago", tag: "Research" },
      { actor: "Jordan", text: "completed stable primary actions", time: "34 minutes ago", tag: "Runtime" },
      { actor: "Alex", text: "updated the intent manifest schema", time: "2 hours ago", tag: "Schema" },
      { actor: "You", text: "generated a new command-center variant", time: "Yesterday", tag: "Variant" }
    ]
  };
}

function htmlDocument(manifest) {
  const title = escapeHtml(manifest.name);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#11131a" />
    <meta name="description" content="${title}, compiled by Subjective C." />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'" />
    <title>${title} · Subjective C</title>
    <link rel="stylesheet" href="./_subjective/runtime/styles.css" />
  </head>
  <body>
    <div id="app"></div>
    <noscript>Subjective C needs JavaScript to interpret this interface.</noscript>
    <script type="module" src="./app.js"></script>
  </body>
</html>
`;
}

function browserEntry({ source, manifest, data, config, registry, themeTokens, dev }) {
  const safeConfig = {
    novelty: Number(config.novelty ?? manifest.policies.novelty),
    devtools: config.devtools !== false,
    inspectorOpen: config.inspectorOpen !== false,
    preferences: serializable(config.preferences, {}) || {},
    themeTokens: serializable(themeTokens, {}) || {},
    context: {
      experience: config.context?.experience || "returning",
      device: config.context?.device || "auto",
      attention: config.context?.attention || "focused",
      input: config.context?.input || "auto",
      motion: config.context?.motion || "auto",
      contrast: config.context?.contrast || "auto",
      locale: config.context?.locale || "en"
    }
  };

  return `import { compileSubjective, createSubjectivePlan, createVariant, SUBJECTIVE_INTERPRETATIONS } from "./_subjective/core/index.js";
import { createPreferenceStore, mountSubjective } from "./_subjective/runtime/browser.js";

let source = ${JSON.stringify(source)};
let manifest = ${JSON.stringify(manifest, null, 2)};
let data = ${JSON.stringify(data, null, 2)};
const registry = ${JSON.stringify(registry, null, 2)};
const configuredContext = ${JSON.stringify(safeConfig.context, null, 2)};

function detectRuntimeContext(base) {
  const width = window.innerWidth;
  return {
    ...base,
    device: base.device === "auto" ? (width < 720 ? "mobile" : width < 1100 ? "tablet" : "desktop") : base.device,
    input: base.input === "auto" ? (matchMedia("(pointer: coarse)").matches ? "touch" : "pointer") : base.input,
    motion: base.motion === "auto" ? (matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduced" : "full") : base.motion,
    contrast: base.contrast === "auto" ? (matchMedia("(prefers-contrast: more)").matches ? "high" : "standard") : base.contrast
  };
}

let context = detectRuntimeContext(configuredContext);
let novelty = ${JSON.stringify(safeConfig.novelty)};
let locked = localStorage.getItem("subjective-c:locked") === "true";
let inspectorOpen = ${JSON.stringify(safeConfig.inspectorOpen)};
const devtools = ${JSON.stringify(safeConfig.devtools)};
const themeTokens = ${JSON.stringify(safeConfig.themeTokens, null, 2)};
const preferenceStore = createPreferenceStore();
let preferences = { ...${JSON.stringify(safeConfig.preferences, null, 2)}, ...preferenceStore.load() };
const urlParameters = new URLSearchParams(location.search);
const seedFromUrl = urlParameters.get("seed");
const interpretationFromUrl = urlParameters.get("interpretation");
const cinemaMode = urlParameters.get("cinema") === "1";
const cinemaAutoplayRequested = urlParameters.get("autoplay") === "1";
const cinemaRecording = urlParameters.get("recording") === "1";
document.documentElement.dataset.subjectiveCinemaRecording = cinemaRecording ? "on" : "off";
const interpretationIds = new Set(SUBJECTIVE_INTERPRETATIONS.map(({ id }) => id));
let interpretation = interpretationIds.has(interpretationFromUrl) ? interpretationFromUrl : null;
const cinemaSequence = ["gravity-well", "dream-fold", "mission-neon", "ship-command", "muni-control", "sutro-fog", "exploratorium-lab"];
let cinemaAutoplayTimer = null;

function freshSeed() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return String(Date.now()) + ":" + Math.random().toString(36).slice(2);
}

function stableSeed(nextContext = context) {
  return [manifest.source.hash, nextContext.experience, nextContext.device, nextContext.locale].join(":");
}

function assignedSeed(nextContext = context) {
  return manifest.policies.refresh === "new-variant" ? freshSeed() : stableSeed(nextContext);
}

let seed = seedFromUrl || (locked && localStorage.getItem("subjective-c:seed")) || assignedSeed();
const target = document.querySelector("#app");

function persistSeed() {
  if (locked) localStorage.setItem("subjective-c:seed", seed);
  else localStorage.removeItem("subjective-c:seed");
}

function transition(update) {
  if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.startViewTransition(() => {
      update();
      render();
    });
    return;
  }
  update();
  render();
}

function setCinemaPhase(phase) {
  if (!cinemaMode) return;
  document.documentElement.dataset.subjectiveCinema = ["intro", "live", "outro"].includes(phase) ? phase : "live";
}

function syncCinemaControls() {
  document.documentElement.dataset.subjectiveCinemaAutoplay = cinemaAutoplayTimer ? "on" : "off";
  const control = document.querySelector("[data-sc-cinema-autoplay]");
  control?.setAttribute("aria-pressed", cinemaAutoplayTimer ? "true" : "false");
}

function setInterpretation(value) {
  if (!interpretationIds.has(value)) return false;
  transition(() => {
    interpretation = value;
    seed = "cinema:" + value;
  });
  return true;
}

function toggleCinemaAutoplay(force) {
  const shouldPlay = force ?? !cinemaAutoplayTimer;
  if (cinemaAutoplayTimer) clearInterval(cinemaAutoplayTimer);
  cinemaAutoplayTimer = null;
  if (shouldPlay) {
    setCinemaPhase("live");
    cinemaAutoplayTimer = setInterval(() => {
      const current = cinemaSequence.indexOf(interpretation);
      setInterpretation(cinemaSequence[(current + 1 + cinemaSequence.length) % cinemaSequence.length]);
    }, 4200);
  }
  syncCinemaControls();
}

function exitCinema() {
  if (cinemaAutoplayTimer) clearInterval(cinemaAutoplayTimer);
  urlParameters.delete("cinema");
  urlParameters.delete("autoplay");
  const query = urlParameters.toString();
  location.assign(location.pathname + (query ? "?" + query : ""));
}

function render() {
  const variant = createVariant(manifest, { seed, context, novelty, interpretation: interpretation || undefined });
  const plan = createSubjectivePlan(manifest, variant, registry ? { registry } : undefined);
  document.documentElement.dataset.subjectiveVariant = variant.id;
  document.documentElement.dataset.subjectiveLayout = variant.layout;
  document.documentElement.dataset.subjectiveInterpretation = variant.theme.interpretation;
  window.SubjectiveC = { source, manifest, variant, plan, data, context, novelty, seed, interpretation, preferences, reinterpret, setInterpretation, setCinemaPhase, toggleCinemaAutoplay, exitCinema };
  mountSubjective(target, {
    source,
    manifest,
    variant,
    plan,
    data,
    devtools,
    locked,
    inspectorOpen,
    preferences,
    themeTokens,
    cinemaMode,
    callbacks: {
      onRegenerate: reinterpret,
      onInterpretationChange(value) {
        if (value && interpretationIds.has(value)) {
          setInterpretation(value);
          return;
        }
        transition(() => {
          interpretation = value;
          seed = freshSeed();
        });
      },
      onCinemaPhaseChange: setCinemaPhase,
      onCinemaAutoplay: toggleCinemaAutoplay,
      onCinemaExit: exitCinema,
      onInspectorChange(open) {
        inspectorOpen = open;
      },
      onContextChange(patch) {
        context = { ...context, ...patch };
        seed = assignedSeed(context);
        persistSeed();
        render();
      },
      onNoveltyChange(value) {
        novelty = value;
        seed = freshSeed();
        persistSeed();
        render();
      },
      onCompile(nextSource) {
        try {
          source = nextSource;
          manifest = compileSubjective(source, { novelty });
          seed = assignedSeed(context);
          persistSeed();
          render();
        } catch (error) {
          alert(error instanceof Error ? error.message : String(error));
        }
      },
      onDataChange(nextData) {
        data = nextData;
        render();
      },
      onPreferenceChange(nextPreferences) {
        preferences = preferenceStore.save(nextPreferences);
        render();
      },
      onToggleLock() {
        locked = !locked;
        localStorage.setItem("subjective-c:locked", String(locked));
        persistSeed();
        render();
      },
      onAction(detail) {
        console.info("[Subjective C action]", detail);
      }
    }
  });
  syncCinemaControls();
}

function reinterpret() {
  transition(() => {
    seed = freshSeed();
    persistSeed();
  });
}

window.addEventListener("subjective:action", (event) => {
  // Connect generated semantics to application behavior here.
  console.debug("subjective:action", event.detail);
});

let contextResizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(contextResizeTimer);
  contextResizeTimer = setTimeout(() => {
    const next = detectRuntimeContext({
      ...context,
      device: configuredContext.device,
      input: configuredContext.input,
      motion: configuredContext.motion,
      contrast: configuredContext.contrast
    });
    if (next.device !== context.device || next.input !== context.input || next.motion !== context.motion || next.contrast !== context.contrast) {
      context = next;
      seed = assignedSeed(context);
      persistSeed();
      render();
    }
  }, 160);
});

render();
setCinemaPhase(cinemaMode ? "intro" : "live");
if (cinemaMode && cinemaAutoplayRequested) {
  setTimeout(() => toggleCinemaAutoplay(true), 1800);
}

${dev ? `let lastBuildVersion = null;
setInterval(async () => {
  try {
    const response = await fetch("/__subjective/version", { cache: "no-store" });
    const current = await response.text();
    if (lastBuildVersion && current !== lastBuildVersion) location.reload();
    lastBuildVersion = current;
  } catch {}
}, 800);` : ""}
`;
}

async function copyRuntime(destination) {
  const coreIndex = resolvePackageFile("@subjective-c/core");
  const coreSource = dirname(coreIndex);
  const runtimeBrowser = resolvePackageFile("@subjective-c/runtime/browser");
  const runtimeStyles = resolvePackageFile("@subjective-c/runtime/styles.css");

  await copyDirectory(coreSource, resolve(destination, "_subjective/core"), (source) => {
    const extension = extname(source);
    return !extension || extension === ".js";
  });
  await mkdir(resolve(destination, "_subjective/runtime"), { recursive: true });
  await writeFile(resolve(destination, "_subjective/runtime/browser.js"), await readFile(runtimeBrowser));
  await writeFile(resolve(destination, "_subjective/runtime/styles.css"), await readFile(runtimeStyles));
}

export async function buildProject(projectDirectory, options = {}) {
  const project = resolve(projectDirectory);
  const { config, path: configPath } = await loadConfig(project, options.config || "subjective.config.js");
  const specName = options.spec || config.spec || "app.subjective";
  const specPath = resolve(project, specName);
  if (!(await exists(specPath))) throw new Error(`No Subjective C source found at ${specPath}.`);

  const source = await readFile(specPath, "utf8");
  const providerResult = config.provider
    ? await compileWithProvider(source, {
      ...(config.compiler || {}),
      novelty: config.novelty,
      provider: config.provider,
      fallback: config.providerFallback !== false
    })
    : {
      manifest: compileSubjective(source, { ...(config.compiler || {}), novelty: config.novelty }),
      provider: "local",
      fallback: false
    };
  const manifest = providerResult.manifest;
  const data = serializable(config.data, null) || defaultData(manifest);
  const registry = serializable(config.componentPackage?.registry || config.registry, null);
  const packageThemes = config.componentPackage?.themes || {};
  const selectedTheme = config.theme || Object.keys(packageThemes)[0];
  const themeTokens = config.themeTokens || (selectedTheme ? packageThemes[selectedTheme] : {});
  const outDirectory = resolveSafeOutputDirectory(project, options.outDir || config.outDir || "dist", {
    allowExternal: options.allowExternalOutDir === true || config.allowExternalOutDir === true
  });
  const stagingDirectory = resolve(dirname(outDirectory), `.subjective-stage-${basename(outDirectory)}-${process.pid}-${Date.now()}`);
  const backupDirectory = `${stagingDirectory}-backup`;
  const representativeVariant = createVariant(manifest, {
    seed: manifest.source.hash,
    context: { ...config.context, device: config.context?.device === "auto" ? "desktop" : config.context?.device }
  });
  const representativePlan = createSubjectivePlan(manifest, representativeVariant, registry ? { registry } : undefined);

  try {
    await rm(stagingDirectory, { recursive: true, force: true });
    await mkdir(stagingDirectory, { recursive: true });
    await copyRuntime(stagingDirectory);
    await writeFile(resolve(stagingDirectory, "index.html"), htmlDocument(manifest), "utf8");
    await writeFile(resolve(stagingDirectory, "app.js"), browserEntry({ source, manifest, data, config, registry, themeTokens, dev: options.dev === true }), "utf8");
    await writeFile(resolve(stagingDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    await writeFile(resolve(stagingDirectory, "plan.json"), `${JSON.stringify(representativePlan, null, 2)}\n`, "utf8");
    await writeFile(resolve(stagingDirectory, "app.subjective"), source, "utf8");
    await writeFile(resolve(stagingDirectory, ".subjective-build.json"), `${JSON.stringify({
    framework: "subjective-c",
    version: SUBJECTIVE_C_VERSION,
    source: specName,
    sourceHash: manifest.source.hash,
    provider: providerResult.provider,
    providerFallback: providerResult.fallback,
    config: configPath ? configPath.split(/[\\/]/).at(-1) : null
    }, null, 2)}\n`, "utf8");

    await rm(backupDirectory, { recursive: true, force: true });
    if (await exists(outDirectory)) await rename(outDirectory, backupDirectory);
    try {
      await rename(stagingDirectory, outDirectory);
    } catch (error) {
      if (await exists(backupDirectory)) await rename(backupDirectory, outDirectory);
      throw error;
    }
    await rm(backupDirectory, { recursive: true, force: true });
  } catch (error) {
    await rm(stagingDirectory, { recursive: true, force: true });
    throw error;
  }

  if (!options.quiet) {
    logStep(color.green("✓"), color.bold(`Built ${manifest.name}`), outDirectory);
    logStep(color.cyan("◆"), "Compiler", providerResult.fallback ? `${providerResult.provider} fallback` : providerResult.provider);
    logStep(color.cyan("◆"), "Intent", `${manifest.intent.must.length} must · ${manifest.capabilities.length} capabilities · ${Math.round(manifest.policies.novelty * 100)}% novelty`);
  }

  return { project, outDirectory, specPath, configPath, source, manifest, data, providerResult };
}
