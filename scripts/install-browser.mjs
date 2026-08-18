import { mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const browsersPath = fileURLToPath(new URL("../.cache/ms-playwright", import.meta.url));
await mkdir(browsersPath, { recursive: true });
const result = spawnSync("npx", ["playwright", "install", "chromium"], {
  stdio: "inherit",
  env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: browsersPath }
});
if (result.status !== 0) process.exit(result.status || 1);

