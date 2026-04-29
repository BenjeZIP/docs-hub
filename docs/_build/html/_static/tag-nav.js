/* SecOps Docs - tag folder nav
   Replaces Furo sidebar toctree with tag-based collapsible folders.
   Runs after full page load to beat Furo's own sidebar JS.
*/
(function () {
  "use strict";

  const TAG_ORDER = [
    ["getting-started", "Getting Started"],
    ["guides",          "Guides"],
    ["procedures",      "Procedures"],
    ["runbooks",        "Runbooks"],
    ["templates",       "Templates"],
    ["reference",       "Reference"],
  ];

  function tagsJsonUrl() {
    return Array(location.pathname.split("/").filter(Boolean).length).join("../") + "_static/tags.json";
  }

  function currentPage() {
    return location.pathname.split("/").pop() || "index.html";
  }

  function getNavContainer() {
    return document.querySelector(".sidebar-tree") ||
           document.querySelector(".sidebar-scroll");
  }

  function init() {
    fetch(tagsJsonUrl()).then(r => r.json()).then(build).catch(() => {});
  }

  function build(data) {
    const { docs, all_tags } = data;
    const page = currentPage();
    const base = Array(location.pathname.split("/").filter(Boolean).length).join("../");

    const tagMap = new Map();
    TAG_ORDER.forEach(([tag]) => tagMap.set(tag, []));
    all_tags.forEach(t => { if (!tagMap.has(t)) tagMap.set(t, []); });
    docs.forEach(doc => doc.tags.forEach(tag => { if (tagMap.has(tag)) tagMap.get(tag).push(doc); }));

    const nav = document.createElement("div");
    nav.className = "tag-folder-nav";

    // Doc Index link
    const indexLink = document.createElement("a");
    indexLink.href = base + "index.html";
    indexLink.className = "tag-index-link" + (page === "index.html" ? " current" : "");
    indexLink.innerHTML = `<span class="tag-index-icon">▣</span> Doc Index`;
    nav.appendChild(indexLink);

    const orderedTags = [
      ...TAG_ORDER.map(([t]) => t).filter(t => tagMap.has(t)),
      ...all_tags.filter(t => !TAG_ORDER.some(([o]) => o === t)),
    ];

    orderedTags.forEach(tag => {
      const tagDocs = tagMap.get(tag);
      if (!tagDocs || !tagDocs.length) return;
      const label = (TAG_ORDER.find(([t]) => t === tag) || [tag, tag])[1];

      const folder = document.createElement("div");
      folder.className = "tag-folder";

      const btn = document.createElement("button");
      btn.className = "tag-folder-btn";
      btn.setAttribute("aria-expanded", "false");
      btn.innerHTML = `<span class="tag-folder-arrow">▸</span><span class="tag-folder-label">${label}</span><span class="tag-folder-count">${tagDocs.length}</span>`;

      const list = document.createElement("ul");
      list.className = "tag-folder-docs";
      list.style.display = "none";

      tagDocs.forEach(doc => {
        const li = document.createElement("li");
        const a  = document.createElement("a");
        const docPage = doc.url.split("/").pop();
        a.href = base + doc.url;
        a.textContent = doc.title + (doc.external ? " ↗" : "");
        if (docPage === page) a.classList.add("current");
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

      folder.append(btn, list);
      nav.appendChild(folder);
    });

    // Try multiple times to beat Furo's own sidebar manipulation
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

  // Run after everything has loaded
  window.addEventListener("load", init);
})();
