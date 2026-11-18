"""Publish a Markdown copy of each page next to its HTML.

AI tools read Markdown more reliably than HTML, and the llms.txt proposal
suggests publishing it. For docs/quickstart.md, which MkDocs builds as
quickstart/index.html, this writes quickstart/index.md.
"""

from pathlib import Path

_pages = []


def on_page_markdown(markdown, page, config, files):
    _pages.append((page.file.abs_src_path, page.file.dest_path))
    return markdown


def on_post_build(config):
    site = Path(config["site_dir"])
    for src, dest in _pages:
        if not dest.endswith(".html"):
            continue
        target = site / (dest[: -len(".html")] + ".md")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(Path(src).read_text(encoding="utf-8"), encoding="utf-8")
    _pages.clear()
