(() => {
  "use strict";

  const DATA = window.KOWA_GUIDE;
  const CONFIG = window.KOWA_CONFIG || {};
  const APP_VERSION = "3.1.0";
  const STORAGE_KEY = "kowa.static.v1";
  const CLOCK_KEY = "kowa.static.clocks.v3";
  const ACTOR_KEY = "kowa.actor.v1";
  const VALID_TABS = new Set(["guide", "map", "focus", "squad", "settings"]);
  const SYNC_ROOTS = new Set([
    "mode",
    "progress",
    "notes",
    "favorites",
    "players",
    "sideQuest",
    "goal",
    "bossChecklist",
    "focusKey"
  ]);

  const DEFAULT_STATE = {
    version: 3,
    activeMap: null,
    mode: null,
    goal: "easter",
    tab: "guide",
    progress: {},
    notes: {},
    favorites: {},
    bossChecklist: {},
    players: 4,
    sideQuest: null,
    focusKey: null,
    activeZone: null,
    query: "",
    details: {},
    sectionOpen: {},
    showCompletedOnMap: false,
    squadCode: null,
    playerName: ""
  };

  let state = migrateState(loadJson(STORAGE_KEY, {}));
  let clocks = loadJson(CLOCK_KEY, {});
  let lamport = Math.max(0, ...Object.values(clocks).map((clock) => Number(clock?.n) || 0));
  let actorId = localStorage.getItem(ACTOR_KEY);
  let undoSnapshot = null;
  let undoTimer = null;
  let squad = null;
  let toastTimer = null;

  if (!actorId) {
    actorId = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
    localStorage.setItem(ACTOR_KEY, actorId);
  }

  saveState();

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : clone(fallback);
    } catch {
      return clone(fallback);
    }
  }

  function deepMerge(base, incoming) {
    if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
      return clone(base);
    }
    const output = clone(base);
    for (const [key, value] of Object.entries(incoming)) {
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        output[key] &&
        typeof output[key] === "object" &&
        !Array.isArray(output[key])
      ) {
        output[key] = deepMerge(output[key], value);
      } else {
        output[key] = value;
      }
    }
    return output;
  }

  function flattenLegacyStepMap(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) return {};
    const result = {};
    for (const [key, value] of Object.entries(input)) {
      if (key.includes(".")) {
        result[key] = value;
        continue;
      }
      if (value && typeof value === "object" && !Array.isArray(value)) {
        for (const [childKey, childValue] of Object.entries(value)) {
          result[`${key}.${childKey}`] = childValue;
        }
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  function migrateState(raw) {
    const migrated = deepMerge(DEFAULT_STATE, raw || {});
    migrated.progress = flattenLegacyStepMap(raw?.progress || migrated.progress);
    migrated.notes = flattenLegacyStepMap(raw?.notes || migrated.notes);
    migrated.favorites = flattenLegacyStepMap(raw?.favorites || migrated.favorites);
    migrated.details = flattenLegacyStepMap(raw?.details || migrated.details);
    migrated.bossChecklist = {
      ...DEFAULT_STATE.bossChecklist,
      ...(raw?.bossChecklist && typeof raw.bossChecklist === "object" ? raw.bossChecklist : {})
    };
    migrated.sectionOpen = {
      ...DEFAULT_STATE.sectionOpen,
      ...(raw?.sectionOpen && typeof raw.sectionOpen === "object" ? raw.sectionOpen : {})
    };
    if (raw?.openSection && migrated.sectionOpen[raw.openSection] === undefined) {
      migrated.sectionOpen[raw.openSection] = true;
    }
    migrated.players = [2, 3, 4].includes(Number(migrated.players)) ? Number(migrated.players) : 4;
    migrated.tab = VALID_TABS.has(migrated.tab) ? migrated.tab : "guide";
    if (!DATA?.goals?.some((goal) => goal.id === migrated.goal)) migrated.goal = "easter";
    migrated.version = 3;
    return migrated;
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(CLOCK_KEY, JSON.stringify(clocks));
  }

  function getAtPath(object, path) {
    return path.reduce((current, key) => current?.[key], object);
  }

  function setAtPath(object, path, value) {
    let current = object;
    for (let index = 0; index < path.length - 1; index += 1) {
      const key = path[index];
      if (!current[key] || typeof current[key] !== "object" || Array.isArray(current[key])) {
        current[key] = {};
      }
      current = current[key];
    }
    current[path[path.length - 1]] = value;
  }

  function clockKey(path) {
    return JSON.stringify(path);
  }

  function isNewerClock(incoming, existing) {
    if (!existing) return true;
    if (incoming.n !== existing.n) return incoming.n > existing.n;
    return String(incoming.actor) > String(existing.actor);
  }

  function shouldSync(path) {
    return SYNC_ROOTS.has(path[0]);
  }

  function localSet(path, value, options = {}) {
    const sync = options.sync ?? shouldSync(path);
    setAtPath(state, path, value);
    if (sync) {
      lamport += 1;
      const clock = { n: lamport, actor: actorId };
      clocks[clockKey(path)] = clock;
      squad?.sendOperation({ path, value, clock });
    }
    saveState();
  }

  function remoteSet(path, value, clock) {
    if (!Array.isArray(path) || !clock) return false;
    const key = clockKey(path);
    if (!isNewerClock(clock, clocks[key])) return false;
    lamport = Math.max(lamport, Number(clock.n) || 0);
    clocks[key] = clock;
    setAtPath(state, path, value);
    saveState();
    return true;
  }

  function ensureClock(path) {
    const key = clockKey(path);
    if (!clocks[key]) {
      lamport += 1;
      clocks[key] = { n: lamport, actor: actorId };
    }
  }

  function syncablePaths() {
    const paths = [
      ["mode"],
      ["players"],
      ["sideQuest"],
      ["goal"],
      ["focusKey"]
    ];
    for (const root of ["progress", "notes", "favorites", "bossChecklist"]) {
      for (const key of Object.keys(state[root] || {})) paths.push([root, key]);
    }
    return paths;
  }

  function makeSnapshot() {
    for (const path of syncablePaths()) ensureClock(path);
    saveState();
    return {
      version: 3,
      state: {
        mode: state.mode,
        players: state.players,
        sideQuest: state.sideQuest,
        goal: state.goal,
        focusKey: state.focusKey,
        progress: state.progress,
        notes: state.notes,
        favorites: state.favorites,
        bossChecklist: state.bossChecklist
      },
      clocks
    };
  }

  function captureFocus() {
    const active = document.activeElement;
    if (!active?.dataset?.focusId) return null;
    return {
      id: active.dataset.focusId,
      start: typeof active.selectionStart === "number" ? active.selectionStart : null,
      end: typeof active.selectionEnd === "number" ? active.selectionEnd : null
    };
  }

  function restoreFocus(snapshot) {
    if (!snapshot) return;
    requestAnimationFrame(() => {
      const target = document.querySelector(`[data-focus-id="${CSS.escape(snapshot.id)}"]`);
      if (!target) return;
      target.focus({ preventScroll: true });
      if (snapshot.start !== null && typeof target.setSelectionRange === "function") {
        target.setSelectionRange(snapshot.start, snapshot.end ?? snapshot.start);
      }
    });
  }

  function appendChildren(node, children) {
    for (const child of children.flat(Infinity)) {
      if (child === null || child === undefined || child === false) continue;
      node.append(child?.nodeType ? child : document.createTextNode(String(child)));
    }
  }

  function h(tag, attributes = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attributes || {})) {
      if (value === null || value === undefined || value === false) continue;
      if (key === "class" || key === "className") {
        node.className = value;
      } else if (key === "style" && typeof value === "object") {
        Object.assign(node.style, value);
      } else if (key === "dataset" && typeof value === "object") {
        Object.assign(node.dataset, value);
      } else if (key.startsWith("on") && typeof value === "function") {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (key === "value") {
        node.value = value;
      } else if (key === "checked") {
        node.checked = Boolean(value);
      } else if (key === "disabled") {
        node.disabled = Boolean(value);
      } else if (key === "text") {
        node.textContent = value;
      } else {
        node.setAttribute(key, value === true ? "" : String(value));
      }
    }
    appendChildren(node, children);
    return node;
  }

  function zoneMeta(zoneId) {
    return DATA.zoneMeta?.[zoneId] || {
      label: zoneId,
      short: zoneId,
      description: "Schematisch zugeordneter Questbereich."
    };
  }

  function currentMap() {
    return DATA.maps?.find((map) => map.id === state.activeMap) || null;
  }

  function visibleSections() {
    const map = currentMap();
    if (!map?.sections) return [];
    return state.mode === "neko" ? map.sections.filter((section) => section.neko) : map.sections;
  }

  function allSteps() {
    return visibleSections().flatMap((section) =>
      section.steps.map((step) => ({
        ...step,
        sectionId: section.id,
        sectionTitle: section.title,
        sectionGoals: section.goals || [],
        key: `${section.id}.${step.id}`
      }))
    );
  }

  function findStep(stepKey) {
    return allSteps().find((step) => step.key === stepKey) || null;
  }

  function currentStep() {
    return allSteps().find((step) => !state.progress[step.key]) || null;
  }

  function progressStats() {
    const steps = allSteps();
    const done = steps.filter((step) => Boolean(state.progress[step.key])).length;
    return {
      done,
      total: steps.length,
      percent: steps.length ? Math.round((done / steps.length) * 100) : 0
    };
  }

  function stepMatchesGoal(step) {
    if (state.goal === "completion") return true;
    const goals = step.goals || step.sectionGoals || [];
    return goals.includes(state.goal);
  }

  function usefulSteps() {
    const open = allSteps().filter((step) => !state.progress[step.key]);
    const matching = open.filter(stepMatchesGoal);
    const source = matching.length ? matching : open;
    return [...source]
      .sort((left, right) => {
        const leftFavorite = state.favorites[left.key] ? 1 : 0;
        const rightFavorite = state.favorites[right.key] ? 1 : 0;
        return rightFavorite - leftFavorite;
      })
      .slice(0, 3);
  }

  function render(options = {}) {
    const focusSnapshot = options.preserveFocus ? captureFocus() : null;
    const app = document.querySelector("#app");
    if (!app) return;
    app.replaceChildren();

    try {
      if (!DATA?.maps || !DATA?.zoneMeta || !DATA?.mapLayout) {
        throw new Error("Guide-Daten konnten nicht geladen werden.");
      }

      if (!state.activeMap) {
        app.append(renderMapSelection());
      } else if (!currentMap()?.available) {
        localSet(["activeMap"], null, { sync: false });
        app.append(renderMapSelection());
      } else if (!state.mode) {
        app.append(renderModeSelection());
      } else {
        app.append(renderApplication());
      }
    } catch (error) {
      console.error(error);
      app.append(renderFatalError(error));
    }

    restoreFocus(focusSnapshot);
  }

  function renderFatalError(error) {
    return h(
      "main",
      { class: "shell fatal-screen" },
      h("div", { class: "card card-pad" },
        h("div", { class: "eyebrow" }, "App-Fehler"),
        h("h1", {}, "Die Seite konnte nicht aufgebaut werden"),
        h("p", { class: "muted" }, error?.message || "Unbekannter Fehler"),
        h("button", {
          class: "btn primary block",
          onClick: () => location.reload()
        }, "Neu laden"),
        h("button", {
          class: "btn danger block top-gap",
          onClick: () => {
            if (!confirm("Lokale App-Einstellungen zurücksetzen?")) return;
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
          }
        }, "Lokale Einstellungen zurücksetzen")
      )
    );
  }

  function renderMapSelection() {
    const wrapper = h("main", { class: "shell onboarding-shell" });
    wrapper.append(
      h("section", { class: "hero card onboarding-hero" },
        h("div", { class: "eyebrow" }, "Mobile Squad Guide"),
        h("h1", {}, "Zombies Guide"),
        h("p", { class: "muted" }, "Wähle eine Karte. Fortschritt und Notizen bleiben auf diesem Gerät gespeichert.")
      )
    );

    const list = h("div", { class: "stack top-gap" });
    for (const map of DATA.maps) {
      list.append(
        h("button", {
          class: `card map-card ${map.available ? "" : "is-disabled"}`,
          disabled: !map.available,
          dataset: { mapId: map.id },
          onClick: () => {
            localSet(["activeMap"], map.id, { sync: false });
            render();
          }
        },
          h("div", { class: "section-title" },
            h("div", {},
              h("div", { class: "map-card-title" }, map.name),
              h("div", { class: "small muted" }, map.subtitle)
            ),
            !map.available ? h("span", { class: "pill" }, "Bald") : h("span", { class: "map-card-arrow" }, "→")
          )
        )
      );
    }
    wrapper.append(list);
    return wrapper;
  }

  function renderModeSelection() {
    const wrapper = h("main", { class: "shell onboarding-shell" });
    wrapper.append(
      h("button", {
        class: "btn ghost back-button",
        onClick: () => {
          localSet(["activeMap"], null, { sync: false });
          render();
        }
      }, "← Andere Map"),
      h("section", { class: "hero card onboarding-hero top-gap-small" },
        h("div", { class: "eyebrow" }, currentMap().name),
        h("h1", {}, "Modus wählen"),
        h("p", { class: "muted" }, "Der Modus kann später geändert werden, ohne den Fortschritt zu löschen.")
      )
    );

    const list = h("div", { class: "stack top-gap" });
    for (const mode of currentMap().modes || []) {
      list.append(
        h("button", {
          class: "btn primary block mode-button",
          dataset: { modeId: mode.id },
          onClick: () => {
            localSet(["mode"], mode.id);
            render();
          }
        },
          h("strong", {}, mode.name),
          h("span", {}, mode.description)
        )
      );
    }
    wrapper.append(list);
    return wrapper;
  }

  function renderApplication() {
    const stats = progressStats();
    const wrapper = h("div", { class: "app" });
    wrapper.append(renderHeader(stats));

    const main = h("main", { class: "shell main-content" });
    main.append(
      h("div", { class: "notice" },
        h("strong", {}, "Community-Guide: "),
        "Karte und Zonen sind eine schematische Quest-Navigation, kein exaktes Ingame-Levelbild. Inhalte können sich durch Updates ändern."
      )
    );

    const view = h("div", { class: "stack top-gap" });
    const current = currentStep();
    const renderers = {
      guide: () => renderGuideView(view, current),
      map: () => renderMapView(view, current),
      focus: () => renderFocusView(view, current),
      squad: () => renderSquadView(view),
      settings: () => renderSettingsView(view)
    };
    (renderers[state.tab] || renderers.guide)();
    main.append(view);
    wrapper.append(main, renderBottomNavigation(), renderLiveRegion());

    if (undoSnapshot) wrapper.append(renderUndoToast());
    return wrapper;
  }

  function renderHeader(stats) {
    return h("header", { class: "topbar" },
      h("div", { class: "shell" },
        h("div", { class: "topbar-row" },
          h("div", {},
            h("div", { class: "brand" }, "Kowakujō"),
            h("div", { class: "subbrand" }, state.mode === "neko" ? "Nur Nekomancer" : "Hauptquest")
          ),
          state.squadCode
            ? h("span", { class: `squad-status ${squad?.online ? "online" : ""}` },
                squad?.online ? "● " : "○ ", state.squadCode)
            : null
        ),
        h("div", { class: "progress-meta" },
          h("span", {}, `${stats.done} / ${stats.total} Schritte`),
          h("span", { class: "code" }, `${stats.percent}%`)
        ),
        h("div", {
          class: "progress",
          role: "progressbar",
          "aria-valuemin": "0",
          "aria-valuemax": "100",
          "aria-valuenow": String(stats.percent),
          "aria-label": "Quest-Fortschritt"
        }, h("span", { style: { width: `${stats.percent}%` } }))
      )
    );
  }

  function renderBottomNavigation() {
    const items = [
      ["guide", "☷", "Guide"],
      ["map", "⌖", "Karte"],
      ["focus", "◎", "Fokus"],
      ["squad", "👥", "Squad"],
      ["settings", "⚙", "Mehr"]
    ];
    const inner = h("div", { class: "bottom-nav-inner" });
    for (const [id, icon, label] of items) {
      inner.append(
        h("button", {
          class: `nav-btn ${state.tab === id ? "active" : ""}`,
          dataset: { tab: id },
          "aria-current": state.tab === id ? "page" : null,
          onClick: () => {
            localSet(["tab"], id, { sync: false });
            render();
          }
        },
          h("span", { class: "nav-icon", "aria-hidden": "true" }, icon),
          h("span", {}, label)
        )
      );
    }
    return h("nav", { class: "bottom-nav", "aria-label": "Hauptnavigation" }, inner);
  }

  function renderLiveRegion() {
    return h("div", { id: "live-region", class: "sr-only", "aria-live": "polite" });
  }

  function announce(message) {
    const region = document.querySelector("#live-region");
    if (!region) return;
    region.textContent = "";
    requestAnimationFrame(() => {
      region.textContent = message;
    });
  }

  function renderGuideView(view, current) {
    if (current) {
      view.append(
        h("button", {
          class: "hero card current-step-card",
          dataset: { currentStep: current.key },
          onClick: () => openFocus(current.key)
        },
          h("div", { class: "eyebrow" }, "Aktueller Schritt · Fokus öffnen"),
          h("h2", {}, current.title),
          h("p", { class: "muted small" }, current.description),
          renderInlineZones(current.zones || [])
        )
      );
    } else {
      view.append(renderCompletionCard());
    }

    view.append(renderGoalSelector(), renderUsefulSteps());

    const searchInput = h("input", {
      type: "search",
      value: state.query || "",
      placeholder: "Schritte, Notizen und Bereiche suchen…",
      dataset: { focusId: "guide-search", search: "guide" },
      "aria-label": "Guide durchsuchen",
      onInput: (event) => {
        localSet(["query"], event.target.value, { sync: false });
        render({ preserveFocus: true });
      }
    });
    const searchBox = h("label", { class: "search" },
      h("span", { "aria-hidden": "true" }, "⌕"),
      searchInput,
      state.query
        ? h("button", {
            type: "button",
            class: "search-clear",
            "aria-label": "Suche löschen",
            onClick: () => {
              localSet(["query"], "", { sync: false });
              render();
            }
          }, "×")
        : null
    );
    view.append(searchBox);

    if (state.mode !== "neko") view.append(renderSideQuestPanel());

    const query = (state.query || "").trim().toLocaleLowerCase("de");
    let visibleCount = 0;
    for (const section of visibleSections()) {
      const visibleSteps = section.steps.filter((step) => {
        if (!query) return true;
        const haystack = [
          section.title,
          section.subtitle,
          step.title,
          step.description,
          step.note,
          ...(step.zones || []).map((zoneId) => zoneMeta(zoneId).label)
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("de");
        return haystack.includes(query);
      });
      if (!visibleSteps.length) continue;
      visibleCount += visibleSteps.length;
      view.append(renderSectionCard(section, visibleSteps, current?.key || null, Boolean(query)));
    }

    if (query && visibleCount === 0) {
      view.append(
        h("section", { class: "card card-pad empty-state" },
          h("h2", {}, "Keine Treffer"),
          h("p", { class: "muted" }, `Für „${state.query}“ wurden keine Schritte oder Bereiche gefunden.`),
          h("button", {
            class: "btn block",
            onClick: () => {
              localSet(["query"], "", { sync: false });
              render();
            }
          }, "Suche zurücksetzen")
        )
      );
    }

    if (state.mode !== "neko" && ["easter", "completion"].includes(state.goal)) {
      view.append(renderBossChecklist());
    }
    view.append(renderFooter());
  }

  function renderGoalSelector() {
    const section = h("section", { class: "card card-pad" },
      h("div", { class: "eyebrow" }, "Run-Ziel"),
      h("p", { class: "small muted compact-copy" }, "Das Ziel steuert nur die Empfehlungen. Die vollständige Checkliste bleibt sichtbar.")
    );
    const grid = h("div", { class: "goal-grid" });
    for (const goal of DATA.goals || []) {
      const active = state.goal === goal.id;
      grid.append(
        h("button", {
          class: `goal-button ${active ? "active" : ""}`,
          dataset: { goalId: goal.id },
          "aria-pressed": String(active),
          onClick: () => {
            localSet(["goal"], goal.id);
            render();
          }
        },
          h("span", { class: "goal-icon", "aria-hidden": "true" }, goal.icon),
          h("span", { class: "goal-label" }, goal.label),
          h("span", { class: "goal-description" }, goal.description)
        )
      );
    }
    section.append(grid);
    return section;
  }

  function renderUsefulSteps() {
    const steps = usefulSteps();
    const section = h("section", { class: "card card-pad" },
      h("div", { class: "eyebrow" }, "Jetzt sinnvoll")
    );
    if (!steps.length) {
      section.append(h("p", { class: "muted compact-copy" }, "Für dieses Ziel sind keine offenen Schritte mehr vorhanden."));
      return section;
    }

    const list = h("div", { class: "useful-list" });
    for (const step of steps) {
      const row = h("div", { class: "useful-step" },
        h("button", {
          class: "useful-step-main",
          onClick: () => openFocus(step.key)
        },
          h("span", { class: "tiny muted" }, step.sectionTitle),
          h("strong", {}, step.title),
          h("span", { class: "small muted" }, step.description)
        ),
        step.zones?.[0]
          ? h("button", {
              class: "zone-jump",
              onClick: () => openZone(step.zones[0]),
              "aria-label": `${zoneMeta(step.zones[0]).label} auf der Karte öffnen`
            }, "⌖")
          : null
      );
      list.append(row);
    }
    section.append(list);
    return section;
  }

  function renderSideQuestPanel() {
    const selected = DATA.sideQuests?.find((quest) => quest.id === state.sideQuest) || null;
    const title = selected
      ? `${selected.icon} ${selected.label}`
      : state.sideQuest === "unknown"
        ? "Noch unbekannt"
        : "Welche Mission ist aktiv?";

    const section = h("section", { class: "card card-pad" },
      h("div", { class: "eyebrow" }, "Nebenmission"),
      h("h3", { class: "panel-title" }, title)
    );

    if (selected) {
      section.append(
        h("p", { class: "small muted" }, selected.note),
        h("div", { class: "button-row" },
          h("button", {
            class: "btn",
            onClick: () => openFocus("accomplice.sidequest")
          }, "Questschritt öffnen"),
          h("button", {
            class: "btn ghost",
            onClick: () => {
              localSet(["sideQuest"], null);
              render();
            }
          }, "Ändern")
        )
      );
      return section;
    }

    const grid = h("div", { class: "sidequest-grid" });
    for (const quest of DATA.sideQuests || []) {
      grid.append(
        h("button", {
          class: "sidequest-button",
          onClick: () => {
            localSet(["sideQuest"], quest.id);
            render();
          }
        },
          h("span", { class: "sidequest-icon", "aria-hidden": "true" }, quest.icon),
          h("span", {}, quest.label)
        )
      );
    }
    grid.append(
      h("button", {
        class: `sidequest-button wide ${state.sideQuest === "unknown" ? "active" : ""}`,
        onClick: () => {
          localSet(["sideQuest"], "unknown");
          render();
        }
      }, "Noch unbekannt – später auswählen")
    );
    section.append(grid);
    return section;
  }

  function renderSectionCard(section, steps, currentKey, forceOpen) {
    const done = section.steps.filter((step) => state.progress[`${section.id}.${step.id}`]).length;
    const percent = Math.round((done / section.steps.length) * 100);
    const containsCurrent = steps.some((step) => `${section.id}.${step.id}` === currentKey);
    const explicit = state.sectionOpen[section.id];
    const open = forceOpen || (explicit === undefined ? containsCurrent : explicit);

    const bodyId = `section-${section.id}-body`;
    const body = h("div", {
      id: bodyId,
      class: `steps ${open ? "" : "hidden"}`
    });
    for (const step of steps) body.append(renderStepRow(section, step, currentKey));

    return h("section", { class: "section" },
      h("button", {
        class: "section-head",
        "aria-expanded": String(open),
        "aria-controls": bodyId,
        onClick: () => {
          localSet(["sectionOpen", section.id], !open, { sync: false });
          render();
        }
      },
        h("div", { class: "section-title" },
          h("div", {},
            h("div", { class: "section-heading" }, section.title),
            h("div", { class: "small muted" }, section.subtitle || "")
          ),
          h("div", { class: "section-count" },
            h("span", { class: "code tiny" }, `${done}/${section.steps.length}`),
            h("span", { class: "chevron", "aria-hidden": "true" }, open ? "⌃" : "⌄")
          )
        ),
        h("div", { class: "section-bar" }, h("span", { style: { width: `${percent}%` } }))
      ),
      body
    );
  }

  function renderStepRow(section, step, currentKey) {
    const key = `${section.id}.${step.id}`;
    const done = Boolean(state.progress[key]);
    const favorite = Boolean(state.favorites[key]);
    const detailsOpen = Boolean(state.details[key]);
    const detailsId = `details-${key.replaceAll(".", "-")}`;

    const article = h("article", {
      class: `step ${done ? "done" : ""} ${key === currentKey ? "current" : ""}`,
      dataset: { stepKey: key }
    });

    article.append(
      h("button", {
        class: `check ${done ? "done" : ""}`,
        dataset: { stepCheck: key },
        "aria-label": done ? `${step.title} wieder öffnen` : `${step.title} als erledigt markieren`,
        "aria-pressed": String(done),
        onClick: () => toggleStep(key)
      }, done ? "✓" : ""),
      h("button", {
        class: "step-main",
        dataset: { stepMain: key },
        "aria-expanded": String(detailsOpen),
        "aria-controls": detailsId,
        onClick: () => {
          localSet(["details", key], !detailsOpen, { sync: false });
          render();
        }
      },
        h("span", { class: "step-title" }, step.title),
        h("span", { class: "step-desc" }, step.description),
        h("span", { class: "step-details-label" }, detailsOpen ? "Weniger anzeigen" : "Details, Karte und Notiz")
      ),
      h("button", {
        class: `icon-btn ${favorite ? "active" : ""}`,
        "aria-label": favorite ? `${step.title} aus Favoriten entfernen` : `${step.title} als Favorit markieren`,
        "aria-pressed": String(favorite),
        onClick: () => {
          localSet(["favorites", key], !favorite);
          render();
        }
      }, favorite ? "★" : "☆")
    );

    if (detailsOpen) article.append(renderStepDetails(step, key, detailsId));
    return article;
  }

  function renderStepDetails(step, key, detailsId) {
    const details = h("div", { id: detailsId, class: "details" });
    if (step.zones?.length) {
      details.append(
        h("div", {},
          h("div", { class: "tiny muted details-label" }, "Zugeordnete Bereiche"),
          renderZoneButtons(step.zones)
        )
      );
    }
    if (step.roles) {
      details.append(
        h("div", { class: "small muted" },
          `Empfohlene Squad-Beteiligung: ${Math.min(step.roles, state.players)} Spieler`
        )
      );
    }
    if (step.note) {
      details.append(
        h("label", { class: "note-field" },
          h("span", { class: "tiny muted details-label" }, step.note),
          h("textarea", {
            class: "note",
            value: state.notes[key] || "",
            placeholder: step.note,
            dataset: { focusId: `note-${key}` },
            onInput: (event) => localSet(["notes", key], event.target.value)
          })
        )
      );
    }
    details.append(
      h("button", {
        class: "btn block",
        onClick: () => openFocus(key)
      }, "Im Fokusmodus öffnen")
    );
    return details;
  }

  function renderInlineZones(zoneIds) {
    if (!zoneIds.length) return null;
    return h("div", { class: "inline-zones" },
      ...zoneIds.map((zoneId) => h("span", { class: "pill" }, zoneMeta(zoneId).short))
    );
  }

  function renderZoneButtons(zoneIds) {
    return h("div", { class: "zone-pills" },
      ...zoneIds.map((zoneId) =>
        h("button", {
          class: "pill zone-pill-button",
          onClick: () => openZone(zoneId)
        }, `⌖ ${zoneMeta(zoneId).label}`)
      )
    );
  }

  function toggleStep(stepKey, options = {}) {
    const before = Boolean(state.progress[stepKey]);
    undoSnapshot = { key: stepKey, value: before, title: findStep(stepKey)?.title || "Schritt" };
    clearTimeout(undoTimer);
    undoTimer = setTimeout(() => {
      undoSnapshot = null;
      render();
    }, 6000);
    localSet(["progress", stepKey], !before);
    if (!options.silent) announce(before ? "Schritt wieder geöffnet" : "Schritt erledigt");
    render();
  }

  function undo() {
    if (!undoSnapshot) return;
    localSet(["progress", undoSnapshot.key], undoSnapshot.value);
    announce(`${undoSnapshot.title}: Änderung rückgängig`);
    undoSnapshot = null;
    clearTimeout(undoTimer);
    render();
  }

  function renderUndoToast() {
    return h("div", { class: "toast", role: "status" },
      h("span", {}, undoSnapshot.value ? "Schritt wieder geöffnet" : "Schritt erledigt"),
      h("button", { class: "toast-action", onClick: undo }, "Rückgängig")
    );
  }

  function openFocus(stepKey) {
    if (!findStep(stepKey)) return;
    localSet(["focusKey"], stepKey);
    localSet(["tab"], "focus", { sync: false });
    render();
  }

  function openZone(zoneId) {
    if (!DATA.zoneMeta[zoneId]) return;
    localSet(["activeZone"], zoneId, { sync: false });
    localSet(["tab"], "map", { sync: false });
    render();
  }

  function renderFocusView(view, current) {
    const steps = allSteps();
    if (!steps.length) {
      view.append(h("section", { class: "card card-pad empty-state" }, "Keine Schritte vorhanden."));
      return;
    }

    if (!current && !state.focusKey) {
      view.append(renderCompletionCard());
      return;
    }

    let index = steps.findIndex((step) => step.key === (state.focusKey || current?.key));
    if (index < 0) index = Math.max(0, steps.findIndex((step) => !state.progress[step.key]));
    const step = steps[index];
    const done = Boolean(state.progress[step.key]);

    view.append(
      h("div", { class: "focus-actions" },
        h("button", {
          class: "btn",
          disabled: index === 0,
          onClick: () => {
            localSet(["focusKey"], steps[index - 1].key);
            render();
          }
        }, "← Vorher"),
        h("span", { class: "code tiny" }, `${index + 1}/${steps.length}`),
        h("button", {
          class: "btn",
          disabled: index === steps.length - 1,
          onClick: () => {
            localSet(["focusKey"], steps[index + 1].key);
            render();
          }
        }, "Weiter →")
      ),
      h("section", { class: "hero card focus-card" },
        h("div", { class: "eyebrow" }, step.sectionTitle),
        h("div", { class: "focus-title-row" },
          h("h1", { class: "focus-title" }, step.title),
          h("button", {
            class: `icon-btn focus-favorite ${state.favorites[step.key] ? "active" : ""}`,
            "aria-label": state.favorites[step.key] ? "Favorit entfernen" : "Als Favorit markieren",
            onClick: () => {
              localSet(["favorites", step.key], !state.favorites[step.key]);
              render();
            }
          }, state.favorites[step.key] ? "★" : "☆")
        ),
        h("p", { class: "muted focus-copy" }, step.description)
      )
    );

    if (step.zones?.length) {
      view.append(
        h("section", { class: "card card-pad" },
          h("div", { class: "eyebrow" }, "Karte"),
          h("p", { class: "small muted compact-copy" }, "Bereich antippen, um ihn in der Zonenkarte zu öffnen."),
          renderZoneButtons(step.zones)
        )
      );
    }

    if (step.roles) {
      view.append(
        h("section", { class: "card card-pad" },
          h("div", { class: "eyebrow" }, "Squad"),
          h("p", { class: "compact-copy" }, `${Math.min(step.roles, state.players)} Spieler einplanen.`)
        )
      );
    }

    if (step.note) {
      view.append(
        h("section", { class: "card card-pad" },
          h("label", { class: "note-field" },
            h("span", { class: "eyebrow" }, step.note),
            h("textarea", {
              class: "note focus-note",
              value: state.notes[step.key] || "",
              placeholder: step.note,
              dataset: { focusId: `focus-note-${step.key}` },
              onInput: (event) => localSet(["notes", step.key], event.target.value)
            })
          )
        )
      );
    }

    view.append(
      h("button", {
        class: `btn block focus-complete ${done ? "" : "primary"}`,
        dataset: { focusComplete: step.key },
        onClick: () => {
          if (done) {
            toggleStep(step.key, { silent: true });
            localSet(["focusKey"], step.key);
            announce("Schritt wieder geöffnet");
            render();
            return;
          }

          toggleStep(step.key, { silent: true });
          const refreshedSteps = allSteps();
          const nextOpen = refreshedSteps.slice(index + 1).find((candidate) => !state.progress[candidate.key])
            || refreshedSteps.find((candidate) => !state.progress[candidate.key]);
          localSet(["focusKey"], nextOpen?.key || null);
          announce(nextOpen ? `Weiter mit ${nextOpen.title}` : "Checkliste abgeschlossen");
          render();
        }
      }, done ? "↺ Wieder öffnen" : "✓ Erledigt → weiter")
    );

    if (!current) view.append(renderCompletionCard());
  }

  function renderCompletionCard() {
    return h("section", { class: "card complete" },
      h("div", { class: "complete-icon", "aria-hidden": "true" }, "✓"),
      h("h2", {}, "Checkliste abgeschlossen"),
      h("p", { class: "muted" }, "Alle Schritte dieses Modus sind abgehakt."),
      h("button", {
        class: "btn",
        onClick: () => {
          localSet(["tab"], "guide", { sync: false });
          localSet(["focusKey"], null);
          render();
        }
      }, "Zur Übersicht")
    );
  }

  function renderMapView(view, current) {
    const layout = DATA.mapLayout || [];
    const validZones = new Set(layout.map((zone) => zone.id));
    const selectedZone = validZones.has(state.activeZone)
      ? state.activeZone
      : current?.zones?.find((zoneId) => validZones.has(zoneId)) || layout[0]?.id;
    const currentZones = new Set(current?.zones || []);
    const all = allSteps();

    const board = h("div", {
      class: "map-board",
      role: "group",
      "aria-label": "Schematische Kowakujō-Zonenkarte"
    },
      h("div", { class: "map-level-label map-level-inner" }, "INNERER KERN"),
      h("div", { class: "map-level-label map-level-outer" }, "AUSSENBEREICH"),
      h("div", { class: "map-route route-main", "aria-hidden": "true" }),
      h("div", { class: "map-route route-left", "aria-hidden": "true" }),
      h("div", { class: "map-route route-right", "aria-hidden": "true" })
    );

    for (const zone of layout) {
      const zoneSteps = all.filter((step) => step.zones?.includes(zone.id));
      const openCount = zoneSteps.filter((step) => !state.progress[step.key]).length;
      const meta = zoneMeta(zone.id);
      board.append(
        h("button", {
          class: [
            "map-zone",
            selectedZone === zone.id ? "active" : "",
            currentZones.has(zone.id) ? "current" : "",
            openCount ? "has-open" : "complete"
          ].filter(Boolean).join(" "),
          style: {
            left: `${zone.x}%`,
            top: `${zone.y}%`,
            width: `${zone.w}%`,
            height: `${zone.h}%`
          },
          dataset: { zoneId: zone.id },
          "aria-pressed": String(selectedZone === zone.id),
          "aria-label": `${meta.label}, ${openCount} offene Schritte`,
          onClick: () => {
            localSet(["activeZone"], zone.id, { sync: false });
            render();
          }
        },
          h("span", { class: "map-zone-name" }, meta.short),
          h("span", { class: "map-zone-count" }, openCount ? String(openCount) : "✓")
        )
      );
    }

    view.append(
      h("section", { class: "card map-section" },
        h("div", { class: "map-header" },
          h("div", {},
            h("div", { class: "eyebrow" }, "Zonenkarte"),
            h("h2", { class: "panel-title" }, "Kowakujō – schematische Quest-Navigation")
          ),
          h("div", { class: "map-legend" },
            h("span", {}, h("i", { class: "legend-dot current" }), " aktueller Schritt"),
            h("span", {}, h("i", { class: "legend-dot selected" }), " ausgewählt")
          )
        ),
        board,
        h("p", { class: "map-disclaimer" }, "Die Anordnung zeigt eine logische Route vom Outer Ward zum inneren Sanctum. Sie ist bewusst kein maßstabgetreuer Grundriss.")
      )
    );

    const chipGrid = h("div", { class: "zone-chip-grid", "aria-label": "Alle Kartenbereiche" });
    for (const zone of layout) {
      const meta = zoneMeta(zone.id);
      chipGrid.append(
        h("button", {
          class: `zone-chip ${selectedZone === zone.id ? "active" : ""}`,
          onClick: () => {
            localSet(["activeZone"], zone.id, { sync: false });
            render();
          }
        }, meta.label)
      );
    }
    view.append(chipGrid);

    if (selectedZone) view.append(renderZonePanel(selectedZone));
  }

  function renderZonePanel(zoneId) {
    const meta = zoneMeta(zoneId);
    const steps = allSteps()
      .filter((step) => step.zones?.includes(zoneId))
      .sort((left, right) => Number(Boolean(state.progress[left.key])) - Number(Boolean(state.progress[right.key])));
    const visibleSteps = state.showCompletedOnMap
      ? steps
      : steps.filter((step) => !state.progress[step.key]);
    const openCount = steps.filter((step) => !state.progress[step.key]).length;

    const section = h("section", { class: "card card-pad zone-panel" },
      h("div", { class: "section-title" },
        h("div", {},
          h("div", { class: "eyebrow" }, "Ausgewählter Bereich"),
          h("h2", { class: "panel-title" }, meta.label)
        ),
        h("span", { class: "pill" }, `${openCount} offen`)
      ),
      h("p", { class: "small muted" }, meta.description),
      h("label", { class: "map-filter" },
        h("input", {
          type: "checkbox",
          checked: state.showCompletedOnMap,
          onChange: (event) => {
            localSet(["showCompletedOnMap"], event.target.checked, { sync: false });
            render();
          }
        }),
        h("span", {}, "Erledigte Schritte ebenfalls anzeigen")
      )
    );

    const list = h("div", { class: "zone-step-list" });
    if (!visibleSteps.length) {
      list.append(
        h("div", { class: "empty-state compact" },
          h("strong", {}, openCount ? "Keine sichtbaren Schritte" : "Bereich erledigt"),
          h("span", { class: "small muted" },
            openCount ? "Aktiviere den Filter für erledigte Schritte." : "In diesem Bereich sind keine offenen Schritte mehr.")
        )
      );
    }

    for (const step of visibleSteps) {
      const done = Boolean(state.progress[step.key]);
      list.append(
        h("article", { class: `zone-step ${done ? "done" : ""}` },
          h("button", {
            class: "zone-step-main",
            dataset: { zoneStep: step.key },
            onClick: () => openFocus(step.key)
          },
            h("span", { class: "tiny muted" }, step.sectionTitle),
            h("strong", {}, step.title),
            h("span", { class: "small muted" }, step.description)
          ),
          h("button", {
            class: `check mini ${done ? "done" : ""}`,
            "aria-label": done ? `${step.title} wieder öffnen` : `${step.title} als erledigt markieren`,
            onClick: () => toggleStep(step.key)
          }, done ? "✓" : "")
        )
      );
    }
    section.append(list);
    return section;
  }

  function renderBossChecklist() {
    const items = DATA.bossChecklist || [];
    const done = items.filter((item) => state.bossChecklist[item.id]).length;
    const section = h("section", { class: "card card-pad" },
      h("div", { class: "section-title" },
        h("div", {},
          h("div", { class: "eyebrow" }, "Boss-Vorbereitung"),
          h("h2", { class: "panel-title" }, "Allgemeiner Ready-Check")
        ),
        h("span", { class: "code tiny" }, `${done}/${items.length}`)
      ),
      h("p", { class: "small muted" }, "Allgemeine Vorbereitung – konkrete Anforderungen im aktuellen Spielstand prüfen.")
    );
    const list = h("div", { class: "checklist" });
    for (const item of items) {
      const checked = Boolean(state.bossChecklist[item.id]);
      list.append(
        h("button", {
          class: `checklist-item ${checked ? "done" : ""}`,
          "aria-pressed": String(checked),
          onClick: () => {
            localSet(["bossChecklist", item.id], !checked);
            render();
          }
        },
          h("span", { class: "checklist-box" }, checked ? "✓" : ""),
          h("span", {}, item.label)
        )
      );
    }
    section.append(list);
    return section;
  }

  function renderSquadView(view) {
    const configured = Boolean(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey);
    const panel = h("section", { class: "card card-pad" },
      h("div", { class: "eyebrow" }, "Online-Squad")
    );

    if (!configured) {
      panel.append(
        h("p", { class: "small muted" }, "Die App funktioniert vollständig lokal. Für Raumcodes müssen Supabase-URL und Publishable/Anon Key in config.js eingetragen werden."),
        h("pre", { class: "notice code config-example" }, 'window.KOWA_CONFIG = {\n  supabaseUrl: "…",\n  supabaseAnonKey: "…"\n};')
      );
      view.append(panel, renderAssignments());
      return;
    }

    if (!state.squadCode) {
      const nameInput = h("input", {
        class: "text-input",
        value: state.playerName || "",
        placeholder: "Dein Name",
        maxlength: "24",
        dataset: { focusId: "squad-name" },
        onInput: (event) => localSet(["playerName"], event.target.value, { sync: false })
      });
      const codeInput = h("input", {
        class: "text-input code",
        placeholder: "RAUMCODE",
        maxlength: "8",
        autocapitalize: "characters",
        dataset: { focusId: "squad-code" }
      });
      panel.append(
        h("p", { class: "small muted" }, "Raum erstellen oder einem bestehenden Code beitreten. Kein Login nötig."),
        nameInput,
        h("div", { class: "button-row top-gap-small" },
          h("button", {
            class: "btn primary",
            onClick: () => connectSquad(randomRoomCode(), true)
          }, "Squad erstellen"),
          h("button", {
            class: "btn",
            onClick: () => connectSquad(codeInput.value, false)
          }, "Beitreten")
        ),
        codeInput
      );
    } else {
      panel.append(
        h("div", { class: "room-row" },
          h("div", { class: "room-code code" }, state.squadCode),
          h("span", { class: `squad-status ${squad?.online ? "online" : ""}` }, squad?.online ? "● Online" : "○ Verbinden…")
        ),
        h("div", { class: "button-row top-gap-small" },
          h("button", { class: "btn", onClick: shareRoom }, "Link teilen"),
          h("button", { class: "btn danger", onClick: leaveSquad }, "Session verlassen")
        )
      );
      if (squad?.members?.length) {
        panel.append(
          h("div", { class: "member-list" },
            h("div", { class: "tiny muted" }, `Teilnehmer (${squad.members.length})`),
            ...squad.members.map((member) => h("span", { class: "member-chip" }, member.name))
          )
        );
      }
    }
    view.append(panel, renderAssignments());
  }

  function renderAssignments() {
    const playerNames = Array.from({ length: state.players }, (_, index) =>
      squad?.members?.[index]?.name || `Spieler ${index + 1}`
    );
    const assignments = playerNames.map((name) => ({ name, tasks: [] }));
    const tasks = allSteps().filter((step) => !state.progress[step.key] && step.roles);
    tasks.forEach((step, taskIndex) => {
      const count = Math.min(step.roles, state.players);
      for (let index = 0; index < count; index += 1) {
        assignments[(taskIndex + index) % assignments.length].tasks.push(step);
      }
    });

    const section = h("section", { class: "card card-pad" },
      h("div", { class: "section-title" },
        h("div", {},
          h("div", { class: "eyebrow" }, "Squad-Aufteilung"),
          h("p", { class: "small muted compact-copy" }, "Vorschlag für offene Aufgaben mit Rollenbedarf")
        ),
        h("div", { class: "player-control" },
          ...[2, 3, 4].map((count) =>
            h("button", {
              class: `player-button ${state.players === count ? "active" : ""}`,
              "aria-pressed": String(state.players === count),
              onClick: () => {
                localSet(["players"], count);
                render();
              }
            }, String(count))
          )
        )
      )
    );

    const grid = h("div", { class: "assignment-grid" });
    assignments.forEach((assignment, index) => {
      grid.append(
        h("article", { class: "assignment-card" },
          h("strong", {}, assignment.name),
          assignment.tasks.length
            ? h("ul", {}, ...assignment.tasks.slice(0, 5).map((step) =>
                h("li", {}, h("button", { onClick: () => openFocus(step.key) }, step.title))
              ))
            : h("p", { class: "tiny muted" }, "Keine offenen Rollen-Aufgaben"),
          assignment.tasks.length > 5
            ? h("span", { class: "tiny muted" }, `+${assignment.tasks.length - 5} weitere`)
            : null
        )
      );
    });
    section.append(grid);
    return section;
  }

  async function connectSquad(rawCode, createRoom) {
    const code = String(rawCode || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 8);
    if (!code) {
      showToast("Bitte einen Raumcode eingeben.");
      return;
    }
    localSet(["squadCode"], code, { sync: false });
    await initializeSquad(code);
    if (createRoom) squad?.broadcastSnapshot();
    render();
  }

  function leaveSquad() {
    squad?.close();
    squad = null;
    localSet(["squadCode"], null, { sync: false });
    render();
  }

  function randomRoomCode() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  }

  async function shareRoom() {
    const url = new URL(location.href);
    url.searchParams.set("squad", state.squadCode);
    try {
      if (navigator.share) {
        await navigator.share({ title: DATA.appName, url: url.href });
      } else {
        await copyText(url.href);
        showToast("Squad-Link kopiert.");
      }
    } catch (error) {
      if (error?.name !== "AbortError") showToast("Teilen war nicht möglich.");
    }
  }

  function renderSettingsView(view) {
    view.append(
      h("section", { class: "card card-pad" },
        h("div", { class: "eyebrow" }, "Navigation"),
        h("div", { class: "button-grid top-gap-small" },
          h("button", {
            class: "btn",
            onClick: () => {
              localSet(["activeMap"], null, { sync: false });
              localSet(["mode"], null);
              render();
            }
          }, "Andere Map"),
          h("button", {
            class: "btn",
            onClick: () => {
              localSet(["mode"], null);
              render();
            }
          }, "Modus wechseln"),
          h("button", {
            class: "btn",
            onClick: () => {
              localSet(["activeZone"], null, { sync: false });
              localSet(["tab"], "map", { sync: false });
              render();
            }
          }, "Karte zentrieren")
        )
      ),
      renderNotesIndex(),
      renderImportExport(),
      h("section", { class: "card card-pad" },
        h("div", { class: "eyebrow" }, "iPhone & Offline"),
        h("p", { class: "small muted" }, "In Safari: Teilen → Zum Home-Bildschirm. Die App-Shell und gespeicherten Daten funktionieren danach auch offline."),
        h("button", { class: "btn block", onClick: refreshApplicationCache }, "Neue App-Version laden")
      ),
      h("section", { class: "card card-pad danger-section" },
        h("div", { class: "eyebrow" }, "Zurücksetzen"),
        h("button", {
          class: "btn danger block",
          onClick: () => {
            if (!confirm("Gesamten lokalen Fortschritt, Notizen und Einstellungen löschen?")) return;
            squad?.close();
            squad = null;
            state = clone(DEFAULT_STATE);
            clocks = {};
            lamport = 0;
            saveState();
            render();
          }
        }, "Lokale Daten löschen")
      ),
      h("p", { class: "version-label" }, `App-Version ${APP_VERSION} · Daten-Version ${DATA.version}`),
      renderFooter()
    );
  }

  function renderNotesIndex() {
    const notedSteps = allSteps().filter((step) => step.note);
    const section = h("section", { class: "card card-pad" },
      h("div", { class: "eyebrow" }, "Quest-Notizen")
    );
    if (!notedSteps.length) {
      section.append(h("p", { class: "small muted" }, "Für diesen Modus sind keine Notizfelder vorhanden."));
      return section;
    }
    const list = h("div", { class: "notes-index" });
    for (const step of notedSteps) {
      list.append(
        h("label", { class: "note-field" },
          h("span", { class: "tiny muted details-label" }, `${step.note} · ${step.title}`),
          h("input", {
            class: "text-input",
            value: state.notes[step.key] || "",
            placeholder: step.note,
            dataset: { focusId: `settings-note-${step.key}` },
            onInput: (event) => localSet(["notes", step.key], event.target.value)
          })
        )
      );
    }
    section.append(list);
    return section;
  }

  function exportPayload() {
    return {
      schemaVersion: 3,
      exportedAt: new Date().toISOString(),
      activeMap: state.activeMap,
      mode: state.mode,
      goal: state.goal,
      progress: state.progress,
      notes: state.notes,
      favorites: state.favorites,
      bossChecklist: state.bossChecklist,
      players: state.players,
      sideQuest: state.sideQuest
    };
  }

  function renderImportExport() {
    const importArea = h("textarea", {
      class: "note import-area",
      placeholder: "Export-Code hier einfügen…",
      dataset: { focusId: "import-data" }
    });
    return h("section", { class: "card card-pad" },
      h("div", { class: "eyebrow" }, "Sichern & übertragen"),
      h("div", { class: "button-grid top-gap-small" },
        h("button", {
          class: "btn",
          onClick: async () => {
            await copyText(JSON.stringify(exportPayload()));
            showToast("Export-Code kopiert.");
          }
        }, "Export kopieren"),
        h("button", {
          class: "btn",
          onClick: () => downloadFile("kowakujo-progress.json", JSON.stringify(exportPayload(), null, 2))
        }, "JSON-Datei")
      ),
      importArea,
      h("button", {
        class: "btn block top-gap-small",
        onClick: () => {
          try {
            const incoming = JSON.parse(importArea.value);
            applyImport(incoming);
            showToast("Import erfolgreich.");
            render();
          } catch (error) {
            console.error(error);
            showToast("Ungültiger Import-Code.");
          }
        }
      }, "Importieren")
    );
  }

  function applyImport(incoming) {
    if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
      throw new Error("Ungültiger Import");
    }
    const allowed = [
      "activeMap",
      "mode",
      "goal",
      "progress",
      "notes",
      "favorites",
      "bossChecklist",
      "players",
      "sideQuest"
    ];
    for (const key of allowed) {
      if (!(key in incoming)) continue;
      let value = incoming[key];
      if (["progress", "notes", "favorites"].includes(key)) value = flattenLegacyStepMap(value);
      if (["progress", "notes", "favorites", "bossChecklist"].includes(key) && (typeof value !== "object" || Array.isArray(value))) continue;
      if (key === "players" && ![2, 3, 4].includes(Number(value))) continue;
      localSet([key], key === "players" ? Number(value) : value);
    }
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  function downloadFile(name, content) {
    const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function refreshApplicationCache() {
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.update()));
      }
      if ("caches" in window) {
        const names = await caches.keys();
        await Promise.all(names.filter((name) => name.startsWith("kowa-")).map((name) => caches.delete(name)));
      }
    } finally {
      location.reload();
    }
  }

  function renderFooter() {
    return h("footer", { class: "footer" },
      h("p", {}, "Inoffizieller Community-Guide · nicht mit Activision oder Treyarch verbunden."),
      h("p", {}, "Marken und Spielinhalte gehören den jeweiligen Rechteinhabern.")
    );
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    let toast = document.querySelector("#message-toast");
    if (!toast) {
      toast = h("div", { id: "message-toast", class: "message-toast", role: "status" });
      document.body.append(toast);
    }
    toast.textContent = message;
    toast.classList.add("visible");
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 2800);
  }

  class SquadConnection {
    constructor(client, roomCode) {
      this.client = client;
      this.roomCode = roomCode;
      this.channel = null;
      this.online = false;
      this.members = [];
    }

    async open() {
      this.channel = this.client.channel(`kowa-${this.roomCode}`, {
        config: {
          presence: { key: actorId },
          broadcast: { self: false }
        }
      });

      this.channel.on("presence", { event: "sync" }, () => {
        const presence = this.channel.presenceState();
        this.members = Object.entries(presence).map(([id, entries]) => ({
          id,
          name: entries?.[0]?.name || `Spieler ${id.slice(-3)}`
        }));
        render();
      });

      this.channel.on("broadcast", { event: "operation" }, ({ payload }) => {
        if (remoteSet(payload?.path, payload?.value, payload?.clock)) render();
      });

      this.channel.on("broadcast", { event: "snapshot-request" }, () => {
        this.broadcastSnapshot();
      });

      this.channel.on("broadcast", { event: "snapshot" }, ({ payload }) => {
        let changed = false;
        for (const [serializedPath, clock] of Object.entries(payload?.clocks || {})) {
          let path;
          try {
            path = JSON.parse(serializedPath);
          } catch {
            continue;
          }
          const value = getAtPath(payload?.state || {}, path);
          if (remoteSet(path, value, clock)) changed = true;
        }
        if (changed) render();
      });

      await new Promise((resolve, reject) => {
        this.channel.subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            this.online = true;
            await this.channel.track({
              name: state.playerName.trim() || `Spieler ${actorId.slice(-3)}`
            });
            await this.channel.send({
              type: "broadcast",
              event: "snapshot-request",
              payload: { actorId }
            });
            resolve();
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            reject(new Error(status));
          }
        });
      });
    }

    sendOperation(operation) {
      if (!this.online) return;
      this.channel.send({ type: "broadcast", event: "operation", payload: operation });
    }

    broadcastSnapshot() {
      if (!this.online) return;
      this.channel.send({ type: "broadcast", event: "snapshot", payload: makeSnapshot() });
    }

    close() {
      this.online = false;
      this.channel?.unsubscribe();
    }
  }

  async function initializeSquad(roomCode) {
    if (!(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey)) return;
    try {
      const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
      const client = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
      squad?.close();
      squad = new SquadConnection(client, roomCode);
      await squad.open();
      render();
    } catch (error) {
      console.error(error);
      showToast("Squad-Verbindung fehlgeschlagen. Lokale Nutzung bleibt aktiv.");
    }
  }

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
      registration.update().catch(() => {});
    } catch (error) {
      console.warn("Service Worker konnte nicht registriert werden", error);
    }
  }

  async function boot() {
    const roomFromUrl = new URLSearchParams(location.search).get("squad");
    if (roomFromUrl && CONFIG.supabaseUrl && CONFIG.supabaseAnonKey) {
      localSet(["squadCode"], roomFromUrl.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8), { sync: false });
    }
    if (state.squadCode && CONFIG.supabaseUrl && CONFIG.supabaseAnonKey) {
      initializeSquad(state.squadCode);
    }
    render();
    registerServiceWorker();
  }

  window.addEventListener("online", () => {
    if (state.squadCode && !squad?.online) initializeSquad(state.squadCode);
  });

  window.addEventListener("offline", () => {
    if (squad) {
      squad.online = false;
      render();
    }
  });

  boot();
})();
