project = "Docs Hub"
author = "Docs Hub Contributors"
copyright = "2025 Docs Hub"

extensions = ["canonical_sphinx"]

html_static_path = ["_static"]
html_css_files = ["secops.css"]
html_js_files = ["tag-filter.js", "tag-nav.js"]
templates_path = ["_templates"]
exclude_patterns = ["_build"]
source_suffix = {".rst": "restructuredtext", ".md": "markdown"}

slug = "docs-hub"
disable_feedback_button = True

html_context = {
    "product_tag": "",
    "product_page": "",
    "github_url": "",
    "repo_default_branch": "main",
    "repo_folder": "",
    "github_issues": "",
    "sequential_nav": "none",
    "display_contributors": False,
}
