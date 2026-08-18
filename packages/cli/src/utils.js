import { access, cp, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export async function exists(path) {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function ensureEmptyDirectory(path, force = false) {
  await mkdir(path, { recursive: true });
  const entries = await readdir(path);
  if (entries.length && !force) {
    throw new Error(`Directory is not empty: ${path}. Use --force to continue.`);
  }
}

export async function copyDirectory(source, destination, filter = () => true) {
  await mkdir(destination, { recursive: true });
  await cp(source, destination, {
    recursive: true,
    force: true,
    filter
  });
}

export async function writeText(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf8");
}

export async function readText(path) {
  return readFile(path, "utf8");
}

export async function loadConfig(projectDirectory, configName = "subjective.config.js") {
  const path = resolve(projectDirectory, configName);
  if (!(await exists(path))) return { config: {}, path: null };
  const metadata = await stat(path);
  const moduleUrl = `${pathToFileURL(path).href}?t=${metadata.mtimeMs}`;
  const imported = await import(moduleUrl);
  return { config: imported.default || imported.config || imported, path };
}

export function resolvePackageFile(specifier) {
  return fileURLToPath(import.meta.resolve(specifier));
}

export function serializable(value, fallback = {}) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return fallback;
  }
}

export function parseFlags(args) {
  const positional = [];
  const flags = {};
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (!value.startsWith("--")) {
      positional.push(value);
      continue;
    }
    const [name, inline] = value.slice(2).split("=", 2);
    if (inline !== undefined) {
      flags[name] = inline;
      continue;
    }
    const next = args[index + 1];
    if (next && !next.startsWith("--")) {
      flags[name] = next;
      index += 1;
    } else {
      flags[name] = true;
    }
  }
  return { positional, flags };
}

export function asNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function projectPath(value) {
  return resolve(process.cwd(), value || ".");
}
