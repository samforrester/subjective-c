import { spawnSync } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { devProject } from "subjective-c";

process.env.PLAYWRIGHT_BROWSERS_PATH ||= fileURLToPath(new URL("../.cache/ms-playwright", import.meta.url));

const { chromium } = await import("@playwright/test");
const project = fileURLToPath(new URL("../examples/orbit", import.meta.url));
const output = resolve(process.argv[2] || "artifacts");
const raw = resolve(output, ".recording");
await rm(raw, { recursive: true, force: true });
await mkdir(raw, { recursive: true });

const app = await devProject(project, { port: 0 });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  colorScheme: "dark",
  reducedMotion: "no-preference",
  recordVideo: { dir: raw, size: { width: 1920, height: 1080 } }
});
const page = await context.newPage();
const video = page.video();
const webm = resolve(output, "subjective-c-x-demo.webm");
const recordingStartedAt = Date.now();
let authoredStartAt = recordingStartedAt;
const pause = (milliseconds) => page.waitForTimeout(milliseconds);
const cursorBeats = [[720, 360], [1320, 510], [1040, 730], [480, 590], [1440, 330]];
let cursorBeat = 0;

async function moveCursor(x, y) {
  await page.mouse.move(x, y, { steps: 36 });
  await pause(180);
}

async function enterReality(id, hold = 1200) {
  await page.evaluate((interpretation) => window.SubjectiveC.setInterpretation(interpretation), id);
  await pause(620);
  const [x, y] = cursorBeats[cursorBeat++ % cursorBeats.length];
  await moveCursor(x, y);
  await pause(hold);
}

try {
  await page.goto(`${app.url}?cinema=1&recording=1&seed=x-launch&interpretation=gravity-well`, { waitUntil: "domcontentloaded" });
  await page.locator(".sc-shell").waitFor();
  authoredStartAt = Date.now();
  await pause(1450);
  await page.evaluate(() => window.SubjectiveC.setCinemaPhase("live"));
  await pause(650);
  await moveCursor(960, 455);
  await page.screenshot({ path: resolve(output, "subjective-c-x-thumbnail.png") });
  await pause(850);

  await enterReality("dream-fold", 1000);
  await page.mouse.wheel(0, 520);
  await pause(700);
  await enterReality("mission-neon", 900);
  await enterReality("ship-command", 850);
  await enterReality("muni-control", 700);

  await page.getByRole("button", { name: /new project/i }).first().click();
  await pause(700);
  await page.keyboard.press("Escape");
  await pause(300);
  await page.evaluate(() => window.SubjectiveC.setCinemaPhase("outro"));
  await pause(1900);
} finally {
  await page.close();
  await video.saveAs(webm);
  await context.close();
  await browser.close();
  app.close();
}

const ffmpeg = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
if (ffmpeg.status === 0) {
  const mp4 = resolve(output, "subjective-c-x-demo.mp4");
  const trimSeconds = Math.max(0, (authoredStartAt - recordingStartedAt) / 1000 - 0.1).toFixed(3);
  console.log(`◆ Trimming ${trimSeconds}s of renderer warm-up before the authored first frame`);
  const conversion = spawnSync("ffmpeg", [
    "-y", "-i", webm, "-ss", trimSeconds,
    "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
    "-shortest", "-t", "18", "-r", "30", "-c:v", "libx264", "-profile:v", "high", "-level", "4.1",
    "-pix_fmt", "yuv420p", "-b:v", "6M", "-maxrate", "10M", "-bufsize", "12M",
    "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", mp4
  ], { stdio: "inherit" });
  if (conversion.status !== 0) throw new Error("ffmpeg could not encode the X-ready MP4.");
  console.log(`✓ X-ready MP4 ${mp4}`);
} else {
  console.log(`◆ ffmpeg unavailable; preserved the source recording at ${webm}`);
}

await rm(raw, { recursive: true, force: true });
