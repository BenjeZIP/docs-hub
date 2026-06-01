"""
build_tags.py
Scrapes **tags:** lines from all .md docs and outputs _static/tags.json.
Also warns about untagged docs (orphans) found in the docs directory.
Run before sphinx-build. The Makefile does this automatically.
"""
import json
import re
import sys
from pathlib import Path

DOCS_DIR = Path(__file__).parent
OUTPUT   = DOCS_DIR / "_static" / "tags.json"
TAG_PAT  = re.compile(r"\*\*tags:\*\*\s*(.+)")

# External links - docs that live outside this repo
# Add entries here for GitHub repos, Drive docs, wikis, etc.
EXTERNAL_LINKS = [
    {
        "title": "External Resource One",
        "url": "https://example.com",
        "tags": ["reference", "guides"],
        "location": "External",
        "external": True,
    },
    {
        "title": "External Resource Two",
        "url": "https://example.com",
        "tags": ["templates", "procedures"],
        "location": "External",
        "external": True,
    },
]

def scrape():
    docs = []
    orphans = []

    for path in sorted(DOCS_DIR.rglob("*.md")):
        if "_build" in path.parts:
            continue

        text  = path.read_text(encoding="utf-8")
        lines = text.splitlines()

        title = path.stem.replace("-", " ").title()
        for line in lines:
            if line.startswith("# "):
                title = line[2:].strip()
                break

        tags = []
        for line in lines:
            m = TAG_PAT.search(line)
            if m:
                tags = [t.strip() for t in m.group(1).split(",")]
                break

        rel = path.relative_to(DOCS_DIR)

        if not tags:
            orphans.append(str(rel))
            continue

        docs.append({
            "title":    title,
            "url":      str(rel.with_suffix(".html")),
            "tags":     tags,
            "location": "Docs",
            "external": False,
        })

    docs.extend(EXTERNAL_LINKS)

    if orphans:
        print("\n⚠  WARNING: untagged docs found (won't appear in index):")
        for o in orphans:
            print(f"   - {o}")
        print("   Add a  **tags:** line to each doc to fix this.\n")

    return docs, orphans


if __name__ == "__main__":
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    docs, orphans = scrape()
    all_tags = sorted({t for d in docs for t in d["tags"]})
    OUTPUT.write_text(json.dumps({"docs": docs, "all_tags": all_tags}, indent=2))
    print(f"wrote {len(docs)} docs ({len(all_tags)} tags) -> {OUTPUT}")

    # Exit 0 even with orphans - warnings only at build time
    # CI uses check_tags.py for hard failures
