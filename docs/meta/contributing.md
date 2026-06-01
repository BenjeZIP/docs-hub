# Contributing to Docs Hub

**tags:** getting-started, guides, reference

This doc covers everything you need to add or update documentation - how to add a new doc, how tagging works, how to register external links, and what the CI checks enforce.

---

## Adding a doc (5 minutes)

### 1. Create a markdown file

Drop a `.md` file anywhere under `docs/`. Use subfolders to keep the repo organised - the folder structure shows up as the primary sidebar nav.

```
docs/
  runbooks/my-new-runbook.md
```

### 2. Add a tags line

Near the top of your file, add a `**tags:**` line with a comma-separated list of tags from the governed tag list below:

```markdown
# My New Runbook

**tags:** runbooks, procedures, reference
```

The doc will appear in the index under every tag it has. One file, multiple entry points.

### 3. Add it to the toctree

Open `docs/index.rst` and add the file path (without extension) to the `toctree` block:

```rst
.. toctree::
   :hidden:
   :maxdepth: 2

   runbooks/my-new-runbook
```

### 4. Push

```bash
git add .
git commit -m "add my-new-runbook"
git push
```

Read the Docs rebuilds automatically within about 60 seconds.

---

## Adding an external link

For docs that live outside this repo (GitHub wikis, Google Drive, Confluence, etc.) you don't move them - you just register them so they show up in the index.

Open `docs/build_tags.py` and add an entry to `EXTERNAL_LINKS`:

```python
{
    "title": "Wazuh Config Repo",
    "url": "https://github.com/org/wazuh-config",
    "tags": ["reference", "runbooks"],
    "location": "GitHub",
    "external": True,
},
```

The `location` field is just a label shown on the card ("GitHub", "Google Drive", "Confluence", etc.). External links open in a new tab and show a `↗` indicator.

---

## Tag taxonomy

Tags are a governed list. Don't invent new tags without updating this doc and the index page tag reference table. Consistency is what makes the system useful.

| Tag | What it covers | Example docs |
|---|---|---|
| `getting-started` | Setup, onboarding, first steps | New analyst guide, access checklist |
| `guides` | Step-by-step how-to guides | How to add a collector, how to write a rule |
| `procedures` | Operational procedures and processes | Alert triage process, change management |
| `runbooks` | Step-by-step operational runbooks | Incident response runbook, offboarding runbook |
| `templates` | Reusable blank document templates | Incident template, offboarding checklist |
| `reference` | Architecture docs, system overviews, lookup material | Rule architecture, collector overview |

### Rules for tagging

- Every doc must have at least one tag - untagged docs won't appear in the index and will fail CI
- Use multiple tags where a doc genuinely fits multiple categories - don't over-tag just to increase visibility
- Prefer existing tags over inventing new ones
- Tags are lowercase with hyphens: `soc-duty` not `SOC Duty` or `soc_duty`

### Adding a new tag

If an existing tag genuinely doesn't fit:

1. Add it to the table above with a clear description
2. Add it to the `TAG_ORDER` list in `docs/_static/tag-nav.js`
3. Add it to the tag reference table in `docs/index.rst`
4. Open a PR so the team can review the addition

---

## CI checks

Two GitHub Actions run on every push and pull request:

### check-tags (hard fail)

Scans every `.md` file in `docs/` and fails the build if any doc is missing a `**tags:**` line. PRs with untagged docs cannot be merged.

### check-links (warn only)

Pings every URL in `EXTERNAL_LINKS` and comments on the PR with any that return a non-200 response. This is a warning only - it won't block a merge, but dead links should be fixed promptly.

---

## Local build

```bash
# Install dependencies (once)
pip install canonical-sphinx myst-parser sphinx

# Build
python docs/build_tags.py
python -m sphinx -b html docs docs/_build/html

# Serve locally
python -m http.server 8000 --directory docs/_build/html
# Open http://localhost:8000
```

On Windows use `python` instead of `python3` and `\` instead of `/`.
