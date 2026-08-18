/**
 * Small deterministic helpers used by both Node and the browser runtime.
 * There are intentionally no dependencies in the core package.
 */

export function hashString(value) {
  const input = String(value ?? "");
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function seedToNumber(seed) {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    return seed >>> 0;
  }
  return hashString(String(seed ?? "subjective-c"));
}

export function createRandom(seed) {
  let state = seedToNumber(seed);
  return function random() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, Number(value)));
}

export function pick(random, values) {
  if (!Array.isArray(values) || values.length === 0) return undefined;
  return values[Math.floor(random() * values.length)];
}

export function weightedPick(random, entries) {
  const valid = entries.filter((entry) => entry && entry.weight > 0);
  const total = valid.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) return valid[0]?.value;
  let cursor = random() * total;
  for (const entry of valid) {
    cursor -= entry.weight;
    if (cursor <= 0) return entry.value;
  }
  return valid.at(-1)?.value;
}

export function shuffle(random, values) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function slugify(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function titleCase(value) {
  return String(value ?? "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
