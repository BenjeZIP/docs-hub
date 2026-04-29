/* SecOps Docs - tag filter widget (index page)
   Pill mode with global AND/OR toggle + advanced query bar.
   Query bar takes priority if non-empty.
*/
(function () {
  "use strict";
  const INDEX_ID = "tag-index-root";

  function parseQuery(raw) {
    const tokens = tokenise(raw);
    let pos = 0;
    const peek    = () => tokens[pos];
    const consume = () => tokens[pos++];
    const expect  = (v) => { if (peek() !== v) throw new Error(`Expected "${v}" got "${peek()}"`); consume(); };

    function parseExpr() {
      let left = parseTerm();
      while (peek() === "OR") { consume(); const r = parseTerm(), l = left; left = (t) => l(t) || r(t); }
      return left;
    }
    function parseTerm() {
      let left = parseFactor();
      while (peek() === "AND") { consume(); const r = parseFactor(), l = left; left = (t) => l(t) && r(t); }
      return left;
    }
    function parseFactor() {
      if (peek() === "NOT") { consume(); const i = parseFactor(); return (t) => !i(t); }
      if (peek() === "(")   { consume(); const i = parseExpr(); expect(")"); return i; }
      const tag = consume();
      if (!tag) throw new Error("Unexpected end");
      return (t) => t.includes(tag.toLowerCase());
    }
    try {
      const fn = parseExpr();
      if (pos !== tokens.length) throw new Error("Unexpected token: " + peek());
      return { ok: true, fn };
    } catch (e) { return { ok: false, error: e.message }; }
  }

  function tokenise(raw) {
    return raw.trim().replace(/\(/g," ( ").replace(/\)/g," ) ").split(/\s+/).filter(Boolean)
      .map(t => { const u = t.toUpperCase(); return (u==="AND"||u==="OR"||u==="NOT") ? u : t.toLowerCase(); });
  }

  function tagsJsonUrl() {
    return Array(location.pathname.split("/").filter(Boolean).length).join("../") + "_static/tags.json";
  }

  function init() {
    const root = document.getElementById(INDEX_ID);
    if (!root) return;
    fetch(tagsJsonUrl()).then(r => r.json()).then(data => render(root, data))
      .catch(err => { root.innerHTML = `<p class="tag-error">Could not load tags index: ${err}</p>`; });
  }

  function render(root, data) {
    const { docs, all_tags } = data;
    let activeTags = new Set(), globalMode = "AND", titleSearch = "", queryRaw = "";
    root.innerHTML = "";

    const searchWrap = el("div", "tag-search-wrap");
    const searchInput = el("input", "tag-search-input");
    searchInput.type = "text"; searchInput.placeholder = "Search doc titles...";
    searchWrap.appendChild(searchInput); root.appendChild(searchWrap);

    const pillsWrap = el("div", "tag-pills-wrap");
    const pillsLabelRow = el("div", "tag-pills-labelrow");
    const pillsLabel = el("span", "tag-pills-label"); pillsLabel.textContent = "Filter by tag:";
    pillsLabelRow.appendChild(pillsLabel);

    const modeWrap = el("div", "tag-mode-wrap");
    const modeAnd = el("button", "tag-mode-btn mode-and active"); modeAnd.textContent = "AND"; modeAnd.title = "Match ALL tags";
    const modeSep = el("span", "tag-mode-sep"); modeSep.textContent = "/";
    const modeOr  = el("button", "tag-mode-btn mode-or");  modeOr.textContent  = "OR";  modeOr.title  = "Match ANY tag";
    modeAnd.addEventListener("click", () => setMode("AND"));
    modeOr.addEventListener("click",  () => setMode("OR"));
    modeWrap.append(modeAnd, modeSep, modeOr); pillsLabelRow.appendChild(modeWrap);

    const clearBtn = el("button", "tag-clear-btn"); clearBtn.textContent = "Clear all";
    clearBtn.addEventListener("click", () => {
      activeTags.clear(); queryInput.value = ""; queryRaw = "";
      searchInput.value = ""; titleSearch = "";
      refreshPillStates(); queryError.textContent = ""; updateResults();
    });
    pillsLabelRow.appendChild(clearBtn); pillsWrap.appendChild(pillsLabelRow);

    const pillsRow = el("div", "tag-pills-row");
    all_tags.forEach(tag => {
      const pill = el("button", "tag-pill"); pill.textContent = tag; pill.dataset.tag = tag;
      pill.addEventListener("click", () => {
        activeTags.has(tag) ? activeTags.delete(tag) : activeTags.add(tag);
        pill.classList.toggle("active", activeTags.has(tag)); updateResults();
      });
      pillsRow.appendChild(pill);
    });
    pillsWrap.appendChild(pillsRow); root.appendChild(pillsWrap);

    const queryWrap = el("div", "tag-query-wrap");
    const queryLabel = el("span", "tag-query-label"); queryLabel.textContent = "Advanced query:";
    const queryInput = el("input", "tag-query-input");
    queryInput.type = "text"; queryInput.placeholder = "e.g.  soc-duty AND (onboarding OR runbooks)";
    const queryError = el("span", "tag-query-error");
    queryWrap.append(queryLabel, queryInput, queryError); root.appendChild(queryWrap);

    const countEl = el("p", "tag-results-count"); root.appendChild(countEl);
    const grid = el("div", "tag-results-grid"); root.appendChild(grid);

    searchInput.addEventListener("input", () => { titleSearch = searchInput.value.toLowerCase().trim(); updateResults(); });
    queryInput.addEventListener("input",  () => { queryRaw = queryInput.value.trim(); updateResults(); });

    function setMode(mode) {
      globalMode = mode;
      modeAnd.classList.toggle("active", mode === "AND");
      modeOr.classList.toggle("active",  mode === "OR");
      updateResults();
    }
    function refreshPillStates() {
      pillsRow.querySelectorAll(".tag-pill").forEach(p => p.classList.toggle("active", activeTags.has(p.dataset.tag)));
    }
    function evalPills(doc) {
      if (!activeTags.size) return true;
      return globalMode === "AND"
        ? [...activeTags].every(t => doc.tags.includes(t))
        : [...activeTags].some(t => doc.tags.includes(t));
    }
    function updateResults() {
      let queryFn = null;
      if (queryRaw) {
        const parsed = parseQuery(queryRaw);
        if (!parsed.ok) { queryError.textContent = "⚠ " + parsed.error; queryFn = () => false; }
        else            { queryError.textContent = ""; queryFn = doc => parsed.fn(doc.tags); }
      }
      const filtered = docs.filter(doc => {
        const matchTags  = queryFn ? queryFn(doc) : evalPills(doc);
        const matchTitle = !titleSearch || doc.title.toLowerCase().includes(titleSearch);
        return matchTags && matchTitle;
      });
      const noFilters = !activeTags.size && !titleSearch && !queryRaw;
      countEl.textContent = noFilters ? `${docs.length} docs indexed` : `${filtered.length} of ${docs.length} docs match`;
      grid.innerHTML = "";
      if (!filtered.length) { const e = el("p","tag-empty"); e.textContent="No docs match."; grid.appendChild(e); return; }
      filtered.forEach(doc => {
        const card = el("div", "tag-card" + (doc.external ? " external" : ""));
        const titleLink = el("a", "tag-card-title");
        titleLink.href = doc.url; titleLink.textContent = doc.title;
        if (doc.external) titleLink.target = "_blank";
        const locBadge = el("span", "tag-location-badge"); locBadge.textContent = doc.location;
        const tagsRow = el("div", "tag-card-tags");
        doc.tags.forEach(t => {
          const badge = el("span", "tag-badge"); badge.textContent = t;
          if (activeTags.has(t)) badge.classList.add("highlighted");
          badge.addEventListener("click", () => {
            activeTags.has(t) ? activeTags.delete(t) : activeTags.add(t);
            pillsRow.querySelectorAll(`.tag-pill[data-tag="${t}"]`).forEach(p => p.classList.toggle("active", activeTags.has(t)));
            updateResults();
          });
          tagsRow.appendChild(badge);
        });
        card.append(titleLink, locBadge, tagsRow); grid.appendChild(card);
      });
    }
    updateResults();
  }

  function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();
})();
