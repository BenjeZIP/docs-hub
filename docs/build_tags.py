"""
Scrape **tags:** lines from all .md docs, output _static/tags.json
Run before sphinx-build (Makefile does this automatically).
"""
import json, re
from pathlib import Path

DOCS_DIR = Path(__file__).parent
OUTPUT   = DOCS_DIR / "_static" / "tags.json"
TAG_PAT  = re.compile(r"\*\*tags:\*\*\s*(.+)")

EXTERNAL_LINKS = [
    {
        "title": "External Resource One",
        "url": "https://example.com",
        "tags": ["reference", "guides"],
        "location": "External", "external": True,
    },
    {
        "title": "External Resource Two",
        "url": "https://example.com",
        "tags": ["templates", "procedures"],
        "location": "External", "external": True,
    },
]

def scrape():
    docs = []
    for path in sorted(DOCS_DIR.rglob("*.md")):
        if "_build" in path.parts:
            continue
        text  = path.read_text(encoding="utf-8")
        lines = text.splitlines()
        title = path.stem.replace("-", " ").title()
        for line in lines:
            if line.startswith("# "):
                title = line[2:].strip(); break
        tags = []
        for line in lines:
            m = TAG_PAT.search(line)
            if m:
                tags = [t.strip() for t in m.group(1).split(",")]; break
        if not tags:
            continue
        rel = path.relative_to(DOCS_DIR)
        docs.append({
            "title": title,
            "url": str(rel.with_suffix(".html")),
            "tags": tags, "location": "Docs", "external": False,
        })
    docs.extend(EXTERNAL_LINKS)
    return docs

if __name__ == "__main__":
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    docs    = scrape()
    all_tags = sorted({t for d in docs for t in d["tags"]})
    OUTPUT.write_text(json.dumps({"docs": docs, "all_tags": all_tags}, indent=2))
    print(f"wrote {len(docs)} docs ({len(all_tags)} tags) -> {OUTPUT}")
