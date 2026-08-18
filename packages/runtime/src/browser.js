const STATUS_ORDER = ["Blocked", "In progress", "Review", "Planned", "Done"];
const PREFERENCE_VALUES = Object.freeze({
  density: new Set(["comfortable", "balanced", "compact"]),
  motion: new Set(["subtle", "expressive", "reduced"]),
  contrast: new Set(["standard", "high"])
});
const SAFE_ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const SAFE_TOKEN_VALUE = /^[^;{}<>]*$/;

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function slug(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
  return `
    <button class="sc-button sc-button-primary" type="button" data-sc-action="${escapeHtml(action.id)}" data-sc-action-kind="${escapeHtml(action.kind)}">
      <span aria-hidden="true">＋</span>
      <span>${escapeHtml(action.label)}</span>
      ${action.shortcut ? `<kbd>${escapeHtml(action.shortcut)}</kbd>` : ""}
    </button>`;
}

function renderTopbar(manifest, variant) {
  const search = getCapability(manifest, "search");
  return `
    <header class="sc-topbar">
      <div class="sc-topbar-left">
        ${variant.navigation === "top" ? renderLogo(manifest, true) : '<div class="sc-breadcrumb"><span>Workspace</span><b>/</b><strong>Overview</strong></div>'}
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
  return `
    <aside class="sc-sidebar">
      ${renderLogo(manifest)}
      ${renderNavigation(manifest, variant)}
      <div class="sc-sidebar-spacer"></div>
      <div class="sc-sidebar-note">
        <span class="sc-live-dot" aria-hidden="true"></span>
        <div><strong>Adaptive runtime</strong><small>Variant ${escapeHtml(variant.id)}</small></div>
      </div>
      <button class="sc-user-card" type="button">
        <span class="sc-avatar">DY</span>
        <span><strong>Demo user</strong><small>${escapeHtml(variant.context.experience)}</small></span>
        <span aria-hidden="true">•••</span>
      </button>
    </aside>`;
}

function renderHero(manifest, variant) {
  const tone = manifest.intent.tone.slice(0, 4);
  const goal = shortGoal(manifest.intent.goal, variant.composition.copyMode);
  const title = variant.composition.hero === "welcome"
    ? `${variant.context.experience === "novice" ? "Let’s get oriented" : "Good afternoon"}.`
    : manifest.name;

  if (variant.composition.hero === "compact") {
    return `
      <section class="sc-hero sc-hero-compact" id="overview">
        <div>
          <span class="sc-eyebrow">${escapeHtml(manifest.intent.audience[0])}</span>
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
          <span class="sc-eyebrow">Intent / ${escapeHtml(variant.context.experience)}</span>
          <h1>${escapeHtml(goal)}</h1>
          <div class="sc-intent-pills">${tone.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
        </div>
        <div class="sc-hero-orbit" aria-hidden="true"><i></i><i></i><i></i></div>
      </section>`;
  }

  return `
    <section class="sc-hero sc-hero-welcome" id="overview">
      <div class="sc-hero-copy">
        <span class="sc-eyebrow">A contextual interpretation for ${escapeHtml(variant.context.experience)} users</span>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(goal)}</p>
        ${variant.composition.copyMode === "explanatory" ? `<div class="sc-guidance"><span>↳</span> Start with the primary action or explore the work already in motion.</div>` : ""}
      </div>
      <div class="sc-hero-signal" aria-label="Current interpretation">
        <span>Interpretation</span>
        <strong>${escapeHtml(variant.id.replace("v-", "#"))}</strong>
        <small>${escapeHtml(variant.layout.replace(/-/g, " "))}</small>
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
  return `<span class="sc-status sc-status-${slug(status)}"><i aria-hidden="true"></i>${escapeHtml(status || "Unknown")}</span>`;
}

function renderProgress(value) {
  const number = Math.max(0, Math.min(100, Number(value || 0)));
  return `<div class="sc-progress" role="progressbar" aria-label="Progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${number}"><span style="width:${number}%"></span></div>`;
}

function renderTags(tags = []) {
  return `<div class="sc-tags">${tags.slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>`;
}

function itemSearchText(item) {
  return [item.name, item.status, item.owner, item.description, ...(item.tags || [])].filter(Boolean).join(" ");
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
          <span class="sc-section-kicker">Current workspace</span>
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
  return `
    <section class="sc-section sc-activity sc-activity-${escapeHtml(variant.composition.activity)}" id="activity">
      <header class="sc-section-header">
        <div><span class="sc-section-kicker">Signal</span><h2>Recent activity</h2></div>
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
  return `
    <section class="sc-section sc-insight">
      <div class="sc-insight-orb" aria-hidden="true"><span></span></div>
      <div>
        <span class="sc-section-kicker">Subjective signal</span>
        <h2>${escapeHtml(message)}</h2>
        <p>This summary is placed here because the current interpretation prioritizes attention over chronology.</p>
      </div>
      <button class="sc-button sc-button-quiet" type="button" data-sc-action="inspect-signal" data-sc-action-kind="custom">Inspect signal <span aria-hidden="true">→</span></button>
    </section>`;
}

function renderSection(name, manifest, data, variant) {
  if (name === "hero") return renderHero(manifest, variant);
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
          <strong>${escapeHtml(variant.id)}</strong>
          <div><code>${escapeHtml(variant.layout)}</code><code>${escapeHtml(variant.density)}</code><code>${escapeHtml(variant.composition.collection)}</code></div>
        </div>

        <section class="sc-control-group">
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

export function renderSubjectiveMarkup(state) {
  const { manifest, variant, plan, data = {}, source = manifest?.source?.text || "", devtools = true, locked = false } = state;
  if (!manifest || !variant) throw new Error("renderSubjectiveMarkup requires a manifest and variant.");
  if (plan && (plan.manifestHash !== manifest.source.hash || plan.variantId !== variant.id)) {
    throw new Error("The Subjective C plan does not match the manifest and variant.");
  }
  const preferences = normalizePreferences(state.preferences);
  const style = themeStyle(variant, state.themeTokens);
  const sections = (plan?.sectionOrder || variant.composition.sections).map((name) => renderSection(name, manifest, data, variant)).join("");
  const shellClasses = [
    "sc-shell",
    `sc-layout-${variant.layout}`,
    `sc-density-${preferences.density || variant.density}`,
    `sc-palette-${preferences.contrast === "high" ? "high-contrast" : preferences.palette || variant.theme.palette}`,
    `sc-motion-${preferences.motion || variant.theme.motion}`,
    devtools ? "sc-with-devtools" : ""
  ].filter(Boolean).join(" ");

  return `
    <div class="${shellClasses}" style="${style}" data-sc-variant="${escapeHtml(variant.id)}" data-sc-manifest="${escapeHtml(manifest.source.hash)}">
      <div class="sc-backdrop" aria-hidden="true"><i></i><i></i><i></i></div>
      ${variant.navigation === "side" ? renderSidebar(manifest, variant) : ""}
      <div class="sc-app-frame">
        ${renderTopbar(manifest, variant)}
        <main class="sc-main">${sections}</main>
        <footer class="sc-app-footer"><span>${escapeHtml(manifest.name)}</span><span>Intent compiled by Subjective C · ${escapeHtml(variant.id)}</span></footer>
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
  };
  window.addEventListener("keydown", target.__subjectiveKeyHandler);

  return {
    update(nextState) {
      return mountSubjective(target, nextState);
    },
    destroy() {
      if (target.__subjectiveKeyHandler) window.removeEventListener("keydown", target.__subjectiveKeyHandler);
      target.__subjectiveKeyHandler = null;
      createForm?.removeEventListener("submit", createSubmitHandler);
      target.onclick = null;
      target.oninput = null;
      target.onchange = null;
      target.onkeydown = null;
      if (options.clearOnDestroy !== false) target.innerHTML = "";
    }
  };
}
