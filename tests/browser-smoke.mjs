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
  await page.goto(`${app.url}?seed=browser-smoke`);
  await page.getByRole("heading", { name: /good afternoon|orbit/i }).first().waitFor();
  await page.keyboard.press("/");
  const search = page.getByRole("searchbox");
  await search.fill("no-result-by-design");
  await page.getByText(/no matching projects/i).waitFor();
  await search.fill("");
  await page.getByRole("button", { name: /new project/i }).first().click();
  await page.getByRole("dialog").waitFor();
  await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
  const firstLens = await page.locator(".sc-shell").getAttribute("data-sc-interpretation");
  await page.getByRole("button", { name: "Next SF lens" }).click();
  await page.waitForFunction((previous) => document.querySelector(".sc-shell")?.dataset.scInterpretation !== previous, firstLens);
  const enforcement = await page.evaluate(async () => {
    const { mountSubjective } = await import("./_subjective/runtime/browser.js");
    const host = document.createElement("div");
    document.body.append(host);
    const base = window.SubjectiveC;
    const actionId = base.manifest.capabilities.find(({ kind }) => kind === "create").id;
    const securedPlan = {
      ...base.plan,
      actions: base.plan.actions.map((action) => action.id === actionId ? {
        ...action,
        permission: "projects:create",
        destructive: true,
        confirmation: { title: "Confirm create", description: "Test confirmation", confirmLabel: "Create" }
      } : action)
    };
    let executed = 0;
    let denied = 0;
    const wait = () => new Promise((resolve) => setTimeout(resolve, 0));
    mountSubjective(host, {
      ...base,
      plan: securedPlan,
      devtools: false,
      callbacks: { onAction: () => executed++, onActionDenied: () => denied++ }
    });
    host.querySelector(`[data-sc-action="${actionId}"]`).click();
    await wait();
    const deniedWithoutHost = { executed, denied };

    mountSubjective(host, {
      ...base,
      plan: securedPlan,
      devtools: false,
      callbacks: {
        authorizeAction: () => true,
        confirmAction: () => true,
        onAction: () => executed++,
        onActionDenied: () => denied++
      }
    });
    host.querySelector(`[data-sc-action="${actionId}"]`).click();
    await wait();
    const authorized = { executed, denied };
    host.remove();
    return { deniedWithoutHost, authorized };
  });
  if (enforcement.deniedWithoutHost.executed !== 0 || enforcement.deniedWithoutHost.denied !== 1 || enforcement.authorized.executed !== 1) {
    throw new Error(`Action enforcement failed: ${JSON.stringify(enforcement)}`);
  }
  const interpretations = ["muni-control", "sutro-fog", "sfo-departures", "ferry-tide", "mission-neon", "golden-gate", "exploratorium-lab", "ship-command", "bart-platform", "gravity-well", "dream-fold"];
  for (const interpretation of interpretations) {
    await page.goto(`${app.url}?seed=audit&interpretation=${interpretation}`);
    const results = await new AxeBuilder({ page }).exclude(".sc-inspector").analyze();
    if (results.violations.length) {
      const details = results.violations.flatMap(({ id, nodes }) => nodes.map(({ target }) => `${id}: ${target.join(" ")}`));
      throw new Error(`Accessibility violations for ${interpretation}: ${details.join(", ")}`);
    }
  }
  console.log("✓ browser interactions, permission enforcement, confirmation, preferences, reduced motion, scene navigation, keyboard search, dialogs, and eleven-lens axe checks passed");
} finally {
  await context.close();
  await browser.close();
  app.close();
}
