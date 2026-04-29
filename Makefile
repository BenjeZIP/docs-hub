SPHINXBUILD = sphinx-build
SOURCEDIR   = docs
BUILDDIR    = docs/_build

.PHONY: help html tags clean

help:
	@echo "make tags   - scrape tags from docs"
	@echo "make html   - build HTML site (runs tags first)"
	@echo "make clean  - remove build output"

tags:
	python3 docs/build_tags.py

html: tags
	$(SPHINXBUILD) -b html $(SOURCEDIR) $(BUILDDIR)/html
	@echo ""
	@echo "Done. Serve with:"
	@echo "  python3 -m http.server 8000 --directory docs/_build/html"

clean:
	rm -rf $(BUILDDIR)
