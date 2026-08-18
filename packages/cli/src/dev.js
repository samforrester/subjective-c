import { createReadStream, watch } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { URL } from "node:url";
import { buildProject } from "./build.js";
import { banner, color, logStep } from "./terminal.js";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".subjective": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml"
};

function serveFile(response, path, metadata) {
  response.writeHead(200, {
    "content-type": MIME[extname(path)] || "application/octet-stream",
    "content-length": metadata.size,
    "cache-control": "no-store"
  });
  createReadStream(path).pipe(response);
}

export async function devProject(projectDirectory, options = {}) {
  let build = await buildProject(projectDirectory, { ...options, dev: true, quiet: true });
  let version = String(Date.now());
  let rebuilding = false;
  let queued = false;

  const rebuild = async () => {
    if (rebuilding) {
      queued = true;
      return;
    }
    rebuilding = true;
    try {
      build = await buildProject(projectDirectory, { ...options, dev: true, quiet: true });
      version = String(Date.now());
      logStep(color.green("↻"), "Recompiled intent", build.manifest.source.hash);
    } catch (error) {
      logStep(color.red("×"), "Recompile failed", error instanceof Error ? error.message : String(error));
    } finally {
      rebuilding = false;
      if (queued) {
        queued = false;
        await rebuild();
      }
    }
  };

  const server = createServer(async (request, response) => {
    const url = new URL(request.url || "/", "http://subjective.local");
    if (url.pathname === "/__subjective/version") {
      response.writeHead(200, { "content-type": "text/plain", "cache-control": "no-store" });
      response.end(version);
      return;
    }

    const relative = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    let path = resolve(build.outDirectory, `.${relative}`);
    const rootPrefix = `${resolve(build.outDirectory)}${sep}`;
    if (path !== resolve(build.outDirectory) && !path.startsWith(rootPrefix)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    try {
      let metadata = await stat(path);
      if (metadata.isDirectory()) {
        path = resolve(path, "index.html");
        metadata = await stat(path);
      }
      serveFile(response, path, metadata);
    } catch {
      try {
        const fallback = resolve(build.outDirectory, "index.html");
        serveFile(response, fallback, await stat(fallback));
      } catch {
        response.writeHead(404);
        response.end("Not found");
      }
    }
  });

  const host = options.host || "127.0.0.1";
  const port = options.port === undefined ? 4173 : Number(options.port);
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(port, host, resolveListen);
  });

  const watched = [build.specPath, build.configPath].filter(Boolean);
  const watchers = watched.map((path) => watch(path, { persistent: true }, () => {
    clearTimeout(rebuild.timer);
    rebuild.timer = setTimeout(rebuild, 80);
  }));

  console.log(`\n${banner()}\n`);
  const address = server.address();
  const activePort = typeof address === "object" && address ? address.port : port;
  logStep(color.green("●"), color.bold("Development server"), `http://${host}:${activePort}`);
  logStep(color.cyan("◆"), "Source", build.specPath);
  logStep(color.cyan("◆"), "Current variant policy", `${Math.round(build.manifest.policies.novelty * 100)}% novelty · ${build.manifest.policies.refresh}`);
  console.log(color.dim("\nPress Ctrl+C to stop. Edit app.subjective to recompile.\n"));

  const close = () => {
    watchers.forEach((watcher) => watcher.close());
    server.close();
  };
  process.once("SIGINT", close);
  process.once("SIGTERM", close);

  return { server, watchers, build, url: `http://${host}:${activePort}`, close };
}
