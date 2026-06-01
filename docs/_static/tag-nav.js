/* tag-nav.js
   Sidebar nav - shows physical folder structure as primary nav.
   Tag folders are available as a secondary view toggled by a button.
   Runs on window.load to beat Furo's sidebar JS.
*/
(function () {
  "use strict";

  // Maps physical folder names to display labels
  const FOLDER_LABELS = {
    "category-a": "Category A",
    "category-b": "Category B",
    "category-c": "Category C",
    "category-d": "Category D",
    "meta":       "About This Hub",
  };

  // Tag display order
  const TAG_ORDER = [
    ["getting-started", "Getting Started"],
    ["guides",          "Guides"],
    ["procedures",      "Procedures"],
    ["runbooks",        "Runbooks"],
    ["templates",       "Templates"],
    ["reference",       "Reference"],
  ];

  function tagsJsonUrl() {
    const parts = location.pathname.split("/").filter(Boolean);
    const rtd = parts.length >= 2 && (parts[1] === "latest" || parts[1] === "stable");
    if (rtd) return "/" + parts[0] + "/" + parts[1] + "/_static/tags.json";
    return Array(parts.length).join("../") + "_static/tags.json";
  }

  function baseUrl() {
    const parts = location.pathname.split("/").filter(Boolean);
    const rtd = parts.length >= 2 && (parts[1] === "latest" || parts[1] === "stable");
    if (rtd) return "/" + parts[0] + "/" + parts[1] + "/";
    return Array(parts.length).join("../");
  }

  function currentPage() {
    return location.pathname.split("/").pop() || "index.html";
  }

  function getNavContainer() {
    return document.querySelector(".sidebar-tree");
  }

  function init() {
    fetch(tagsJsonUrl()).then(r => r.json()).then(build).catch(() => {});
  }

  function build(data) {
    const { docs, all_tags } = data;
    const page = currentPage();
    const base = baseUrl();

    // Group docs by physical folder
    const folderMap = new Map();
    docs.filter(d => !d.external).forEach(doc => {
      const parts = doc.url.split("/");
      const folder = parts.length > 1 ? parts[0] : "__root__";
      if (!folderMap.has(folder)) folderMap.set(folder, []);
      folderMap.get(folder).push(doc);
    });

    // Build tag map for tag view
    const tagMap = new Map();
    TAG_ORDER.forEach(([tag]) => tagMap.set(tag, []));
    all_tags.forEach(t => { if (!tagMap.has(t)) tagMap.set(t, []); });
    docs.forEach(doc => doc.tags.forEach(tag => {
      if (tagMap.has(tag)) tagMap.get(tag).push(doc);
    }));

    const nav = document.createElement("div");
    nav.className = "tag-folder-nav";

    // Doc Index link
    const indexLink = document.createElement("a");
    indexLink.href = base + "index.html";
    indexLink.className = "tag-index-link" + (page === "index.html" ? " current" : "");
    indexLink.innerHTML = `<span class="tag-index-icon">▣</span> Doc Index`;
    nav.appendChild(indexLink);

    // View toggle - Folders / Tags
    const toggleWrap = document.createElement("div");
    toggleWrap.className = "nav-view-toggle";
    const folderBtn = document.createElement("button");
    folderBtn.className = "nav-toggle-btn active";
    folderBtn.textContent = "Folders";
    const tagBtn = document.createElement("button");
    tagBtn.className = "nav-toggle-btn";
    tagBtn.textContent = "Tags";
    toggleWrap.append(folderBtn, tagBtn);
    nav.appendChild(toggleWrap);

    // Folder view
    const folderView = document.createElement("div");
    folderView.className = "nav-view nav-folder-view";

    folderMap.forEach((folderDocs, folder) => {
      const label = FOLDER_LABELS[folder] || folder.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      const hasCurrentPage = folderDocs.some(d => d.url.split("/").pop() === page);

      const item = document.createElement("div");
      item.className = "tag-folder";

      const btn = document.createElement("button");
      btn.className = "tag-folder-btn";
      btn.setAttribute("aria-expanded", hasCurrentPage ? "true" : "false");
      btn.innerHTML = `<span class="tag-folder-label">${label}</span><span class="tag-folder-arrow">${hasCurrentPage ? "▾" : "▸"}</span>`;

      const list = document.createElement("ul");
      list.className = "tag-folder-docs";
      list.style.display = hasCurrentPage ? "block" : "none";

      folderDocs.forEach(doc => {
        const li = document.createElement("li");
        const a  = document.createElement("a");
        a.href = base + doc.url;
        a.textContent = doc.title;
        if (doc.url.split("/").pop() === page) a.classList.add("current");
        li.appendChild(a);
        list.appendChild(li);
      });

      btn.addEventListener("click", () => {
        const open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", !open ? "true" : "false");
        btn.querySelector(".tag-folder-arrow").textContent = !open ? "▾" : "▸";
        list.style.display = !open ? "block" : "none";
      });

      item.append(btn, list);
      folderView.appendChild(item);
    });

    // Tag view
    const tagView = document.createElement("div");
    tagView.className = "nav-view nav-tag-view";
    tagView.style.display = "none";

    const orderedTags = [
      ...TAG_ORDER.map(([t]) => t).filter(t => tagMap.has(t) && tagMap.get(t).length),
      ...all_tags.filter(t => !TAG_ORDER.some(([o]) => o === t) && tagMap.get(t)?.length),
    ];

    orderedTags.forEach(tag => {
      const tagDocs = tagMap.get(tag);
      if (!tagDocs?.length) return;
      const label = (TAG_ORDER.find(([t]) => t === tag) || [tag, tag])[1];

      const item = document.createElement("div");
      item.className = "tag-folder";

      const btn = document.createElement("button");
      btn.className = "tag-folder-btn";
      btn.setAttribute("aria-expanded", "false");
      btn.innerHTML = `<span class="tag-folder-label">${label}</span><span class="tag-folder-count">${tagDocs.length}</span><span class="tag-folder-arrow">▸</span>`;

      const list = document.createElement("ul");
      list.className = "tag-folder-docs";
      list.style.display = "none";

      tagDocs.forEach(doc => {
        const li = document.createElement("li");
        const a  = document.createElement("a");
        a.href = base + doc.url;
        a.textContent = doc.title + (doc.external ? " ↗" : "");
        if (doc.url.split("/").pop() === page) a.classList.add("current");
        if (doc.external) { a.target = "_blank"; a.classList.add("external-link"); }
        li.appendChild(a);
        list.appendChild(li);
      });

      btn.addEventListener("click", () => {
        const open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", !open ? "true" : "false");
        btn.querySelector(".tag-folder-arrow").textContent = !open ? "▾" : "▸";
        list.style.display = !open ? "block" : "none";
      });

      item.append(btn, list);
      tagView.appendChild(item);
    });

    nav.append(folderView, tagView);

    // Toggle logic
    folderBtn.addEventListener("click", () => {
      folderBtn.classList.add("active");
      tagBtn.classList.remove("active");
      folderView.style.display = "block";
      tagView.style.display = "none";
    });
    tagBtn.addEventListener("click", () => {
      tagBtn.classList.add("active");
      folderBtn.classList.remove("active");
      tagView.style.display = "block";
      folderView.style.display = "none";
    });

    function inject() {
      const container = getNavContainer();
      if (container) {
        container.innerHTML = "";
        container.appendChild(nav);
      }
    }

    inject();
    setTimeout(inject, 100);
    setTimeout(inject, 300);
    setTimeout(inject, 600);
  }

  window.addEventListener("load", init);
})();
