const STATUS_ORDER = ["Blocked", "In progress", "Review", "Planned", "Done"];
const PREFERENCE_VALUES = Object.freeze({
  density: new Set(["comfortable", "balanced", "compact"]),
  motion: new Set(["subtle", "expressive", "reduced"]),
  contrast: new Set(["standard", "high"])
});
const SAFE_ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const SAFE_TOKEN_VALUE = /^[^;{}<>]*$/;
const INTERPRETATION_OPTIONS = Object.freeze([
  ["muni-control", "Muni Control"],
  ["sutro-fog", "Sutro Fog Observatory"],
  ["sfo-departures", "SFO Departures"],
  ["ferry-tide", "Ferry Tide Table"],
  ["mission-neon", "Mission After Dark"],
  ["golden-gate", "Golden Gate Load Monitor"],
  ["exploratorium-lab", "Exploratorium Field Lab"],
  ["ship-command", "Ship Command"],
  ["bart-platform", "BART Platform"],
  ["gravity-well", "Farallon Gravity Array"],
  ["dream-fold", "Market Street Dream Fold"]
]);
const CINEMA_JOURNEY = Object.freeze([
  { id: "gravity-well", number: "01", place: "Lands End", coordinate: "37.7800° N", title: "Intent enters as signal.", copy: "At the edge of the city, the interface begins with meaning—not pixels." },
  { id: "sutro-fog", number: "02", place: "Sutro Tower", coordinate: "37.7552° N", title: "Context changes what becomes visible.", copy: "The same product clarifies itself for the person, place, and moment." },
  { id: "dream-fold", number: "03", place: "Market Street", coordinate: "37.7897° N", title: "Structure can fold without losing meaning.", copy: "Navigation, hierarchy, and density transform. The contract underneath stays intact." },
  { id: "mission-neon", number: "04", place: "24th Street", coordinate: "37.7522° N", title: "Culture changes the surface.", copy: "A system can belong to its environment without becoming a costume." },
  { id: "ferry-tide", number: "05", place: "Embarcadero", coordinate: "37.7955° N", title: "The interface moves with its world.", copy: "Motion carries state, direction, and consequence instead of adding decoration." },
  { id: "exploratorium-lab", number: "06", place: "Pier 15", coordinate: "37.8017° N", title: "Every reality remains inspectable.", copy: "See the interpretation, test the plan, and trace every choice back to intent." },
  { id: "ship-command", number: "07", place: "Fort Mason", coordinate: "37.8068° N", title: "Actions remain stable in every reality.", copy: "Eleven interfaces. One trusted capability model. Zero broken promises." }
]);

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function slug(value) {
  const input = String(value ?? "").toLowerCase().slice(0, 256);
  let output = "";
  let separator = false;
  for (const character of input) {
    const code = character.charCodeAt(0);
    const isAsciiLetter = code >= 97 && code <= 122;
    const isDigit = code >= 48 && code <= 57;
    if (isAsciiLetter || isDigit) {
      if (separator && output) output += "-";
      output += character;
      separator = false;
    } else {
      separator = true;
    }
  }
  return output;
}

function shortGoal(goal, mode) {
  const value = String(goal ?? "").trim();
  if (mode === "terse") return value.split(/[.!?]/)[0] || value;
  if (mode === "editorial" && value.length > 150) return `${value.slice(0, 147).trim()}…`;
  return value;
}

function getPrimaryAction(manifest) {
  return manifest.capabilities.find(({ kind }) => kind === "create")
    || manifest.capabilities.find(({ required }) => required)
    || manifest.capabilities[0]
    || { id: "create-item", label: `New ${manifest.domain.singular}`, kind: "create", shortcut: "N" };
}

function getCapability(manifest, kind) {
  return manifest.capabilities.find((capability) => capability.kind === kind);
}

function interpretationMeta(variant) {
  return {
    id: variant.theme?.interpretation || variant.theme?.palette || "subjective-sf",
    label: variant.theme?.label || "SF Signal Deck",
    location: variant.theme?.location || "San Francisco",
    symbol: variant.theme?.symbol || "SF"
  };
}

function interpretationCopy(variant) {
  const id = interpretationMeta(variant).id;
  return {
    "muni-control": { collection: "Active lines", activity: "Dispatch wire", signal: "Service advisory", hero: "Network operations" },
    "sutro-fog": { collection: "Signals through the fog", activity: "Atmospheric record", signal: "Visibility forecast", hero: "Fog observatory" },
    "sfo-departures": { collection: "Departures", activity: "Tower log", signal: "Operations notice", hero: "Departure control" },
    "ferry-tide": { collection: "Crossings", activity: "Harbor log", signal: "Tide signal", hero: "Waterfront schedule" },
    "mission-neon": { collection: "Night signals", activity: "Street transmission", signal: "Live frequency", hero: "After-dark network" },
    "golden-gate": { collection: "Structural spans", activity: "Sensor record", signal: "Load advisory", hero: "Bridge monitor" },
    "exploratorium-lab": { collection: "Field experiments", activity: "Observation log", signal: "Instrument reading", hero: "Public laboratory" },
    "ship-command": { collection: "Active deployments", activity: "Ship log", signal: "Command signal", hero: "Release command" },
    "bart-platform": { collection: "Platform arrivals", activity: "System messages", signal: "Platform notice", hero: "Regional wayfinder" },
    "gravity-well": { collection: "Objects in orbit", activity: "Relativity log", signal: "Temporal divergence", hero: "Gravity array" },
    "dream-fold": { collection: "Nested realities", activity: "Layer memory", signal: "Reality confidence", hero: "Dream architecture" }
  }[id] || { collection: "Current workspace", activity: "Recent activity", signal: "Subjective signal", hero: "Adaptive runtime" };
}

function interpretationPosition(variant) {
  const id = interpretationMeta(variant).id;
  const index = Math.max(0, INTERPRETATION_OPTIONS.findIndex(([value]) => value === id));
  return { index, total: INTERPRETATION_OPTIONS.length };
}

function shiftedInterpretation(variant, delta) {
  const { index, total } = interpretationPosition(variant);
  return INTERPRETATION_OPTIONS[(index + delta + total) % total][0];
}

function renderExperienceChrome(variant) {
  const interpretation = interpretationMeta(variant);
  const { index, total } = interpretationPosition(variant);
  const counter = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  const transmission = `${interpretation.label} — ${interpretation.location} — intent is the source — interface is the interpretation — `;
  return `
    <div class="sc-scroll-progress" aria-hidden="true"><i></i></div>
    <div class="sc-pointer-aura" aria-hidden="true"></div>
    <div class="sc-showcase-cursor" aria-hidden="true"><i></i><span>EXPLORE</span></div>
    <div class="sc-ghost-title" data-echo="${escapeHtml(interpretation.label)}" aria-hidden="true">${escapeHtml(interpretation.label)}</div>
    <div class="sc-reality-meter" aria-hidden="true"><span>Reality confidence</span><i></i><i></i><i></i><b>${Math.max(1, Math.round((1 - variant.novelty) * 100))}%</b></div>
    <nav class="sc-scene-nav" aria-label="San Francisco interpretation navigator">
      <button type="button" data-sc-lens-shift="-1" aria-label="Previous SF lens">↑</button>
      <span><b>${counter}</b><small>${escapeHtml(interpretation.location)}</small></span>
      <button type="button" data-sc-lens-shift="1" aria-label="Next SF lens">↓</button>
    </nav>
    <div class="sc-transmission" aria-hidden="true"><div>${escapeHtml(transmission.repeat(4))}</div></div>`;
}

function cinemaJourneyMeta(variant) {
  const id = interpretationMeta(variant).id;
  return CINEMA_JOURNEY.find((stop) => stop.id === id) || CINEMA_JOURNEY[0];
}

function renderCinemaChrome(variant) {
  const current = cinemaJourneyMeta(variant);
  const route = CINEMA_JOURNEY.map((stop) => `
    <button type="button" class="${stop.id === current.id ? "is-active" : ""}" data-sc-cinema-stop="${escapeHtml(stop.id)}" aria-label="Travel to ${escapeHtml(stop.place)}" ${stop.id === current.id ? 'aria-current="step"' : ""}>
      <i aria-hidden="true"></i><span>${escapeHtml(stop.place)}</span>
    </button>`).join("");
  return `
    <div class="sc-cinema-grain" aria-hidden="true"></div>
    <div class="sc-cinema-watermark" aria-hidden="true"><b>SUBJECTIVE C</b><span>SAN FRANCISCO / 2026</span></div>
    <section class="sc-cinema-slate sc-cinema-intro" aria-label="Subjective C demo introduction">
      <small>Subjective C / San Francisco</small>
      <h2>One intent.<br>Eleven interfaces.</h2>
      <p>Product meaning compiled into interfaces that adapt to context—without changing what the product can do.</p>
      <div class="sc-cinema-proof" aria-label="Project facts"><span><b>11</b> interpretations</span><span><b>120</b> semantic plans</span><span><b>41</b> tests</span><span><b>0</b> broken anchors</span></div>
      <button class="sc-cinema-enter" type="button" data-sc-cinema-enter>Travel through San Francisco <span aria-hidden="true">→</span></button>
    </section>
    <section class="sc-cinema-slate sc-cinema-outro" aria-label="Subjective C demo conclusion">
      <small>Subjective C</small>
      <h2>Intent is source code.</h2>
      <p>github.com/samforrester/subjective-c</p>
      <button class="sc-cinema-enter" type="button" data-sc-cinema-enter>Run it again <span aria-hidden="true">↻</span></button>
    </section>
    <section class="sc-city-chapter" aria-live="polite">
      <div class="sc-city-chapter-kicker"><span>${escapeHtml(current.number)} / 07</span><span>${escapeHtml(current.place)}</span><span>${escapeHtml(current.coordinate)}</span></div>
      <h2>${escapeHtml(current.title)}</h2>
      <p>${escapeHtml(current.copy)}</p>
    </section>
    <div class="sc-city-journey" aria-label="San Francisco interface journey">
      <div class="sc-city-route">${route}</div>
      <div class="sc-cinema-director" aria-label="Cinema controls">
        <button type="button" data-sc-cinema-autoplay aria-pressed="false"><i></i> Autopilot</button>
        <span>[ ] to travel</span>
        <button type="button" data-sc-cinema-exit>Open the product ↗</button>
      </div>
    </div>`;
}

function renderLogo(manifest, compact = false) {
  const initials = manifest.name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return `
    <a class="sc-brand" href="#overview" data-sc-nav="overview" aria-label="${escapeHtml(manifest.name)} home">
      <span class="sc-logo" aria-hidden="true">${escapeHtml(initials)}</span>
      <span class="sc-brand-copy">
        <strong>${escapeHtml(manifest.name)}</strong>
        ${compact ? "" : '<small>compiled subjectively</small>'}
      </span>
    </a>`;
}

function renderNavigation(manifest, variant, compact = false) {
  const entries = manifest.navigation.map((entry, index) => `
    <a href="#${escapeHtml(entry.id)}" class="sc-nav-link ${index === 0 ? "is-active" : ""}" data-sc-nav="${escapeHtml(entry.id)}">
      <span class="sc-nav-glyph" aria-hidden="true">${escapeHtml(index === 0 ? "⌂" : index === 1 ? manifest.domain.icon : ["◴", "⌁", "⚙"][index - 2] || "·")}</span>
      <span>${escapeHtml(entry.label)}</span>
      ${compact ? "" : `<kbd>${index + 1}</kbd>`}
    </a>`).join("");
  return `<nav class="sc-nav sc-nav-${variant.navigation}" aria-label="Primary">${entries}</nav>`;
}

function renderPrimaryAction(manifest) {
  const action = getPrimaryAction(manifest);
  const symbol = action.kind === "search" ? "⌕" : action.kind === "export" ? "↓" : "＋";
  return `
    <button class="sc-button sc-button-primary" type="button" data-sc-action="${escapeHtml(action.id)}" data-sc-action-kind="${escapeHtml(action.kind)}">
      <span aria-hidden="true">${symbol}</span>
      <span>${escapeHtml(action.label)}</span>
      ${action.shortcut ? `<kbd>${escapeHtml(action.shortcut)}</kbd>` : ""}
    </button>`;
}

function renderTopbar(manifest, variant) {
  const search = getCapability(manifest, "search");
  const interpretation = interpretationMeta(variant);
  return `
    <header class="sc-topbar">
      <div class="sc-topbar-left">
        ${variant.navigation === "top" ? renderLogo(manifest, true) : `<div class="sc-breadcrumb"><span>SF / ${escapeHtml(interpretation.location)}</span><b>/</b><strong>${escapeHtml(interpretation.label)}</strong></div>`}
        ${variant.navigation === "top" ? renderNavigation(manifest, variant, true) : ""}
      </div>
      <div class="sc-topbar-actions">
        ${search ? `<button class="sc-icon-button" type="button" data-sc-focus-search aria-label="Search"><span aria-hidden="true">⌕</span><kbd>/</kbd></button>` : ""}
        <button class="sc-avatar" type="button" aria-label="Open account menu">DY</button>
        ${renderPrimaryAction(manifest)}
      </div>
    </header>`;
}

function renderSidebar(manifest, variant) {
  const interpretation = interpretationMeta(variant);
  return `
    <aside class="sc-sidebar">
      ${renderLogo(manifest)}
      ${renderNavigation(manifest, variant)}
      <div class="sc-sidebar-spacer"></div>
      <div class="sc-sidebar-note">
        <span class="sc-live-dot" aria-hidden="true"></span>
        <div><strong>${escapeHtml(interpretation.label)}</strong><small>${escapeHtml(interpretation.location)} · ${escapeHtml(variant.id)}</small></div>
      </div>
      <button class="sc-user-card" type="button">
        <span class="sc-avatar">DY</span>
        <span><strong>Demo user</strong><small>${escapeHtml(variant.context.experience)}</small></span>
        <span aria-hidden="true">•••</span>
      </button>
    </aside>`;
}

function renderHero(manifest, variant, data = {}) {
  const tone = manifest.intent.tone.slice(0, 4);
  const goal = shortGoal(manifest.intent.goal, variant.composition.copyMode);
  const title = variant.composition.hero === "welcome"
    ? `${variant.context.experience === "novice" ? "Let’s get oriented" : "Good afternoon"}.`
    : manifest.name;
  const interpretation = interpretationMeta(variant);
  const copy = interpretationCopy(variant);
  const adaptiveHero = data.hero && typeof data.hero === "object" ? data.hero : null;
  const adaptation = data.adaptation && typeof data.adaptation === "object" ? data.adaptation : null;

  if (adaptiveHero) {
    const prompts = Array.isArray(adaptation?.prompts) ? adaptation.prompts : [];
    const reasons = Array.isArray(adaptation?.reasons) ? adaptation.reasons : [];
    return `
      <section class="sc-hero sc-hero-adaptive" id="overview">
        <div class="sc-adaptive-status">
          <span><i aria-hidden="true"></i>${escapeHtml(adaptation?.label || "Exploring")}</span>
          <details>
            <summary>Why this view?</summary>
            <div><p>${escapeHtml(adaptation?.description || "This page responds to what you search and explore in this session.")}</p>${reasons.length ? `<ul>${reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}</ul>` : ""}<button type="button" data-sc-adaptation-reset>Reset my view</button></div>
          </details>
        </div>
        <div class="sc-adaptive-hero-copy">
          <span class="sc-eyebrow">${escapeHtml(adaptiveHero.eyebrow || interpretation.location)}</span>
          <h1>${escapeHtml(adaptiveHero.title || goal)}</h1>
          <p>${escapeHtml(adaptiveHero.description || goal)}</p>
          <form class="sc-intent-search" data-sc-intent-form>
            <label><span class="sc-sr-only">Describe what you want</span><input name="intent" autocomplete="off" placeholder="${escapeHtml(adaptiveHero.placeholder || "What are you in the mood for?")}" required></label>
            <button type="submit">Reinterpret <span aria-hidden="true">→</span></button>
          </form>
          ${prompts.length ? `<div class="sc-intent-prompts"><span>Try</span>${prompts.map((prompt) => `<button type="button" data-sc-intent-prompt="${escapeHtml(prompt)}">${escapeHtml(prompt)}</button>`).join("")}</div>` : ""}
        </div>
        <div class="sc-adaptive-signal" aria-hidden="true"><span>${escapeHtml(interpretation.symbol)}</span><i></i><i></i><i></i></div>
      </section>`;
  }

  if (variant.composition.hero === "compact") {
    return `
      <section class="sc-hero sc-hero-compact" id="overview">
        <div>
          <span class="sc-eyebrow">SF / ${escapeHtml(interpretation.location)} · ${escapeHtml(copy.hero)}</span>
          <h1>${escapeHtml(title)}</h1>
        </div>
        <p>${escapeHtml(goal)}</p>
        <div class="sc-intent-pills">${tone.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
      </section>`;
  }

  if (variant.composition.hero === "statement") {
    return `
      <section class="sc-hero sc-hero-statement" id="overview">
        <div class="sc-hero-index">0${manifest.navigation.length}</div>
        <div>
          <span class="sc-eyebrow">${escapeHtml(interpretation.symbol)} / ${escapeHtml(interpretation.label)} / ${escapeHtml(variant.context.experience)}</span>
          <h1>${escapeHtml(goal)}</h1>
          <div class="sc-intent-pills">${tone.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
        </div>
        <div class="sc-hero-orbit" aria-hidden="true"><i></i><i></i><i></i></div>
      </section>`;
  }

  return `
    <section class="sc-hero sc-hero-welcome" id="overview">
      <div class="sc-hero-copy">
        <span class="sc-eyebrow">${escapeHtml(interpretation.symbol)} · ${escapeHtml(interpretation.label)} · ${escapeHtml(interpretation.location)}</span>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(goal)}</p>
        ${variant.composition.copyMode === "explanatory" ? `<div class="sc-guidance"><span>↳</span> Start with the primary action or explore the work already in motion.</div>` : ""}
      </div>
      <div class="sc-hero-signal" aria-label="Current interpretation">
        <span>SF interpretation</span>
        <strong>${escapeHtml(interpretation.symbol)}</strong>
        <small>${escapeHtml(interpretation.label)} · ${escapeHtml(variant.layout.replace(/-/g, " "))}</small>
      </div>
    </section>`;
}

function renderMetrics(data, variant) {
  const metrics = Array.isArray(data.metrics) ? data.metrics : [];
  if (!metrics.length) return "";
  if (variant.composition.metrics === "sentence") {
    const sentence = metrics.map((metric, index) => `${index ? "" : "You have "}<strong>${escapeHtml(metric.value)}</strong> ${escapeHtml(metric.label.toLowerCase())}`).join(", ");
    return `<section class="sc-section sc-metrics-sentence" id="analytics"><span class="sc-section-kicker">At a glance</span><p>${sentence}.</p></section>`;
  }

  return `
    <section class="sc-section sc-metrics sc-metrics-${escapeHtml(variant.composition.metrics)}" id="analytics" aria-label="Metrics" ${variant.composition.metrics === "rail" ? 'tabindex="0"' : ""}>
      ${metrics.map((metric, index) => `
        <article class="sc-metric">
          <div class="sc-metric-top"><span>${escapeHtml(metric.label)}</span><span class="sc-mini-spark" aria-hidden="true">${["╱╲╱╱", "╲╱╱╲", "╱╱╲╱", "╲╲╱╱"][index % 4]}</span></div>
          <strong>${escapeHtml(metric.value)}</strong>
          <small class="${String(metric.delta).trim().startsWith("-") ? "is-negative" : ""}">${escapeHtml(metric.delta || "Current")}</small>
        </article>`).join("")}
    </section>`;
}

function renderStatus(status) {
  const label = String(status || "Unknown").slice(0, 128);
  return `<span class="sc-status sc-status-${slug(label)}"><i aria-hidden="true"></i>${escapeHtml(label)}</span>`;
}

function renderProgress(value) {
  const number = Math.max(0, Math.min(100, Number(value || 0)));
  return `<div class="sc-progress" role="progressbar" aria-label="Progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${number}"><span style="width:${number}%"></span></div>`;
}

function renderTags(tags = []) {
  return `<div class="sc-tags">${tags.slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>`;
}

function itemSearchText(item) {
  return [item.name, item.status, item.owner, item.description, ...(item.tags || [])]
    .filter(Boolean)
    .join(" ")
    .slice(0, 2048);
}

function renderItemCard(item, index) {
  return `
    <div class="sc-item-card" data-sc-item="${index}" data-searchable="${escapeHtml(itemSearchText(item))}" tabindex="0" role="button" aria-label="Open ${escapeHtml(item.name)}">
      <div class="sc-item-card-top">
        ${renderStatus(item.status)}
        <span class="sc-more" aria-hidden="true">•••</span>
      </div>
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.description || "No description yet.")}</p>
      ${renderTags(item.tags)}
      <div class="sc-item-card-bottom">
        <span class="sc-owner"><i>${escapeHtml((item.owner || "?").split(/\s+/).map((part) => part[0]).join("").slice(0, 2))}</i>${escapeHtml(item.owner || "Unassigned")}</span>
        <span>${escapeHtml(item.due || "No due date")}</span>
      </div>
      ${renderProgress(item.progress)}
    </div>`;
}

function renderItemRow(item, index) {
  return `
    <div class="sc-item-row" data-sc-item="${index}" data-searchable="${escapeHtml(itemSearchText(item))}" tabindex="0" role="button" aria-label="Open ${escapeHtml(item.name)}">
      <span class="sc-item-icon">${escapeHtml(item.icon || "◫")}</span>
      <div class="sc-item-name"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.description || item.tags?.join(" · ") || "")}</small></div>
      ${renderStatus(item.status)}
      <span class="sc-owner"><i>${escapeHtml((item.owner || "?").split(/\s+/).map((part) => part[0]).join("").slice(0, 2))}</i>${escapeHtml(item.owner || "Unassigned")}</span>
      <div class="sc-row-progress">${renderProgress(item.progress)}<small>${Number(item.progress || 0)}%</small></div>
      <span class="sc-due">${escapeHtml(item.due || "—")}</span>
      <span class="sc-row-arrow" aria-hidden="true">↗</span>
    </div>`;
}

function renderTable(items) {
  return `
    <div class="sc-table-wrap">
      <table class="sc-table">
        <thead><tr><th>Name</th><th>Status</th><th>Owner</th><th>Progress</th><th>Due</th><th><span class="sc-sr-only">Open item</span></th></tr></thead>
        <tbody>
          ${items.map((item, index) => `
            <tr data-sc-item="${index}" data-searchable="${escapeHtml(itemSearchText(item))}">
              <td><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.tags?.join(" · ") || "")}</small></td>
              <td>${renderStatus(item.status)}</td>
              <td><span class="sc-owner"><i>${escapeHtml((item.owner || "?").split(/\s+/).map((part) => part[0]).join("").slice(0, 2))}</i>${escapeHtml(item.owner || "Unassigned")}</span></td>
              <td><div class="sc-table-progress">${renderProgress(item.progress)}<span>${Number(item.progress || 0)}%</span></div></td>
              <td>${escapeHtml(item.due || "—")}</td>
              <td><button class="sc-row-arrow" type="button" data-sc-item-open="${index}" aria-label="Open ${escapeHtml(item.name)}">↗</button></td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>`;
}

function renderBoard(items) {
  const statuses = [...STATUS_ORDER.filter((status) => items.some((item) => item.status === status))];
  for (const status of new Set(items.map((item) => item.status).filter(Boolean))) {
    if (!statuses.includes(status)) statuses.push(status);
  }
  return `
    <div class="sc-board">
      ${statuses.map((status) => {
        const members = items.map((item, index) => ({ item, index })).filter(({ item }) => item.status === status);
        return `
          <section class="sc-board-column">
            <header><span>${renderStatus(status)}</span><b>${members.length}</b></header>
            <div>${members.map(({ item, index }) => renderItemCard(item, index)).join("")}</div>
          </section>`;
      }).join("")}
    </div>`;
}

function renderCollection(manifest, data, variant) {
  const items = Array.isArray(data.items) ? data.items : [];
  const filter = getCapability(manifest, "filter");
  const search = getCapability(manifest, "search");
  const form = variant.composition.collection;
  const copy = interpretationCopy(variant);
  const body = form === "grid"
    ? `<div class="sc-item-grid">${items.map(renderItemCard).join("")}</div>`
    : form === "rows"
      ? `<div class="sc-item-rows">${items.map(renderItemRow).join("")}</div>`
      : form === "table"
        ? renderTable(items)
        : renderBoard(items);

  return `
    <section class="sc-section sc-collection sc-collection-${escapeHtml(form)}" id="${escapeHtml(slug(manifest.domain.plural))}">
      <header class="sc-section-header">
        <div>
          <span class="sc-section-kicker">${escapeHtml(copy.collection)}</span>
          <h2>${escapeHtml(manifest.domain.plural)}</h2>
          ${variant.composition.copyMode === "explanatory" ? `<p>Everything active, organized around what needs your attention next.</p>` : ""}
        </div>
        <div class="sc-collection-tools">
          ${search ? `<label class="sc-search"><span aria-hidden="true">⌕</span><input type="search" data-sc-search placeholder="Search ${escapeHtml(manifest.domain.plural.toLowerCase())}" aria-label="Search ${escapeHtml(manifest.domain.plural)}"><kbd>/</kbd></label>` : ""}
          ${filter ? `<button class="sc-button sc-button-quiet" type="button" data-sc-action="${escapeHtml(filter.id)}" data-sc-action-kind="filter"><span aria-hidden="true">≡</span> Filter</button>` : ""}
        </div>
      </header>
      ${body}
      <p class="sc-empty-state" hidden data-sc-empty>No matching ${escapeHtml(manifest.domain.plural.toLowerCase())}.</p>
    </section>`;
}

function renderActivity(data, variant) {
  const activity = Array.isArray(data.activity) ? data.activity : [];
  if (!activity.length) return "";
  const copy = interpretationCopy(variant);
  return `
    <section class="sc-section sc-activity sc-activity-${escapeHtml(variant.composition.activity)}" id="activity">
      <header class="sc-section-header">
        <div><span class="sc-section-kicker">Signal</span><h2>${escapeHtml(copy.activity)}</h2></div>
        <button class="sc-text-button" type="button">View all <span aria-hidden="true">↗</span></button>
      </header>
      <div class="sc-activity-list" ${variant.composition.activity === "ticker" ? 'tabindex="0" aria-label="Recent activity"' : ""}>
        ${activity.map((entry, index) => `
          <article class="sc-activity-entry">
            <span class="sc-activity-marker">${["↗", "✓", "＋", "◎"][index % 4]}</span>
            <div><p><strong>${escapeHtml(entry.actor || "Someone")}</strong> ${escapeHtml(entry.text || "made an update")}</p><small>${escapeHtml(entry.time || "Recently")}</small></div>
            ${entry.tag ? `<span class="sc-activity-tag">${escapeHtml(entry.tag)}</span>` : ""}
          </article>`).join("")}
      </div>
    </section>`;
}

function renderInsight(manifest, data, variant) {
  const items = Array.isArray(data.items) ? data.items : [];
  const atRisk = items.filter((item) => item.status === "Blocked" || Number(item.progress || 0) < 25);
  const complete = items.filter((item) => item.status === "Done").length;
  const message = atRisk.length
    ? `${atRisk.length} ${atRisk.length === 1 ? manifest.domain.singular.toLowerCase() : manifest.domain.plural.toLowerCase()} may need attention.`
    : complete
      ? `${complete} ${complete === 1 ? manifest.domain.singular.toLowerCase() : manifest.domain.plural.toLowerCase()} completed recently.`
      : `The workspace is moving without an obvious blocker.`;
  const copy = interpretationCopy(variant);
  return `
    <section class="sc-section sc-insight">
      <div class="sc-insight-orb" aria-hidden="true"><span></span></div>
      <div>
        <span class="sc-section-kicker">${escapeHtml(copy.signal)}</span>
        <h2>${escapeHtml(message)}</h2>
        <p>This summary is placed here because the current interpretation prioritizes attention over chronology.</p>
      </div>
      <button class="sc-button sc-button-quiet" type="button" data-sc-action="inspect-signal" data-sc-action-kind="custom">Inspect signal <span aria-hidden="true">→</span></button>
    </section>`;
}

function renderSection(name, manifest, data, variant) {
  if (name === "hero") return renderHero(manifest, variant, data);
  if (name === "metrics") return renderMetrics(data, variant);
  if (name === "collection") return renderCollection(manifest, data, variant);
  if (name === "activity") return renderActivity(data, variant);
  if (name === "insight") return renderInsight(manifest, data, variant);
  return "";
}

function renderInspector(manifest, variant, source, state) {
  const preferences = normalizePreferences(state.preferences);
  const options = ["novice", "returning", "expert"]
    .map((value) => `<option value="${value}" ${variant.context.experience === value ? "selected" : ""}>${value[0].toUpperCase()}${value.slice(1)}</option>`)
    .join("");
  const manifestPreview = JSON.stringify({
    name: manifest.name,
    intent: manifest.intent,
    capabilities: manifest.capabilities,
    policies: manifest.policies
  }, null, 2);
  const interpretation = interpretationMeta(variant);
  const interpretationOptions = INTERPRETATION_OPTIONS
    .map(([id, label]) => `<option value="${id}" ${interpretation.id === id ? "selected" : ""}>${escapeHtml(label)}</option>`)
    .join("");
  return `
    <button class="sc-inspector-fab" type="button" data-sc-inspector-toggle aria-label="Toggle Subjective C inspector">
      <span>SC</span><i></i>
    </button>
    <aside class="sc-inspector ${state.inspectorOpen === false ? "is-closed" : ""}" aria-label="Subjective C inspector">
      <header class="sc-inspector-header">
        <div><span class="sc-logo sc-logo-small">SC</span><div><strong>Subjective C</strong><small>runtime inspector</small></div></div>
        <button type="button" data-sc-inspector-toggle aria-label="Close inspector">×</button>
      </header>
      <div class="sc-inspector-scroll">
        <div class="sc-variant-identity">
          <span>Current interpretation</span>
          <strong>${escapeHtml(interpretation.symbol)} · ${escapeHtml(interpretation.label)}</strong>
          <small>${escapeHtml(interpretation.location)} · ${escapeHtml(variant.id)}</small>
          <div><code>${escapeHtml(variant.layout)}</code><code>${escapeHtml(variant.density)}</code><code>${escapeHtml(variant.composition.collection)}</code></div>
        </div>

        <section class="sc-control-group">
          <label><span>SF lens</span><select data-sc-interpretation><option value="">Random city signal</option>${interpretationOptions}</select></label>
          <label><span>User model</span><select data-sc-experience>${options}</select></label>
          <label><span>Novelty <output>${Math.round(variant.novelty * 100)}%</output></span><input type="range" min="0" max="1" step="0.01" value="${variant.novelty}" data-sc-novelty></label>
        </section>

        <details>
          <summary>Interface preferences</summary>
          <p class="sc-inspector-help">Preferences remain stable while the interface is reinterpreted.</p>
          <section class="sc-control-group">
            <label><span>Density</span><select data-sc-preference="density"><option value="">Adaptive</option>${["comfortable", "balanced", "compact"].map((value) => `<option value="${value}" ${preferences.density === value ? "selected" : ""}>${value[0].toUpperCase()}${value.slice(1)}</option>`).join("")}</select></label>
            <label><span>Motion</span><select data-sc-preference="motion"><option value="">Adaptive</option>${["subtle", "expressive", "reduced"].map((value) => `<option value="${value}" ${preferences.motion === value ? "selected" : ""}>${value[0].toUpperCase()}${value.slice(1)}</option>`).join("")}</select></label>
            <label><span>Contrast</span><select data-sc-preference="contrast"><option value="">Adaptive</option>${["standard", "high"].map((value) => `<option value="${value}" ${preferences.contrast === value ? "selected" : ""}>${value[0].toUpperCase()}${value.slice(1)}</option>`).join("")}</select></label>
          </section>
        </details>

        <details open>
          <summary>Why this UI?</summary>
          <ol>${variant.explanation.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}</ol>
        </details>

        <details>
          <summary>Stable anchors</summary>
          <div class="sc-anchor-list">${variant.anchors.map((anchor) => `<span>◆ ${escapeHtml(anchor)}</span>`).join("")}</div>
        </details>

        <details>
          <summary>Edit the intent</summary>
          <p class="sc-inspector-help">Change the English. Recompile it into a new manifest, then reinterpret the UI.</p>
          <textarea data-sc-source spellcheck="true">${escapeHtml(source)}</textarea>
          <button class="sc-button sc-button-primary sc-button-full" type="button" data-sc-compile>Compile intent</button>
        </details>

        <details>
          <summary>Compiled manifest</summary>
          <pre>${escapeHtml(manifestPreview)}</pre>
        </details>
      </div>
      <footer class="sc-inspector-footer">
        <button class="sc-button sc-button-quiet" type="button" data-sc-lock>${state.locked ? "Unlock refresh" : "Lock refresh"}</button>
        <button class="sc-button sc-button-primary" type="button" data-sc-regenerate><span aria-hidden="true">↻</span> Reinterpret</button>
      </footer>
    </aside>`;
}

function renderCreateDialog(manifest) {
  const action = getPrimaryAction(manifest);
  return `
    <dialog class="sc-dialog" data-sc-create-dialog>
      <form method="dialog" data-sc-create-form>
        <header><div><span class="sc-section-kicker">Stable action</span><h2>${escapeHtml(action.label)}</h2></div><button value="cancel" aria-label="Close">×</button></header>
        <label><span>Name</span><input name="name" required autofocus placeholder="Untitled ${escapeHtml(manifest.domain.singular.toLowerCase())}"></label>
        <label><span>Description</span><textarea name="description" placeholder="What should this accomplish?"></textarea></label>
        <div class="sc-dialog-grid">
          <label><span>Status</span><select name="status"><option>Planned</option><option>In progress</option><option>Review</option><option>Blocked</option><option>Done</option></select></label>
          <label><span>Owner</span><input name="owner" value="Demo user"></label>
        </div>
        <footer><button class="sc-button sc-button-quiet" value="cancel">Cancel</button><button class="sc-button sc-button-primary" value="default" data-sc-submit-create>Create</button></footer>
      </form>
    </dialog>`;
}

function renderItemDialog(manifest, data) {
  return `
    <dialog class="sc-dialog sc-item-dialog" data-sc-item-dialog>
      <form method="dialog">
        <header><div><span class="sc-section-kicker">${escapeHtml(manifest.domain.singular)}</span><h2 data-sc-item-dialog-title>Item</h2></div><button value="cancel" aria-label="Close">×</button></header>
        <div data-sc-item-dialog-body></div>
        <footer><button class="sc-button sc-button-quiet" value="cancel">Close</button><button class="sc-button sc-button-primary" value="default">Open full view</button></footer>
      </form>
    </dialog>`;
}

function renderActionConfirmationDialog() {
  return `
    <dialog class="sc-dialog sc-confirm-dialog" data-sc-confirm-dialog>
      <form method="dialog">
        <header><div><span class="sc-section-kicker">Confirmation required</span><h2 data-sc-confirm-title>Confirm action</h2></div><button value="cancel" aria-label="Close">×</button></header>
        <p data-sc-confirm-description>This action may be difficult to undo.</p>
        <footer><button class="sc-button sc-button-quiet" value="cancel">Cancel</button><button class="sc-button sc-button-danger" value="confirm" data-sc-confirm-submit>Confirm</button></footer>
      </form>
    </dialog>`;
}

export function normalizePreferences(input = {}) {
  const preferences = {};
  for (const key of Object.keys(PREFERENCE_VALUES)) {
    if (PREFERENCE_VALUES[key].has(input[key])) preferences[key] = input[key];
  }
  if (typeof input.palette === "string" && SAFE_ID.test(input.palette)) preferences.palette = input.palette;
  return Object.freeze(preferences);
}

export function createPreferenceStore(options = {}) {
  const key = options.key || "subjective-c:preferences@1";
  const legacyKey = options.legacyKey === false ? null : options.legacyKey || (options.key ? null : "subjective-c:preferences");
  let storage = options.storage;
  if (!storage && globalThis.window) {
    try { storage = globalThis.window.localStorage; } catch { storage = null; }
  }
  return Object.freeze({
    load() {
      try {
        const current = storage?.getItem(key);
        if (current) return normalizePreferences(JSON.parse(current));
        const legacy = legacyKey ? storage?.getItem(legacyKey) : null;
        if (!legacy) return normalizePreferences();
        const migrated = normalizePreferences(JSON.parse(legacy));
        storage?.setItem(key, JSON.stringify(migrated));
        storage?.removeItem(legacyKey);
        return migrated;
      } catch { return normalizePreferences(); }
    },
    save(preferences) {
      const normalized = normalizePreferences(preferences);
      try { storage?.setItem(key, JSON.stringify(normalized)); } catch {}
      return normalized;
    },
    clear() { try { storage?.removeItem(key); } catch {} }
  });
}

function themeStyle(variant, tokens = {}) {
  const declarations = [`--sc-hue:${Number(variant.theme.hue)}`, `--sc-radius:${Number(variant.theme.radius)}px`];
  for (const [id, value] of Object.entries(tokens || {})) {
    if (SAFE_ID.test(id) && (typeof value === "string" || typeof value === "number") && SAFE_TOKEN_VALUE.test(String(value))) {
      declarations.push(`--sc-${id}:${String(value)}`);
    }
  }
  return declarations.join(";");
}

function classToken(value, fallback) {
  const token = String(value ?? "");
  return token.length <= 64 && SAFE_ID.test(token) ? token : fallback;
}

export function renderSubjectiveMarkup(state) {
  const { manifest, variant, plan, data = {}, source = manifest?.source?.text || "", devtools = true, locked = false, cinemaMode = false } = state;
  if (!manifest || !variant) throw new Error("renderSubjectiveMarkup requires a manifest and variant.");
  if (plan && (plan.manifestHash !== manifest.source.hash || plan.variantId !== variant.id)) {
    throw new Error("The Subjective C plan does not match the manifest and variant.");
  }
  const preferences = normalizePreferences(state.preferences);
  const interpretation = interpretationMeta(variant);
  const style = themeStyle(variant, state.themeTokens);
  const sections = (plan?.sectionOrder || variant.composition.sections).map((name) => renderSection(name, manifest, data, variant)).join("");
  const shellClasses = [
    "sc-shell",
    `sc-layout-${classToken(variant.layout, "stacked")}`,
    `sc-density-${classToken(preferences.density || variant.density, "balanced")}`,
    `sc-palette-${classToken(preferences.contrast === "high" ? "high-contrast" : preferences.palette || variant.theme.palette, "neutral")}`,
    `sc-motion-${classToken(preferences.motion || variant.theme.motion, "subtle")}`,
    data?.adaptation?.enabled ? "sc-adaptive-mode" : "",
    cinemaMode ? "sc-cinema-mode" : "",
    devtools ? "sc-with-devtools" : ""
  ].filter(Boolean).join(" ");

  return `
    <div class="${escapeHtml(shellClasses)}" style="${escapeHtml(style)}" data-sc-variant="${escapeHtml(variant.id)}" data-sc-manifest="${escapeHtml(manifest.source.hash)}" data-sc-interpretation="${escapeHtml(interpretation.id)}">
      ${cinemaMode ? renderCinemaChrome(variant) : ""}
      ${renderExperienceChrome(variant)}
      <div class="sc-city-chrome" aria-hidden="true"><span>37.7749° N / 122.4194° W</span><strong>${escapeHtml(interpretation.symbol)}</strong><span>${escapeHtml(interpretation.location)} / LIVE</span></div>
      <div class="sc-backdrop" aria-hidden="true"><i></i><i></i><i></i><b></b></div>
      ${variant.navigation === "side" ? renderSidebar(manifest, variant) : ""}
      <div class="sc-app-frame">
        ${renderTopbar(manifest, variant)}
        <main class="sc-main">${sections}</main>
        <footer class="sc-app-footer"><span>SF / ${escapeHtml(interpretation.label)}</span><span>${escapeHtml(manifest.name)} · Intent compiled by Subjective C · ${escapeHtml(variant.id)}</span></footer>
      </div>
      ${devtools ? renderInspector(manifest, variant, source, { locked, inspectorOpen: state.inspectorOpen, preferences }) : ""}
      ${renderCreateDialog(manifest)}
      ${renderItemDialog(manifest, data)}
      ${renderActionConfirmationDialog()}
      <div class="sc-toast" role="status" aria-live="polite" data-sc-toast></div>
    </div>`;
}

function showToast(target, message) {
  const toast = target.querySelector("[data-sc-toast]");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toast.__timer);
  toast.__timer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function emitAction(target, detail) {
  const event = new CustomEvent("subjective:action", { bubbles: true, detail });
  target.dispatchEvent(event);
}

function openDialog(dialog) {
  if (!dialog) return;
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function confirmActionInDialog(target, contract) {
  const dialog = target.querySelector("[data-sc-confirm-dialog]");
  if (!dialog) return Promise.resolve(false);
  const confirmation = contract.confirmation || {};
  dialog.querySelector("[data-sc-confirm-title]").textContent = confirmation.title || `Confirm ${contract.label}`;
  dialog.querySelector("[data-sc-confirm-description]").textContent = confirmation.description || "This action may be difficult to undo.";
  dialog.querySelector("[data-sc-confirm-submit]").textContent = confirmation.confirmLabel || contract.label || "Confirm";
  openDialog(dialog);
  return new Promise((resolve) => {
    dialog.addEventListener("close", () => resolve(dialog.returnValue === "confirm"), { once: true });
  });
}

function updateSearch(target, value) {
  const query = String(value || "").trim().toLowerCase();
  const entries = [...target.querySelectorAll("[data-searchable]")];
  let visible = 0;
  for (const entry of entries) {
    const matches = !query || String(entry.getAttribute("data-searchable") || "").toLowerCase().includes(query);
    entry.hidden = !matches;
    if (matches) visible += 1;
  }
  const empty = target.querySelector("[data-sc-empty]");
  if (empty) empty.hidden = visible > 0;
}

function assertTarget(target, name) {
  if (!(target instanceof Element)) throw new Error(`${name} requires a DOM Element target.`);
}

export function mountSubjective(target, state) {
  assertTarget(target, "mountSubjective");
  const previousFocus = target.contains(document.activeElement)
    ? {
      action: document.activeElement.getAttribute?.("data-sc-action"),
      item: document.activeElement.getAttribute?.("data-sc-item"),
      search: document.activeElement.matches?.("[data-sc-search]") === true
    }
    : null;
  const previousScrollTop = target.scrollTop;
  target.innerHTML = renderSubjectiveMarkup(state);
  target.scrollTop = previousScrollTop;
  if (previousFocus) {
    const selector = previousFocus.action
      ? `[data-sc-action="${CSS.escape(previousFocus.action)}"]`
      : previousFocus.item
        ? `[data-sc-item="${CSS.escape(previousFocus.item)}"]`
        : previousFocus.search ? "[data-sc-search]" : null;
    if (selector) target.querySelector(selector)?.focus({ preventScroll: true });
  }
  return bindSubjective(target, state, { clearOnDestroy: true });
}

export function hydrateSubjective(target, state, options = {}) {
  assertTarget(target, "hydrateSubjective");
  if (!state?.manifest || !state?.variant) throw new Error("hydrateSubjective requires a manifest and variant.");
  if (state.plan && (state.plan.manifestHash !== state.manifest.source.hash || state.plan.variantId !== state.variant.id)) {
    throw new Error("The Subjective C plan does not match the manifest and variant.");
  }
  const shell = target.firstElementChild;
  const matches = shell?.classList.contains("sc-shell")
    && shell.getAttribute("data-sc-variant") === state.variant.id
    && shell.getAttribute("data-sc-manifest") === state.manifest.source.hash;
  if (!matches) {
    if (options.fallback === false) throw new Error("The server-rendered Subjective C markup does not match the current variant.");
    return mountSubjective(target, state);
  }
  return bindSubjective(target, state, { clearOnDestroy: false });
}

function bindSubjective(target, state, options = {}) {

  const callbacks = state.callbacks || {};
  const items = Array.isArray(state.data?.items) ? state.data.items : [];
  const allowedActions = new Map((state.plan?.actions || state.manifest.capabilities || []).map((action) => [action.id, action]));

  target.onclick = async (event) => {
    const element = event.target.closest("button, a, [data-sc-item]");
    if (!element || !target.contains(element)) return;

    const lensShift = element.closest("[data-sc-lens-shift]");
    if (lensShift) {
      callbacks.onInterpretationChange?.(shiftedInterpretation(state.variant, Number(lensShift.getAttribute("data-sc-lens-shift"))));
      return;
    }

    const cinemaStop = element.closest("[data-sc-cinema-stop]");
    if (cinemaStop) {
      callbacks.onInterpretationChange?.(cinemaStop.getAttribute("data-sc-cinema-stop"));
      return;
    }

    const intentPrompt = element.closest("[data-sc-intent-prompt]");
    if (intentPrompt) {
      callbacks.onVisitorSignal?.({ kind: "search", text: intentPrompt.getAttribute("data-sc-intent-prompt") });
      return;
    }

    if (element.matches("[data-sc-adaptation-reset]")) {
      callbacks.onAdaptationReset?.();
      return;
    }

    if (element.matches("[data-sc-cinema-enter]")) {
      document.documentElement.dataset.subjectiveCinema = "live";
      callbacks.onCinemaPhaseChange?.("live");
      return;
    }

    if (element.matches("[data-sc-cinema-autoplay]")) {
      callbacks.onCinemaAutoplay?.();
      return;
    }

    if (element.matches("[data-sc-cinema-exit]")) {
      callbacks.onCinemaExit?.();
      return;
    }

    if (element.matches("[data-sc-inspector-toggle]")) {
      const inspector = target.querySelector(".sc-inspector");
      const closed = inspector?.classList.toggle("is-closed") ?? false;
      callbacks.onInspectorChange?.(!closed);
      return;
    }

    if (element.matches("[data-sc-regenerate]")) {
      callbacks.onRegenerate?.();
      return;
    }

    if (element.matches("[data-sc-lock]")) {
      callbacks.onToggleLock?.();
      return;
    }

    if (element.matches("[data-sc-compile]")) {
      const source = target.querySelector("[data-sc-source]")?.value || "";
      callbacks.onCompile?.(source);
      return;
    }

    if (element.matches("[data-sc-focus-search]")) {
      const input = target.querySelector("[data-sc-search]");
      input?.focus();
      input?.select();
      return;
    }

    const nav = element.closest("[data-sc-nav]");
    if (nav) {
      target.querySelectorAll("[data-sc-nav]").forEach((entry) => entry.classList.toggle("is-active", entry.getAttribute("data-sc-nav") === nav.getAttribute("data-sc-nav")));
      return;
    }

    const itemElement = element.closest("[data-sc-item]");
    if (itemElement && (!element.matches("button") || element.matches("[data-sc-item-open]"))) {
      const item = items[Number(itemElement.getAttribute("data-sc-item"))];
      if (item) {
        callbacks.onVisitorSignal?.({ kind: "view", text: item.name, tags: item.tags || [] });
        const dialog = target.querySelector("[data-sc-item-dialog]");
        const title = dialog?.querySelector("[data-sc-item-dialog-title]");
        const body = dialog?.querySelector("[data-sc-item-dialog-body]");
        if (title) title.textContent = item.name;
        if (body) body.innerHTML = `
          <div class="sc-item-detail-status">${renderStatus(item.status)}<span>${escapeHtml(item.due || "No due date")}</span></div>
          <p>${escapeHtml(item.description || "No description yet.")}</p>
          ${renderTags(item.tags)}
          <div class="sc-item-detail-progress"><span>Progress</span><strong>${Number(item.progress || 0)}%</strong>${renderProgress(item.progress)}</div>`;
        openDialog(dialog);
        emitAction(target, { id: "open-item", kind: "navigate", item });
      }
      return;
    }

    const action = element.closest("[data-sc-action]");
    if (action) {
      const contract = allowedActions.get(action.getAttribute("data-sc-action"));
      if (!contract && action.getAttribute("data-sc-action") !== "inspect-signal") {
        showToast(target, "This action is not present in the trusted plan.");
        return;
      }
      const detail = {
        id: action.getAttribute("data-sc-action"),
        kind: action.getAttribute("data-sc-action-kind") || "custom",
        variant: state.variant.id,
        permission: contract?.permission ?? null,
        destructive: contract?.destructive === true,
        confirmation: contract?.confirmation ?? null
      };
      if (detail.permission) {
        let authorized = false;
        try {
          authorized = typeof callbacks.authorizeAction === "function" && await callbacks.authorizeAction(detail) === true;
        } catch (error) {
          callbacks.onActionError?.({ detail, error });
        }
        if (!authorized) {
          const denial = { ...detail, reason: "permission-denied" };
          target.dispatchEvent(new CustomEvent("subjective:action-denied", { bubbles: true, detail: denial }));
          callbacks.onActionDenied?.(denial);
          showToast(target, "You do not have permission to perform this action.");
          return;
        }
      }
      if (detail.destructive) {
        let confirmed = false;
        try {
          confirmed = typeof callbacks.confirmAction === "function"
            ? await callbacks.confirmAction(detail) === true
            : await confirmActionInDialog(target, contract);
        } catch (error) {
          callbacks.onActionError?.({ detail, error });
        }
        if (!confirmed) {
          callbacks.onActionDenied?.({ ...detail, reason: "confirmation-declined" });
          return;
        }
      }
      emitAction(target, detail);
      callbacks.onAction?.(detail);
      if (detail.kind === "create") {
        openDialog(target.querySelector("[data-sc-create-dialog]"));
      } else if (detail.kind === "search") {
        target.querySelector("[data-sc-search]")?.focus();
      } else if (detail.kind === "filter") {
        showToast(target, "Filter intent preserved. A production app would connect its own filter model.");
      } else {
        showToast(target, `${action.textContent.trim()} action emitted.`);
      }
    }
  };

  target.oninput = (event) => {
    if (event.target.matches("[data-sc-search]")) updateSearch(target, event.target.value);
    if (event.target.matches("[data-sc-novelty]")) {
      const output = event.target.closest("label")?.querySelector("output");
      if (output) output.textContent = `${Math.round(Number(event.target.value) * 100)}%`;
    }
  };

  target.onchange = (event) => {
    if (event.target.matches("[data-sc-interpretation]")) callbacks.onInterpretationChange?.(event.target.value || null);
    if (event.target.matches("[data-sc-experience]")) callbacks.onContextChange?.({ experience: event.target.value });
    if (event.target.matches("[data-sc-novelty]")) callbacks.onNoveltyChange?.(Number(event.target.value));
    if (event.target.matches("[data-sc-preference]")) {
      const key = event.target.getAttribute("data-sc-preference");
      const next = { ...normalizePreferences(state.preferences) };
      if (event.target.value) next[key] = event.target.value;
      else delete next[key];
      callbacks.onPreferenceChange?.(normalizePreferences(next));
    }
  };

  target.onkeydown = (event) => {
    const item = event.target.closest?.("[data-sc-item]");
    if (item && !event.target.closest?.("button, a, input, select, textarea") && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      item.click();
    }
  };

  const createForm = target.querySelector("[data-sc-create-form]");
  const intentForm = target.querySelector("[data-sc-intent-form]");
  const intentSubmitHandler = (event) => {
    event.preventDefault();
    const query = new FormData(intentForm).get("intent");
    if (String(query || "").trim()) callbacks.onVisitorSignal?.({ kind: "search", text: String(query).trim() });
  };
  intentForm?.addEventListener("submit", intentSubmitHandler);
  const createSubmitHandler = (event) => {
    const submitter = event.submitter;
    if (!submitter?.matches("[data-sc-submit-create]")) return;
    event.preventDefault();
    const values = Object.fromEntries(new FormData(createForm).entries());
    const nextItem = {
      name: values.name,
      description: values.description,
      status: values.status,
      owner: values.owner,
      progress: values.status === "Done" ? 100 : values.status === "In progress" ? 38 : 0,
      due: "Just added",
      tags: ["New"]
    };
    callbacks.onDataChange?.({ ...state.data, items: [nextItem, ...items] });
    createForm.closest("dialog")?.close();
  };
  createForm?.addEventListener("submit", createSubmitHandler);

  if (target.__subjectiveKeyHandler) window.removeEventListener("keydown", target.__subjectiveKeyHandler);
  target.__subjectiveKeyHandler = (event) => {
    const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      target.querySelector("[data-sc-search]")?.focus();
      return;
    }
    if (typing) return;
    if (event.key === "/") {
      event.preventDefault();
      target.querySelector("[data-sc-search]")?.focus();
    }
    if (event.key.toLowerCase() === "r") callbacks.onRegenerate?.();
    if (event.key.toLowerCase() === "n") target.querySelector('[data-sc-action-kind="create"]')?.click();
    if (event.key === "[") callbacks.onInterpretationChange?.(shiftedInterpretation(state.variant, -1));
    if (event.key === "]") callbacks.onInterpretationChange?.(shiftedInterpretation(state.variant, 1));
  };
  window.addEventListener("keydown", target.__subjectiveKeyHandler);

  if (target.__subjectivePointerHandler) window.removeEventListener("pointermove", target.__subjectivePointerHandler);
  target.__subjectivePointerHandler = (event) => {
    target.__subjectivePointer = { x: event.clientX, y: event.clientY };
    if (target.__subjectivePointerFrame) return;
    target.__subjectivePointerFrame = requestAnimationFrame(() => {
      target.style.setProperty("--sc-pointer-x", `${target.__subjectivePointer.x}px`);
      target.style.setProperty("--sc-pointer-y", `${target.__subjectivePointer.y}px`);
      target.classList.add("sc-pointer-active");
      target.__subjectivePointerFrame = null;
    });
  };
  window.addEventListener("pointermove", target.__subjectivePointerHandler, { passive: true });

  if (target.__subjectiveScrollHandler) window.removeEventListener("scroll", target.__subjectiveScrollHandler);
  target.__subjectiveScrollHandler = () => {
    const maximum = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    target.style.setProperty("--sc-scroll", String(Math.min(1, Math.max(0, window.scrollY / maximum))));
  };
  window.addEventListener("scroll", target.__subjectiveScrollHandler, { passive: true });
  target.__subjectiveScrollHandler();

  return {
    update(nextState) {
      return mountSubjective(target, nextState);
    },
    destroy() {
      if (target.__subjectiveKeyHandler) window.removeEventListener("keydown", target.__subjectiveKeyHandler);
      if (target.__subjectivePointerHandler) window.removeEventListener("pointermove", target.__subjectivePointerHandler);
      if (target.__subjectiveScrollHandler) window.removeEventListener("scroll", target.__subjectiveScrollHandler);
      if (target.__subjectivePointerFrame) cancelAnimationFrame(target.__subjectivePointerFrame);
      target.__subjectiveKeyHandler = null;
      target.__subjectivePointerHandler = null;
      target.__subjectiveScrollHandler = null;
      target.__subjectivePointerFrame = null;
      createForm?.removeEventListener("submit", createSubmitHandler);
      intentForm?.removeEventListener("submit", intentSubmitHandler);
      target.onclick = null;
      target.oninput = null;
      target.onchange = null;
      target.onkeydown = null;
      if (options.clearOnDestroy !== false) target.innerHTML = "";
    }
  };
}
