import { clamp, hashString, slugify, titleCase } from "./hash.js";
import { CAPABILITY_KINDS, MANIFEST_SCHEMA, SUBJECTIVE_C_VERSION } from "./constants.js";

const SECTION_ALIASES = new Map([
  ["purpose", "purpose"],
  ["goal", "purpose"],
  ["intent", "purpose"],
  ["brief", "purpose"],
  ["must", "must"],
  ["required", "must"],
  ["requirements", "must"],
  ["invariants", "must"],
  ["always", "must"],
  ["prefer", "prefer"],
  ["preferences", "prefer"],
  ["should", "prefer"],
  ["nice to have", "prefer"],
  ["avoid", "avoid"],
  ["never", "avoid"],
  ["anti-patterns", "avoid"],
  ["do not", "avoid"],
  ["adapt", "adapt"],
  ["adaptation", "adapt"],
  ["context", "adapt"],
  ["personalization", "adapt"],
  ["audience", "audience"],
  ["users", "audience"],
  ["people", "audience"],
  ["tone", "tone"],
  ["feel", "tone"],
  ["style", "tone"],
  ["personality", "tone"],
  ["actions", "actions"],
  ["capabilities", "actions"],
  ["features", "actions"],
  ["jobs", "actions"],
  ["data", "data"],
  ["content", "data"],
  ["entities", "data"],
  ["navigation", "navigation"],
  ["pages", "navigation"],
  ["screens", "navigation"]
]);

const TONE_WORDS = [
  "calm",
  "bold",
  "playful",
  "serious",
  "technical",
  "editorial",
  "premium",
  "friendly",
  "minimal",
  "dense",
  "airy",
  "futuristic",
  "warm",
  "quiet",
  "energetic",
  "precise",
  "human",
  "trustworthy",
  "experimental",
  "professional"
];

const DOMAIN_PATTERNS = [
  { pattern: /\bplaces?|destinations?|venues?|restaurants?|bars?|trails?|city guide\b/i, singular: "Place", plural: "Places", icon: "⌖" },
  { pattern: /\bprojects?\b/i, singular: "Project", plural: "Projects", icon: "◫" },
  { pattern: /\btasks?\b/i, singular: "Task", plural: "Tasks", icon: "✓" },
  { pattern: /\bdeals?|pipeline|opportunit(?:y|ies)\b/i, singular: "Deal", plural: "Deals", icon: "↗" },
  { pattern: /\bcustomers?|accounts?|clients?\b/i, singular: "Customer", plural: "Customers", icon: "◎" },
  { pattern: /\bproducts?|inventory|catalog\b/i, singular: "Product", plural: "Products", icon: "◇" },
  { pattern: /\bdocuments?|files?|knowledge\b/i, singular: "Document", plural: "Documents", icon: "▤" },
  { pattern: /\bexperiments?|tests?|hypotheses\b/i, singular: "Experiment", plural: "Experiments", icon: "⌁" },
  { pattern: /\bcampaigns?|content calendar\b/i, singular: "Campaign", plural: "Campaigns", icon: "◉" },
  { pattern: /\bevents?|meetings?|calendar\b/i, singular: "Event", plural: "Events", icon: "◷" },
  { pattern: /\bworkouts?|training|fitness\b/i, singular: "Workout", plural: "Workouts", icon: "△" },
  { pattern: /\brecipes?|meals?|dishes?\b/i, singular: "Recipe", plural: "Recipes", icon: "◌" }
];

const CAPABILITY_PATTERNS = [
  { pattern: /\b(creat(?:e|es|ed|ing)|add(?:s|ed|ing)?|start(?:s|ed|ing)?|new|launch(?:es|ed|ing)?)\b/i, id: "create", label: "Create", kind: "create", priority: 100, shortcut: "N" },
  { pattern: /\b(search|find|look up|discover)\b/i, id: "search", label: "Search", kind: "search", priority: 90, shortcut: "/" },
  { pattern: /\b(filter|segment|narrow|refine)\b/i, id: "filter", label: "Filter", kind: "filter", priority: 75 },
  { pattern: /\b(sort|rank|order)\b/i, id: "sort", label: "Sort", kind: "sort", priority: 65 },
  { pattern: /\b(invite|share|collaborate|teammate|member)\b/i, id: "collaborate", label: "Invite", kind: "collaborate", priority: 55 },
  { pattern: /\b(analytics|metrics|performance|insights?|reporting|revenue)\b/i, id: "analytics", label: "Analytics", kind: "analytics", priority: 60 },
  { pattern: /\b(activity|updates?|notifications?|history|recent)\b/i, id: "activity", label: "Activity", kind: "activity", priority: 50 },
  { pattern: /\b(compare|comparison|versus|vs\.?|benchmark)\b/i, id: "compare", label: "Compare", kind: "compare", priority: 58 },
  { pattern: /\b(import|upload|ingest)\b/i, id: "import", label: "Import", kind: "import", priority: 52 },
  { pattern: /\b(export|download|save as)\b/i, id: "export", label: "Export", kind: "export", priority: 48 },
  { pattern: /\b(comment|message|chat|discuss)\b/i, id: "communicate", label: "Discuss", kind: "communicate", priority: 45 },
  { pattern: /\b(schedule|book|calendar|plan)\b/i, id: "schedule", label: "Schedule", kind: "schedule", priority: 46 },
  { pattern: /\b(settings?|preferences?|configure|profile)\b/i, id: "settings", label: "Settings", kind: "settings", priority: 20 },
  { pattern: /\b(view|browse|see|review|track|monitor|manage)\b/i, id: "browse", label: "Browse", kind: "browse", priority: 40 }
];

const FREEFORM_CLASSIFIERS = [
  { pattern: /^(must|always|required|make sure|ensure)\b/i, section: "must" },
  { pattern: /^(prefer|should|ideally|try to)\b/i, section: "prefer" },
  { pattern: /^(avoid|never|do not|don't|without)\b/i, section: "avoid" },
  { pattern: /^(adapt|for new users|for beginners|for power users|for experts|on mobile|on desktop)\b/i, section: "adapt" }
];

function cleanEntry(value) {
  return String(value ?? "")
    .replace(/^[-*+]\s+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.;]+$/, "");
}

function uniqueEntries(values) {
  const seen = new Set();
  return values
    .map(cleanEntry)
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function canonicalSection(value) {
  const key = String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return SECTION_ALIASES.get(key) ?? key;
}

function splitSentences(value) {
  return String(value ?? "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map(cleanEntry)
    .filter((sentence) => sentence.length > 2);
}

export function parseSubjectiveSource(source) {
  const text = String(source ?? "").replace(/\r\n/g, "\n").trim();
  const sections = {
    body: [],
    purpose: [],
    must: [],
    prefer: [],
    avoid: [],
    adapt: [],
    audience: [],
    tone: [],
    actions: [],
    data: [],
    navigation: []
  };

  let title = "";
  let active = "body";

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const h1 = line.match(/^#\s+(.+)$/);
    if (h1) {
      title ||= cleanEntry(h1[1]);
      continue;
    }

    const heading = line.match(/^#{2,6}\s+(.+)$/);
    if (heading) {
      active = canonicalSection(heading[1]);
      if (!sections[active]) sections[active] = [];
      continue;
    }

    const labelled = line.match(/^([A-Za-z][A-Za-z0-9 /_-]{1,32}):\s*(.*)$/);
    if (labelled) {
      const possible = canonicalSection(labelled[1]);
      if (sections[possible]) {
        active = possible;
        if (labelled[2]) sections[active].push(cleanEntry(labelled[2]));
        continue;
      }
      if (labelled[1].toLowerCase() === "name") {
        title ||= cleanEntry(labelled[2]);
        continue;
      }
    }

    sections[active] ??= [];
    sections[active].push(cleanEntry(line));
  }

  if (!title) {
    const named = text.match(/\b(?:called|named)\s+["“']?([A-Z][A-Za-z0-9 '&-]{1,48})["”']?/);
    if (named) title = cleanEntry(named[1]);
  }

  if (!title) {
    const first = sections.body[0] ?? sections.purpose[0] ?? "Subjective App";
    const candidate = first.replace(/^(build|make|create|design)\s+(an?|the)\s+/i, "").split(/[,.!?]/)[0];
    title = titleCase(candidate.split(/\s+/).slice(0, 5).join(" ")) || "Subjective App";
  }

  // Unstructured English still gets classified into the same intent buckets.
  const bodySentences = splitSentences(sections.body.join(" "));
  const unclassified = [];
  for (const sentence of bodySentences) {
    const classifier = FREEFORM_CLASSIFIERS.find(({ pattern }) => pattern.test(sentence));
    if (classifier) sections[classifier.section].push(sentence);
    else unclassified.push(sentence);
  }
  sections.body = unclassified;

  for (const key of Object.keys(sections)) {
    sections[key] = uniqueEntries(sections[key]);
  }

  return { title, sections, source: text };
}

function inferTone(parsed) {
  const explicit = parsed.sections.tone.flatMap((entry) => entry.split(/,|\band\b/i));
  const text = parsed.source.toLowerCase();
  const discovered = TONE_WORDS.filter((word) => new RegExp(`\\b${word}\\b`, "i").test(text));
  const tone = uniqueEntries([...explicit, ...discovered]).map((entry) => entry.toLowerCase());
  return tone.length ? tone.slice(0, 6) : ["clear", "human", "adaptive"];
}

function inferDomain(parsed) {
  const explicit = parsed.sections.data.join(" ");
  const haystack = `${explicit} ${parsed.source}`;
  const match = DOMAIN_PATTERNS.find(({ pattern }) => pattern.test(haystack));
  return match
    ? { singular: match.singular, plural: match.plural, icon: match.icon }
    : { singular: "Item", plural: "Items", icon: "◫" };
}

function actionLabelFromEntry(entry, domain) {
  const text = cleanEntry(entry)
    .replace(/^(users? (can|should be able to)|let users?|allow users? to|make it (easy|obvious) to|the user can)\s+/i, "")
    .replace(/^(must|always|prefer|should|ideally|ensure|make sure)\s+/i, "");
  const firstWords = text.split(/\s+/).slice(0, 5).join(" ");
  let label = titleCase(firstWords);
  label = label
    .replace(/\bA New\b/g, "New")
    .replace(/\bThe\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (/^create$/i.test(label)) label = `New ${domain.singular}`;
  return label || "Open";
}

function inferCapabilities(parsed, domain) {
  const candidates = [
    ...parsed.sections.actions.map((text) => ({ text, weight: 120, explicit: true })),
    ...parsed.sections.must.map((text) => ({ text, weight: 100, explicit: false })),
    ...parsed.sections.prefer.map((text) => ({ text, weight: 65, explicit: false })),
    ...parsed.sections.body.map((text) => ({ text, weight: 40, explicit: false }))
  ];

  const found = new Map();

  for (const candidate of candidates) {
    for (const definition of CAPABILITY_PATTERNS) {
      if (!definition.pattern.test(candidate.text)) continue;
      const id = definition.id === "create" ? `create-${slugify(domain.singular) || "item"}` : definition.id;
      const existing = found.get(id);
      const label = definition.id === "create" ? `New ${domain.singular}` : definition.label;
      const capability = {
        id,
        label,
        kind: definition.kind,
        priority: Math.min(120, definition.priority + candidate.weight / 10),
        shortcut: definition.shortcut,
        reason: candidate.text,
        required: parsed.sections.must.some((entry) => entry === candidate.text)
      };
      if (!existing) {
        found.set(id, capability);
      } else if (capability.priority > existing.priority) {
        found.set(id, { ...capability, required: capability.required || existing.required });
      } else if (capability.required && !existing.required) {
        found.set(id, { ...existing, required: true });
      }
    }

    if (candidate.explicit && !CAPABILITY_PATTERNS.some(({ pattern }) => pattern.test(candidate.text))) {
      const label = actionLabelFromEntry(candidate.text, domain);
      const id = slugify(label) || `action-${found.size + 1}`;
      found.set(id, {
        id,
        label,
        kind: "custom",
        priority: candidate.weight,
        reason: candidate.text,
        required: false
      });
    }
  }

  if (!found.size) {
    found.set(`create-${slugify(domain.singular)}`, {
      id: `create-${slugify(domain.singular)}`,
      label: `New ${domain.singular}`,
      kind: "create",
      priority: 100,
      shortcut: "N",
      reason: `Create a ${domain.singular.toLowerCase()}`,
      required: true
    });
    found.set("search", {
      id: "search",
      label: "Search",
      kind: "search",
      priority: 80,
      shortcut: "/",
      reason: `Find ${domain.plural.toLowerCase()}`,
      required: false
    });
  }

  return [...found.values()].sort((left, right) => right.priority - left.priority);
}

function inferNavigation(parsed, domain, capabilities) {
  const explicit = parsed.sections.navigation;
  if (explicit.length) {
    return uniqueEntries(explicit).map((label, index) => ({
      id: slugify(label) || `nav-${index + 1}`,
      label: titleCase(label),
      priority: 100 - index * 5
    }));
  }

  const entries = [
    { id: "overview", label: "Overview", priority: 100 },
    { id: slugify(domain.plural), label: domain.plural, priority: 90 }
  ];

  if (capabilities.some(({ kind }) => kind === "activity")) entries.push({ id: "activity", label: "Activity", priority: 55 });
  if (capabilities.some(({ kind }) => kind === "analytics")) entries.push({ id: "analytics", label: "Analytics", priority: 50 });
  if (capabilities.some(({ kind }) => kind === "settings")) entries.push({ id: "settings", label: "Settings", priority: 10 });
  return entries;
}

function inferNovelty(parsed, options) {
  if (Number.isFinite(options.novelty)) return clamp(options.novelty);
  const source = parsed.source.toLowerCase();
  if (/every (refresh|reload)|different ui|new ui|reinterpret|non-deterministic/.test(source)) return 0.82;
  if (/consistent|familiar|stable|predictable/.test(source)) return 0.28;
  return 0.62;
}

function inferGoal(parsed, domain) {
  const explicit = [...parsed.sections.purpose, ...parsed.sections.body];
  if (explicit.length) return explicit.join(" ");
  return `Help people understand and act on their ${domain.plural.toLowerCase()} without unnecessary friction.`;
}

function inferAudience(parsed) {
  if (parsed.sections.audience.length) return parsed.sections.audience;
  const matches = [];
  for (const phrase of ["new users", "power users", "small teams", "founders", "designers", "developers", "operators", "customers"]) {
    if (parsed.source.toLowerCase().includes(phrase)) matches.push(titleCase(phrase));
  }
  return matches.length ? matches : ["People using the product"];
}

export function validateManifest(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== "object") errors.push("Manifest must be an object.");
  if (manifest?.schema !== MANIFEST_SCHEMA) errors.push(`Manifest schema must be ${MANIFEST_SCHEMA}.`);
  if (!manifest?.name || typeof manifest.name !== "string") errors.push("Manifest requires a name.");
  if (typeof manifest?.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.slug)) errors.push("Manifest requires a kebab-case slug.");
  if (!manifest?.intent?.goal || typeof manifest.intent.goal !== "string") errors.push("Manifest requires intent.goal.");
  for (const field of ["audience", "tone", "must", "prefer", "avoid", "adapt"]) {
    if (!Array.isArray(manifest?.intent?.[field])) errors.push(`Manifest requires intent.${field} as an array.`);
  }
  if (!manifest?.domain?.singular || !manifest?.domain?.plural || typeof manifest?.domain?.icon !== "string") {
    errors.push("Manifest requires domain.singular, domain.plural, and domain.icon.");
  } else if (manifest.domain.icon.length > 16 || /[<>&]/.test(manifest.domain.icon)) {
    errors.push("Manifest domain.icon must be a short text glyph, not markup.");
  }
  if (!Array.isArray(manifest?.capabilities)) {
    errors.push("Manifest requires capabilities as an array.");
  } else {
    manifest.capabilities.forEach((capability, index) => {
      if (!capability?.id || !capability?.label || !capability?.kind) errors.push(`Capability ${index} requires id, label, and kind.`);
      if (capability?.id && !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(capability.id)) errors.push(`Capability ${index} id must be kebab-case.`);
      if (capability?.kind && !CAPABILITY_KINDS.includes(capability.kind)) errors.push(`Capability ${index} has an unsupported kind.`);
      if (!Number.isFinite(capability?.priority)) errors.push(`Capability ${index} requires a numeric priority.`);
    });
    const capabilityIds = manifest.capabilities.map(({ id }) => id).filter(Boolean);
    if (new Set(capabilityIds).size !== capabilityIds.length) errors.push("Capability ids must be unique.");
  }
  if (!Array.isArray(manifest?.navigation)) errors.push("Manifest requires navigation as an array.");
  else {
    const navigationIds = manifest.navigation.map(({ id }) => id);
    if (navigationIds.some((id) => typeof id !== "string" || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id))) errors.push("Navigation ids must be kebab-case.");
    if (new Set(navigationIds).size !== navigationIds.length) errors.push("Navigation ids must be unique.");
  }
  if (!Number.isFinite(manifest?.policies?.novelty)) errors.push("Manifest requires policies.novelty.");
  if (!Array.isArray(manifest?.policies?.anchors)) errors.push("Manifest requires policies.anchors as an array.");
  if (!manifest?.source?.hash || typeof manifest.source.hash !== "string") errors.push("Manifest requires source.hash.");
  return { valid: errors.length === 0, errors };
}

export function compileSubjective(source, options = {}) {
  const parsed = parseSubjectiveSource(source);
  const domain = inferDomain(parsed);
  const capabilities = inferCapabilities(parsed, domain);
  const novelty = inferNovelty(parsed, options);
  const tone = inferTone(parsed);
  const navigation = inferNavigation(parsed, domain, capabilities);

  const manifest = {
    schema: MANIFEST_SCHEMA,
    name: options.name || parsed.title,
    slug: slugify(options.name || parsed.title) || "subjective-app",
    intent: {
      goal: inferGoal(parsed, domain),
      audience: inferAudience(parsed),
      tone,
      must: parsed.sections.must,
      prefer: parsed.sections.prefer,
      avoid: parsed.sections.avoid,
      adapt: parsed.sections.adapt
    },
    domain,
    capabilities,
    navigation,
    policies: {
      refresh: options.refresh || (/refresh|reload|different ui/i.test(parsed.source) ? "new-variant" : "contextual"),
      novelty,
      stability: clamp(1 - novelty * 0.58, 0.35, 0.9),
      anchors: options.anchors || ["brand", "primary-action", "labels", "semantics", "keyboard-shortcuts"],
      accessibility: {
        minContrast: "AA",
        reducedMotion: true,
        semanticActions: true
      }
    },
    source: {
      hash: hashString(parsed.source).toString(16).padStart(8, "0"),
      text: parsed.source,
      compiler: `local-heuristic@${SUBJECTIVE_C_VERSION}`
    }
  };

  const validation = validateManifest(manifest);
  if (!validation.valid) {
    throw new Error(`Invalid Subjective C manifest: ${validation.errors.join(" ")}`);
  }
  return manifest;
}
