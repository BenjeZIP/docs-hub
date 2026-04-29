# docs-hub

A tag-based documentation hub built with Sphinx and the Canonical Sphinx theme.

## Concept

Instead of burying docs in nested folders, every doc gets tagged with one or more labels. The front page is a filterable index - click a tag to see everything with that tag. A doc can appear under multiple tags without any duplication. External links (wikis, Drive docs, GitHub repos) are included in the same index.

## Local setup

### Windows
```bat
pip install canonical-sphinx myst-parser sphinx
python -m sphinx -b html docs docs\_build\html
python -m http.server 8000 --directory docs\_build\html
```

### Linux / Mac
```bash
pip install canonical-sphinx myst-parser sphinx
make html
python3 -m http.server 8000 --directory docs/_build/html
```

Then open http://localhost:8000

## Adding a doc

1. Create a `.md` file anywhere under `docs/`
2. Add a tags line: `**tags:** getting-started, reference`
3. Add it to the `toctree` in `docs/index.rst`
4. Rebuild

## Adding an external link

Edit `docs/build_tags.py` and add an entry to `EXTERNAL_LINKS`:

```python
{
    "title": "My doc",
    "url": "https://...",
    "tags": ["reference"],
    "location": "External",
    "external": True,
}
```
