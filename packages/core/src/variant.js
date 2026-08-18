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
export const SUBJECTIVE_INTERPRETATIONS = Object.freeze([
  Object.freeze({ id: "muni-control", label: "Muni Control", location: "Market Street", symbol: "N", surface: "dark", layouts: ["command-center", "sidebar-workbench"], collections: ["rows", "table"], metrics: ["rail", "strip"], activity: ["ticker", "compact"] }),
  Object.freeze({ id: "sutro-fog", label: "Sutro Fog Observatory", location: "Twin Peaks", symbol: "◉", surface: "light", layouts: ["editorial-split", "focus-stack"], collections: ["grid", "rows"], metrics: ["sentence", "cards"], activity: ["timeline", "feed"] }),
  Object.freeze({ id: "sfo-departures", label: "SFO Departures", location: "Terminal 3", symbol: "SFO", surface: "dark", layouts: ["command-center", "topbar-gallery"], collections: ["table", "rows"], metrics: ["strip", "rail"], activity: ["ticker", "compact"] }),
  Object.freeze({ id: "ferry-tide", label: "Ferry Tide Table", location: "Embarcadero", symbol: "≈", surface: "light", layouts: ["focus-stack", "editorial-split"], collections: ["rows", "grid"], metrics: ["sentence", "cards"], activity: ["timeline", "feed"] }),
  Object.freeze({ id: "mission-neon", label: "Mission After Dark", location: "24th Street", symbol: "24", surface: "dark", layouts: ["spatial-board", "topbar-gallery"], collections: ["board", "grid"], metrics: ["cards", "strip"], activity: ["feed", "ticker"] }),
  Object.freeze({ id: "golden-gate", label: "Golden Gate Load Monitor", location: "Presidio", symbol: "GG", surface: "light", layouts: ["editorial-split", "sidebar-workbench"], collections: ["table", "rows"], metrics: ["strip", "rail"], activity: ["timeline", "compact"] }),
  Object.freeze({ id: "exploratorium-lab", label: "Exploratorium Field Lab", location: "Pier 15", symbol: "∿", surface: "dark", layouts: ["spatial-board", "command-center"], collections: ["grid", "board"], metrics: ["cards", "rail"], activity: ["feed", "timeline"] }),
  Object.freeze({ id: "ship-command", label: "Ship Command", location: "Fort Mason", symbol: "▲", surface: "dark", layouts: ["command-center", "sidebar-workbench"], collections: ["rows", "table"], metrics: ["rail", "strip"], activity: ["compact", "ticker"] }),
  Object.freeze({ id: "bart-platform", label: "BART Platform", location: "16th Street", symbol: "B", surface: "light", layouts: ["topbar-gallery", "focus-stack"], collections: ["rows", "table"], metrics: ["strip", "sentence"], activity: ["ticker", "compact"] }),
  Object.freeze({ id: "gravity-well", label: "Farallon Gravity Array", location: "Lands End · T−04:17", symbol: "∞", surface: "dark", layouts: ["spatial-board", "focus-stack"], collections: ["board", "grid"], metrics: ["sentence", "rail"], activity: ["timeline", "ticker"] }),
  Object.freeze({ id: "dream-fold", label: "Market Street Dream Fold", location: "Layer −03", symbol: "◇", surface: "dark", layouts: ["editorial-split", "spatial-board"], collections: ["grid", "board"], metrics: ["cards", "sentence"], activity: ["timeline", "feed"] })
]);

function interpretationWeights(context) {
  return SUBJECTIVE_INTERPRETATIONS.map((value) => {
    let weight = 3;
    if (context.experience === "expert" && ["muni-control", "sfo-departures", "ship-command", "exploratorium-lab", "gravity-well", "dream-fold"].includes(value.id)) weight += 5;
    if (context.experience === "novice" && ["bart-platform", "ferry-tide", "sutro-fog"].includes(value.id)) weight += 5;
    if (context.device === "mobile" && ["ferry-tide", "bart-platform", "mission-neon"].includes(value.id)) weight += 4;
    return { value, weight };
  });
}

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
  const requestedInterpretation = options.interpretation == null
    ? null
    : SUBJECTIVE_INTERPRETATIONS.find(({ id }) => id === options.interpretation);
  if (options.interpretation != null && !requestedInterpretation) {
    throw new Error(`Unknown Subjective C interpretation: ${options.interpretation}.`);
  }
  const interpretation = requestedInterpretation || weightedPick(random, interpretationWeights(context));

  let layout = novelty >= 0.45 ? pick(random, interpretation.layouts) : weightedPick(random, layoutWeights(context));
  if (context.device === "mobile") layout = "focus-stack";
  if (novelty < 0.2) layout = context.experience === "expert" ? "sidebar-workbench" : "topbar-gallery";

  const density = chooseDensity(context, manifest, random);
  const collection = novelty >= 0.45 ? pick(random, interpretation.collections) : chooseCollectionForm(layout, context, random);
  const metrics = novelty >= 0.45 ? pick(random, interpretation.metrics) : layout === "command-center" ? "rail" : pick(random, METRIC_FORMS);
  const activity = novelty >= 0.45 ? pick(random, interpretation.activity) : pick(random, ACTIVITY_FORMS);
  const palette = context.contrast === "high" ? "high-contrast" : interpretation.id;
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
    `Translated the intent through ${interpretation.label}, inspired by ${interpretation.location} in San Francisco.`,
    `Kept ${manifest.policies.anchors.join(", ")} stable while allowing the surrounding composition to vary.`
  ];

  const signature = JSON.stringify({ numericSeed, interpretation: interpretation.id, layout, density, collection, metrics, activity, palette, hue, radius, sectionSequence, copyMode });

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
      surface: context.contrast === "high" ? "light" : interpretation.surface,
      interpretation: interpretation.id,
      label: interpretation.label,
      location: interpretation.location,
      symbol: interpretation.symbol
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
