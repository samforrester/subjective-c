const SAFE_ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const SIGNAL_WEIGHTS = Object.freeze({ search: 8, select: 100, view: 3, engage: 2 });
const STOP_WORDS = new Set(["a", "an", "and", "for", "i", "in", "me", "my", "of", "or", "the", "to", "want", "with"]);

function tokens(value) {
  return [...new Set(String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
    .slice(0, 64))];
}

export function normalizeAdaptationConfig(input = {}) {
  const intents = (Array.isArray(input.intents) ? input.intents : []).map((intent, index) => {
    if (!intent || typeof intent !== "object" || !SAFE_ID.test(String(intent.id || ""))) {
      throw new TypeError(`Adaptation intent ${index} requires a kebab-case id.`);
    }
    return Object.freeze({
      id: intent.id,
      label: String(intent.label || intent.id).trim(),
      description: String(intent.description || "").trim(),
      interpretation: SAFE_ID.test(String(intent.interpretation || "")) ? intent.interpretation : null,
      keywords: Object.freeze(tokens([...(intent.keywords || []), intent.label, intent.id].join(" "))),
      prompts: Object.freeze((intent.prompts || []).map(String).map((value) => value.trim()).filter(Boolean).slice(0, 6))
    });
  });
  if (!intents.length) return Object.freeze({ enabled: false, storage: "memory", defaultIntent: null, intents: Object.freeze([]) });
  const ids = new Set(intents.map(({ id }) => id));
  if (ids.size !== intents.length) throw new TypeError("Adaptation intent ids must be unique.");
  const defaultIntent = ids.has(input.defaultIntent) ? input.defaultIntent : intents[0].id;
  return Object.freeze({
    enabled: input.enabled !== false,
    storage: input.storage === "local" ? "local" : input.storage === "none" ? "memory" : "session",
    defaultIntent,
    intents: Object.freeze(intents)
  });
}

function resolve(scores, config, evidence = []) {
  const ranked = config.intents
    .map((intent) => ({ intent, score: Number(scores[intent.id] || 0) }))
    .sort((left, right) => right.score - left.score);
  const winner = ranked[0]?.score > 0 ? ranked[0] : ranked.find(({ intent }) => intent.id === config.defaultIntent) || ranked[0];
  const total = ranked.reduce((sum, entry) => sum + Math.max(0, entry.score), 0);
  const confidence = total > 0 ? Math.min(0.99, winner.score / total) : 0;
  return {
    intent: winner?.intent.id || null,
    label: winner?.intent.label || "Adaptive",
    interpretation: winner?.intent.interpretation || null,
    confidence,
    reasons: evidence.filter(({ intent }) => intent === winner?.intent.id).slice(-3).reverse().map(({ reason }) => reason),
    scores: Object.fromEntries(ranked.map(({ intent, score }) => [intent.id, Number(score.toFixed(3))]))
  };
}

export function createVisitorModel(configInput = {}, initial = {}) {
  const config = normalizeAdaptationConfig(configInput);
  const scores = Object.fromEntries(config.intents.map(({ id }) => [id, Math.max(0, Number(initial.scores?.[id] || 0))]));
  const evidence = Array.isArray(initial.evidence) ? initial.evidence.slice(-16).filter((entry) => entry && typeof entry.reason === "string") : [];
  return Object.freeze({
    schema: "subjective-c/visitor@0.1",
    revision: Math.max(0, Number(initial.revision || 0)),
    ...resolve(scores, config, evidence),
    evidence: Object.freeze(evidence)
  });
}

export function observeVisitorSignal(model, signal = {}, configInput = {}) {
  const config = normalizeAdaptationConfig(configInput);
  if (!config.enabled) return createVisitorModel(config, model);
  const scores = Object.fromEntries(config.intents.map(({ id }) => [id, Number(model?.scores?.[id] || 0) * 0.94]));
  const kind = SIGNAL_WEIGHTS[signal.kind] ? signal.kind : "engage";
  const signalTokens = tokens([signal.text, ...(signal.tags || [])].filter(Boolean).join(" "));
  const evidence = [...(model?.evidence || [])].slice(-15);

  for (const intent of config.intents) {
    const direct = kind === "select" && signal.intent === intent.id;
    const matched = signalTokens.filter((token) => intent.keywords.some((keyword) => keyword === token || (token.length >= 4 && keyword.length >= 4 && (keyword.includes(token) || token.includes(keyword)))));
    const points = direct ? SIGNAL_WEIGHTS.select : matched.length * SIGNAL_WEIGHTS[kind];
    if (!points) continue;
    scores[intent.id] += points;
    evidence.push({ intent: intent.id, reason: direct ? `You chose “${intent.label}”.` : `${kind === "search" ? "Your search" : "Your activity"} matched ${matched.slice(0, 3).join(", ")}.` });
  }

  return Object.freeze({
    schema: "subjective-c/visitor@0.1",
    revision: Number(model?.revision || 0) + 1,
    ...resolve(scores, config, evidence),
    evidence: Object.freeze(evidence.slice(-16))
  });
}

export function resolveAdaptiveData(data = {}, model, configInput = {}) {
  const config = normalizeAdaptationConfig(configInput);
  const intent = config.intents.find(({ id }) => id === model?.intent) || config.intents.find(({ id }) => id === config.defaultIntent);
  const experiences = data && typeof data.experiences === "object" ? data.experiences : {};
  const layer = intent ? experiences[intent.id] : null;
  const base = Object.fromEntries(Object.entries(data || {}).filter(([key]) => key !== "experiences"));
  return {
    ...base,
    ...(layer && typeof layer === "object" ? layer : {}),
    adaptation: {
      enabled: config.enabled,
      intent: intent?.id || null,
      label: intent?.label || "Adaptive",
      description: intent?.description || "",
      confidence: Number(model?.confidence || 0),
      reasons: [...(model?.reasons || [])],
      prompts: config.intents.flatMap((entry) => entry.prompts.slice(0, 1)).slice(0, 6),
      revision: Number(model?.revision || 0)
    }
  };
}
