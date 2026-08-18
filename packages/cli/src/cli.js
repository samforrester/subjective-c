import { buildProject } from "./build.js";
import { devProject } from "./dev.js";
import { doctorProject } from "./doctor.js";
import { initProject } from "./init.js";
import { inspectSource } from "./inspect.js";
import { banner, color } from "./terminal.js";
import { asNumber, parseFlags, projectPath } from "./utils.js";

function help() {
  console.log(`\n${banner()}\n
Usage:
  subjective init [directory]      Create a new Subjective C app
  subjective dev [directory]       Compile, serve, and watch an app
  subjective build [directory]     Build a static app into dist/
  subjective inspect [source|dir]  Inspect the intent manifest and variants
  subjective doctor [directory]    Check the local setup

Options:
  --port <number>                   Development server port (default 4173)
  --host <address>                  Development host (default 127.0.0.1)
  --outDir <directory>              Build output directory
  --allow-external-out-dir          Explicitly allow an output path outside the project
  --spec <filename>                 Subjective source file
  --config <filename>               Config module
  --experience <mode>               novice, returning, or expert
  --novelty <0..1>                  Override novelty during inspection
  --count <number>                  Number of inspected variants
  --json                            Print machine-readable inspection output
  --force                           Initialize into a non-empty directory

Examples:
  ${color.dim("subjective init orbit")}
  ${color.dim("subjective dev ./orbit --port 3000")}
  ${color.dim("subjective inspect ./orbit/app.subjective --count 6")}
`);
}

export async function runCli(args) {
  const [command = "help", ...rest] = args;
  const { positional, flags } = parseFlags(rest);

  if (["help", "--help", "-h"].includes(command)) {
    help();
    return;
  }
  if (["version", "--version", "-v"].includes(command)) {
    console.log("0.2.0-alpha.2");
    return;
  }

  if (command === "init" || command === "new" || command === "create") {
    await initProject(projectPath(positional[0] || "my-subjective-app"), { force: flags.force === true });
    return;
  }

  if (command === "build") {
    await buildProject(projectPath(positional[0]), {
      outDir: flags.outDir,
      spec: flags.spec,
      config: flags.config,
      allowExternalOutDir: flags["allow-external-out-dir"] === true
    });
    return;
  }

  if (command === "dev") {
    await devProject(projectPath(positional[0]), {
      port: asNumber(flags.port, 4173),
      host: flags.host || "127.0.0.1",
      outDir: flags.outDir,
      spec: flags.spec,
      config: flags.config,
      allowExternalOutDir: flags["allow-external-out-dir"] === true
    });
    return;
  }

  if (command === "inspect") {
    await inspectSource(projectPath(positional[0] || "app.subjective"), {
      count: asNumber(flags.count, 4),
      novelty: flags.novelty === undefined ? undefined : asNumber(flags.novelty, undefined),
      experience: flags.experience,
      seed: flags.seed,
      spec: flags.spec,
      config: flags.config,
      json: flags.json === true
    });
    return;
  }

  if (command === "doctor") {
    await doctorProject(projectPath(positional[0]));
    return;
  }

  throw new Error(`Unknown command: ${command}. Run subjective help.`);
}
