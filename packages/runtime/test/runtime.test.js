import test from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, renderSubjectiveMarkup } from "../src/browser.js";

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

test("a plan must match the current manifest and variant", () => {
  assert.throws(() => renderSubjectiveMarkup({
    manifest,
    variant,
    plan: { manifestHash: "wrong", variantId: variant.id, sectionOrder: [] }
  }), /does not match/);
});
