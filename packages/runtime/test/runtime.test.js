import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createPreferenceStore, escapeHtml, hydrateSubjective, normalizePreferences, renderSubjectiveMarkup } from "../src/browser.js";

const manifest = {
  name: "Orbit",
  domain: { singular: "Project", plural: "Projects", icon: "◫" },
  intent: { goal: "Help a team move work forward.", audience: ["Teams"], tone: ["calm"], must: [], prefer: [], avoid: [], adapt: [] },
  capabilities: [{ id: "create-project", label: "New Project", kind: "create", priority: 100, required: true }],
  navigation: [{ id: "overview", label: "Overview" }, { id: "projects", label: "Projects" }],
  policies: { anchors: ["brand", "primary-action"] },
  source: { text: "# Orbit", hash: "abc" }
};

const variant = {
  id: "v-test",
  layout: "topbar-gallery",
  density: "balanced",
  navigation: "top",
  novelty: 0.5,
  context: { experience: "returning" },
  composition: { hero: "welcome", collection: "grid", metrics: "cards", activity: "feed", sections: ["hero", "collection"], copyMode: "direct" },
  theme: { palette: "warm-paper", hue: 220, radius: 16, motion: "subtle" },
  anchors: ["brand", "primary-action"],
  explanation: ["Test explanation"]
};

test("escapeHtml protects generated markup", () => {
  assert.equal(escapeHtml('<script>"x"</script>'), "&lt;script&gt;&quot;x&quot;&lt;/script&gt;");
});

test("renderSubjectiveMarkup includes stable anchors and data", () => {
  const html = renderSubjectiveMarkup({
    manifest,
    variant,
    data: { items: [{ name: "Launch", status: "Planned", owner: "Dylan", progress: 10 }] },
    devtools: true
  });
  assert.match(html, /Orbit/);
  assert.match(html, /New Project/);
  assert.match(html, /Launch/);
  assert.match(html, /v-test/);
  assert.match(html, /data-sc-interpretation="warm-paper"/);
  assert.match(html, /37\.7749/);
});

test("renderSubjectiveMarkup exposes SF interpretation chrome and adaptive language", () => {
  const html = renderSubjectiveMarkup({
    manifest,
    variant: {
      ...variant,
      composition: { ...variant.composition, sections: ["hero", "collection", "insight"] },
      theme: {
        ...variant.theme,
        palette: "muni-control",
        interpretation: "muni-control",
        label: "Muni Control",
        location: "Market Street",
        symbol: "N"
      }
    },
    data: { items: [{ name: "Launch", status: "Planned", owner: "Dylan", progress: 10 }] },
    devtools: true
  });
  assert.match(html, /data-sc-interpretation="muni-control"/);
  assert.match(html, /Muni Control/);
  assert.match(html, /Market Street/);
  assert.match(html, /Reality confidence/);
  assert.match(html, /San Francisco interpretation navigator/);
  assert.match(html, /Active lines/);
  assert.match(html, /Service advisory/);
});

test("cinema mode renders a deterministic launch-film surface", () => {
  const html = renderSubjectiveMarkup({ manifest, variant, data: {}, cinemaMode: true, devtools: true });
  assert.match(html, /sc-cinema-mode/);
  assert.match(html, /What if intent/);
  assert.match(html, /Intent is source code/);
  assert.match(html, /sc-cinema-watermark/);
  assert.match(html, /Enter reality/);
  assert.match(html, /Autopilot/);
  assert.match(html, /Open the lab/);
});

test("provider-controlled glyphs are escaped before HTML interpolation", () => {
  const html = renderSubjectiveMarkup({
    manifest: { ...manifest, domain: { ...manifest.domain, icon: '<img src=x onerror="alert(1)">' } },
    variant,
    data: {},
    devtools: false
  });
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;img src=x/);
});

test("top-level class and style attributes cannot be escaped by library input", () => {
  const html = renderSubjectiveMarkup({
    manifest,
    variant: { ...variant, layout: 'grid\" onmouseover=\"alert(1)' },
    themeTokens: { accent: '\" onfocus=\"alert(2)' },
    data: {},
    devtools: false
  });
  const dom = new JSDOM(`<!doctype html><div id="root">${html}</div>`);
  const shell = dom.window.document.querySelector(".sc-shell");
  assert.ok(shell);
  assert.equal(shell.hasAttribute("onmouseover"), false);
  assert.equal(shell.hasAttribute("onfocus"), false);
  assert.doesNotMatch(shell.getAttribute("class"), /onmouseover/);
  dom.window.close();
});

test("status slugging remains bounded for pathological library input", () => {
  const baseline = renderSubjectiveMarkup({
    manifest,
    variant,
    data: { items: [{ name: "Pathological", status: "Planned" }] },
    devtools: false
  });
  const html = renderSubjectiveMarkup({
    manifest,
    variant,
    data: { items: [{ name: "Pathological", status: "-".repeat(1_000_000) }] },
    devtools: false
  });
  assert.match(html, /class="sc-status sc-status-"/);
  assert.equal(html.length - baseline.length < 2_500, true);
});

test("a plan must match the current manifest and variant", () => {
  assert.throws(() => renderSubjectiveMarkup({
    manifest,
    variant,
    plan: { manifestHash: "wrong", variantId: variant.id, sectionOrder: [] }
  }), /does not match/);
});

test("runtime preferences are normalized, persisted, and applied independently of a variant", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  };
  const store = createPreferenceStore({ storage, key: "test" });
  assert.deepEqual(store.save({ density: "compact", contrast: "high", palette: "bad value" }), { density: "compact", contrast: "high" });
  assert.deepEqual(store.load(), { density: "compact", contrast: "high" });
  assert.deepEqual(normalizePreferences({ motion: "instant", palette: "warm-paper" }), { palette: "warm-paper" });

  const html = renderSubjectiveMarkup({ manifest, variant, preferences: store.load(), themeTokens: { accent: "#123456", unsafe: "red;display:none" } });
  assert.match(html, /sc-density-compact/);
  assert.match(html, /sc-palette-high-contrast/);
  assert.match(html, /--sc-accent:#123456/);
  assert.doesNotMatch(html, /display:none/);
});

test("the default preference store migrates the pre-versioned alpha key", () => {
  const values = new Map([["subjective-c:preferences", JSON.stringify({ density: "compact", unsafe: "ignored" })]]);
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  };
  const preferences = createPreferenceStore({ storage }).load();
  assert.deepEqual(preferences, { density: "compact" });
  assert.equal(values.has("subjective-c:preferences"), false);
  assert.deepEqual(JSON.parse(values.get("subjective-c:preferences@1")), { density: "compact" });
});

test("hydrateSubjective binds existing server markup without replacing its DOM", async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: "https://subjective-c.test" });
  const previous = Object.fromEntries(["window", "document", "Element", "CustomEvent", "FormData"].map((key) => [key, globalThis[key]]));
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    Element: dom.window.Element,
    CustomEvent: dom.window.CustomEvent,
    FormData: dom.window.FormData
  });
  const target = document.querySelector("#root");
  target.innerHTML = renderSubjectiveMarkup({ manifest, variant, data: {} });
  const serverShell = target.firstElementChild;
  let actions = 0;
  let controller = hydrateSubjective(target, { manifest, variant, data: {}, callbacks: { onAction: () => actions++ } });
  let fallbackController;
  try {
    assert.equal(target.firstElementChild, serverShell);
    target.querySelector('[data-sc-action-kind="create"]').click();
    await Promise.resolve();
    assert.equal(actions, 1);
    assert.throws(() => hydrateSubjective(target, { manifest, variant: { ...variant, id: "v-mismatch" } }, { fallback: false }), /does not match/);
    controller.destroy();
    controller = null;
    assert.equal(target.firstElementChild, serverShell);
    fallbackController = hydrateSubjective(target, { manifest, variant: { ...variant, id: "v-mismatch" }, data: {} });
    assert.notEqual(target.firstElementChild, serverShell);
    assert.equal(target.firstElementChild.getAttribute("data-sc-variant"), "v-mismatch");
  } finally {
    controller?.destroy();
    fallbackController?.destroy();
    dom.window.close();
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  }
});
