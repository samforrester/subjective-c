import { fileURLToPath } from "node:url";
import { devProject } from "subjective-c";

process.env.PLAYWRIGHT_BROWSERS_PATH ||= fileURLToPath(new URL("../.cache/ms-playwright", import.meta.url));
const { chromium } = await import("@playwright/test");
const { default: AxeBuilder } = await import("@axe-core/playwright");

const app = await devProject(new URL("../examples/orbit", import.meta.url).pathname, { port: 0 });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ reducedMotion: "reduce" });
const page = await context.newPage();

try {
  await page.goto(app.url);
  await page.getByRole("heading", { name: /good afternoon|orbit/i }).first().waitFor();
  await page.keyboard.press("/");
  const search = page.getByRole("searchbox");
  await search.fill("no-result-by-design");
  await page.getByText(/no matching projects/i).waitFor();
  await search.fill("");
  await page.getByRole("button", { name: /new project/i }).first().click();
  await page.getByRole("dialog").waitFor();
  await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
  const results = await new AxeBuilder({ page }).exclude(".sc-inspector").analyze();
  if (results.violations.length) {
    throw new Error(`Accessibility violations: ${results.violations.map(({ id }) => id).join(", ")}`);
  }
  console.log("✓ browser interactions, reduced motion, keyboard search, dialogs, and axe checks passed");
} finally {
  await context.close();
  await browser.close();
  app.close();
}
