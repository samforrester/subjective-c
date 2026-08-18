import { clamp, createRandom, hashString, pick, seedToNumber, shuffle, weightedPick } from "./hash.js";
import { VARIANT_SCHEMA } from "./constants.js";

const LAYOUTS = [
  "sidebar-workbench",
  "topbar-gallery",
  "editorial-split",
  "command-center",
  "focus-stack",
  "spatial-board"
];

const COLLECTION_FORMS = ["grid", "rows", "table", "board"];
const METRIC_FORMS = ["cards", "strip", "sentence", "rail"];
const ACTIVITY_FORMS = ["feed", "ticker", "timeline", "compact"];
const PALETTES = ["electric-ink", "warm-paper", "night-signal", "glass-mint", "soft-violet", "high-contrast"];

export function normalizeContext(context = {}) {
  return {
    experience: context.experience || "returning",
    device: context.device || "desktop",
    attention: context.attention || "focused",
    input: context.input || "pointer",
    motion: context.motion || "full",
    contrast: context.contrast || "standard",
    locale: context.locale || "en"
  };
}

function layoutWeights(context) {
  if (context.device === "mobile") {
    return [
      { value: "focus-stack", weight: 8 },
      { value: "topbar-gallery", weight: 3 },
      { value: "editorial-split", weight: 1 }
    ];
  }
  if (context.experience === "novice") {
    return [
      { value: "topbar-gallery", weight: 5 },
      { value: "editorial-split", weight: 4 },
      { value: "focus-stack", weight: 3 },
      { value: "sidebar-workbench", weight: 1 }
    ];
  }
  if (context.experience === "expert") {
    return [
      { value: "command-center", weight: 6 },
      { value: "sidebar-workbench", weight: 5 },
      { value: "spatial-board", weight: 3 },
      { value: "editorial-split", weight: 1 }
    ];
  }
  return LAYOUTS.map((value, index) => ({ value, weight: 6 - Math.abs(index - 2) * 0.35 }));
}

function chooseDensity(context, manifest, random) {
  if (context.device === "mobile") return "comfortable";
  if (context.experience === "novice") return random() > 0.75 ? "balanced" : "comfortable";
  if (context.experience === "expert") return random() > 0.25 ? "compact" : "balanced";
  if (manifest.intent.tone.includes("dense")) return "compact";
  if (manifest.intent.tone.includes("airy") || manifest.intent.tone.includes("calm")) return "comfortable";
  return pick(random, ["comfortable", "balanced", "balanced", "compact"]);
}

function chooseCollectionForm(layout, context, random) {
  if (context.device === "mobile") return pick(random, ["rows", "grid"]);
  if (layout === "spatial-board") return "board";
  if (layout === "command-center") return pick(random, ["table", "rows"]);
  if (layout === "sidebar-workbench") return pick(random, ["table", "grid", "rows"]);
  if (context.experience === "novice") return pick(random, ["grid", "rows"]);
  return pick(random, COLLECTION_FORMS);
}

function sectionOrder(random, novelty, context) {
  const stable = ["hero", "metrics", "collection", "insight", "activity"];
  if (novelty < 0.35 || context.experience === "novice") return stable;
  const movable = shuffle(random, ["metrics", "collection", "insight", "activity"]);
  const collectionIndex = movable.indexOf("collection");
  if (collectionIndex > 1) {
    movable.splice(collectionIndex, 1);
    movable.splice(1, 0, "collection");
  }
  return ["hero", ...movable];
}

function inferCopyMode(context, random) {
  if (context.experience === "novice") return "explanatory";
  if (context.experience === "expert") return "terse";
  return pick(random, ["direct", "direct", "editorial"]);
}

export function createVariant(manifest, options = {}) {
  const context = normalizeContext(options.context);
  const novelty = clamp(options.novelty ?? manifest?.policies?.novelty ?? 0.62);
  const seed = options.seed ?? `${manifest?.source?.hash || "subjective"}:${context.experience}:${context.device}:${context.locale}`;
  const numericSeed = seedToNumber(seed);
  const random = createRandom(numericSeed);

  let layout = weightedPick(random, layoutWeights(context));
  if (novelty < 0.2) layout = context.experience === "expert" ? "sidebar-workbench" : "topbar-gallery";

  const density = chooseDensity(context, manifest, random);
  const collection = chooseCollectionForm(layout, context, random);
  const metrics = layout === "command-center" ? "rail" : pick(random, METRIC_FORMS);
  const activity = pick(random, ACTIVITY_FORMS);
  const palette = context.contrast === "high" ? "high-contrast" : pick(random, PALETTES);
  const hue = Math.floor(random() * 330 + 10);
  const radius = density === "compact" ? Math.floor(random() * 8 + 8) : Math.floor(random() * 14 + 14);
  const sectionSequence = sectionOrder(random, novelty, context);
  const copyMode = inferCopyMode(context, random);
  const nav = layout === "sidebar-workbench" || layout === "command-center" ? "side" : "top";
  const hero = layout === "editorial-split" ? "statement" : layout === "command-center" ? "compact" : pick(random, ["welcome", "statement", "compact"]);
  const motion = context.motion === "reduced" ? "none" : pick(random, ["subtle", "subtle", "expressive"]);

  const explanation = [
    context.experience === "novice"
      ? "Added guidance and larger targets for a newer user."
      : context.experience === "expert"
        ? "Increased information density and shortened interface copy for an expert user."
        : "Balanced scanability with direct access to common actions.",
    context.device === "mobile"
      ? "Collapsed the composition into a touch-friendly stack."
      : `Selected a ${layout.replace(/-/g, " ")} composition for this interpretation.`,
    `Kept ${manifest.policies.anchors.join(", ")} stable while allowing the surrounding composition to vary.`
  ];

  const signature = JSON.stringify({ numericSeed, layout, density, collection, metrics, activity, palette, hue, radius, sectionSequence, copyMode });

  return {
    schema: VARIANT_SCHEMA,
    id: `v-${hashString(signature).toString(36)}`,
    seed: String(seed),
    context,
    novelty,
    layout,
    density,
    navigation: nav,
    composition: {
      hero,
      collection,
      metrics,
      activity,
      sections: sectionSequence,
      copyMode
    },
    theme: {
      palette,
      hue,
      radius,
      motion,
      surface: palette === "night-signal" || palette === "electric-ink" ? "dark" : "light"
    },
    anchors: manifest.policies.anchors,
    explanation
  };
}

export function createVariants(manifest, options = {}) {
  const count = Math.max(1, Math.min(24, Number(options.count ?? 3)));
  const seed = options.seed ?? manifest?.source?.hash ?? "subjective-c";
  return Array.from({ length: count }, (_, index) => createVariant(manifest, {
    ...options,
    seed: `${seed}:${index + 1}`
  }));
}

export function variantDistance(left, right) {
  if (!left || !right) return 1;
  const fields = [
    [left.layout, right.layout],
    [left.density, right.density],
    [left.composition?.collection, right.composition?.collection],
    [left.composition?.metrics, right.composition?.metrics],
    [left.composition?.activity, right.composition?.activity],
    [left.theme?.palette, right.theme?.palette]
  ];
  const changes = fields.filter(([a, b]) => a !== b).length;
  return changes / fields.length;
}
