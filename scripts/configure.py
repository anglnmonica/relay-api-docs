#!/usr/bin/env python3
"""Generate each tool's settings from docs-kit.yml.

Run from the repository root:

    python3 scripts/configure.py

It writes these files, which you don't edit by hand:

    .vale.ini            Style check settings (Vale)
    .codespellrc         Spelling check settings (codespell)
    .lychee.toml         Link check settings (Lychee)
    .docs-kit/styles/    Style rules from the domain packs you turned on,
                         plus your word list from terms.yml

In GitHub Actions, add --github-output to also pass the settings the
workflow needs, such as which checks are turned on.

Requires PyYAML:  pip install pyyaml
"""

import re
import shutil
import sys
from pathlib import Path

import yaml

CONFIG = Path("docs-kit.yml")
GENERATED = Path(".docs-kit")
STYLES = GENERATED / "styles"
PACKS = Path("packs")

# Each base style's rule names for the voice settings.
VOICE_RULES = {
    "google": {"first_person": ["Google.FirstPerson", "Google.We"],
               "contractions": "Google.Contractions",
               "acronyms": ["Google.Acronyms", "Google.Parens"]},
    "microsoft": {"first_person": ["Microsoft.FirstPerson", "Microsoft.We"],
                  "contractions": "Microsoft.Contractions",
                  "acronyms": ["Microsoft.Acronyms"]},
}


def fail(message):
    print(f"docs-kit: {message}", file=sys.stderr)
    sys.exit(1)


def load_config():
    if not CONFIG.exists():
        fail("docs-kit.yml not found. Run this script from the repository root.")
    config = yaml.safe_load(CONFIG.read_text()) or {}
    for section in ("project", "repository", "style", "checks"):
        if section not in config:
            fail(f"docs-kit.yml is missing the '{section}' section.")
    base = config["style"].get("base", "google")
    if base not in VOICE_RULES:
        fail(f"style.base must be one of: {', '.join(VOICE_RULES)}. Found '{base}'.")
    return config


def enabled_packs(config):
    packs = [name for name, on in (config.get("packs") or {}).items() if on]
    for name in packs:
        if not (PACKS / name).is_dir():
            fail(f"packs.{name} is turned on, but there's no packs/{name} folder.")
    return packs


def pack_style_dirs(name):
    """A pack's style folders: every folder in it except tests."""
    return [p for p in (PACKS / name).iterdir() if p.is_dir() and p.name != "tests"]


def write_styles(config, packs):
    # Replace only the folders this script manages: every pack's styles and
    # the word list. The base style that "vale sync" downloads, such as
    # Google, stays in place.
    STYLES.mkdir(parents=True, exist_ok=True)
    managed = {folder.name for pack in PACKS.iterdir() if pack.is_dir()
               for folder in pack_style_dirs(pack.name)}
    for name in managed:
        shutil.rmtree(STYLES / name, ignore_errors=True)
    shutil.rmtree(STYLES / "config" / "vocabularies" / "Kit", ignore_errors=True)
    style_names = []
    for name in packs:
        for folder in pack_style_dirs(name):
            shutil.copytree(folder, STYLES / folder.name)
            style_names.append(folder.name)

    # Word list: terms.yml becomes a Vale vocabulary.
    terms_file = Path(config["style"].get("terminology_file", "terms.yml"))
    terms = yaml.safe_load(terms_file.read_text()) if terms_file.exists() else {}
    terms = terms or {}
    vocab = STYLES / "config" / "vocabularies" / "Kit"
    vocab.mkdir(parents=True)
    (vocab / "accept.txt").write_text("\n".join(terms.get("accept") or []) + "\n")
    (vocab / "reject.txt").write_text("\n".join(terms.get("reject") or []) + "\n")
    return style_names, terms


def write_vale(config, style_names):
    style = config["style"]
    base = style.get("base", "google")
    rules = VOICE_RULES[base]
    voice = style.get("voice") or {}
    base_name = base.capitalize()

    settings = ["# codespell checks spelling.", "Vale.Spelling = NO"]
    if voice.get("person", "second") == "first":
        settings += ["# style.voice.person is first."] + [f"{rule} = NO" for rule in rules["first_person"]]
    if voice.get("contractions", True) is False:
        settings += ["# style.voice.contractions is false.", f"{rules['contractions']} = NO"]
    if "Telecom" in style_names:
        settings += ["# The Telecom pack's AcronymFirst rule replaces these."] + [f"{rule} = NO" for rule in rules["acronyms"]]

    based_on = ", ".join(["Vale", base_name] + style_names)
    lines = [
        "# Generated from docs-kit.yml by scripts/configure.py. Don't edit by hand.",
        f"StylesPath = {STYLES.as_posix()}",
        "MinAlertLevel = suggestion",
        "Vocab = Kit",
        f"Packages = {base_name}",
        "",
        "[*.{md,markdown,mdx}]",
        f"BasedOnStyles = {based_on}",
        *settings,
        "",
    ]
    Path(".vale.ini").write_text("\n".join(lines))


def write_codespell(config):
    spelling = config["checks"].get("spelling") or {}
    ignore = ",".join(word.lower() for word in spelling.get("ignore_words") or [])
    lines = [
        "# Generated from docs-kit.yml by scripts/configure.py. Don't edit by hand.",
        "[codespell]",
        "skip = ./.git,./.docs-kit,./packs,./node_modules,*.png,*.jpg,*.svg,*.pdf",
    ]
    if ignore:
        lines.append(f"ignore-words-list = {ignore}")
    Path(".codespellrc").write_text("\n".join(lines) + "\n")


def write_lychee(config):
    links = config["checks"].get("links") or {}
    exclude = list(links.get("exclude") or [])
    # When the built site is checked, every page is checked as a file, so
    # full links to the site's own address don't need an online check.
    # Skipping them also avoids false failures for pages that aren't
    # published yet, such as new pages in a pull request.
    docs_url = (config.get("project") or {}).get("docs_url", "")
    build_output = (config.get("repository") or {}).get("build_output", "")
    if build_output and docs_url.startswith("http") and "<" not in docs_url:
        exclude.append("^" + re.escape(docs_url.rstrip("/")).replace("\\", "\\\\"))
    quoted = ",\n".join(f'  "{pattern}"' for pattern in exclude)
    lines = [
        "# Generated from docs-kit.yml by scripts/configure.py. Don't edit by hand.",
        "max_retries = 3",
        "timeout = 30",
        "# 429 means the site is up but rate limiting the checker.",
        "accept = [200, 206, 429]",
        "include_mail = false",
        f"exclude = [\n{quoted}\n]" if exclude else "exclude = []",
    ]
    Path(".lychee.toml").write_text("\n".join(lines) + "\n")


def github_outputs(config, packs):
    checks = config["checks"]
    repo = config["repository"]

    def on(name):
        return str(bool((checks.get(name) or {}).get("enabled", False))).lower()

    values = {
        "style": on("style"),
        "spelling": on("spelling"),
        "links": on("links"),
        "links_weekly": str(bool((checks.get("links") or {}).get("weekly", False))).lower(),
        "accuracy": on("accuracy"),
        "rule_tests": str(bool(packs) and on("rule_tests") == "true").lower(),
        "fail_on": (checks.get("style") or {}).get("fail_on", "error"),
        "packs": " ".join(packs),
        "content_path": repo.get("content_path", "docs/"),
        "site_generator": repo.get("site_generator", "none"),
        "build_command": repo.get("build_command", "") or "",
        "build_output": repo.get("build_output", "") or "",
        "base_path": (repo.get("base_path", "") or "").strip("/"),
        "doc_detective_tests": (checks.get("accuracy") or {}).get("tests_path", ".github/doc-detective/tests/"),
    }
    if values["accuracy"] == "true" and not values["build_output"]:
        fail("checks.accuracy is turned on, but repository.build_output is empty.")
    return values


def check_templates(config):
    """Warn about doc types that are turned on but have no template."""
    doc_types = config.get("doc_types") or {}
    folder = Path(doc_types.get("templates_path", "templates/"))
    missing = [name for name, on in doc_types.items()
               if name != "templates_path" and on is True
               and not (folder / f"{name.replace('_', '-')}.md").exists()]
    for name in missing:
        print(f"docs-kit: warning: doc_types.{name} is turned on, but "
              f"{folder.as_posix().rstrip('/')}/{name.replace('_', '-')}.md doesn't exist.")


def main():
    config = load_config()
    check_templates(config)
    packs = enabled_packs(config)
    style_names, _ = write_styles(config, packs)
    write_vale(config, style_names)
    write_codespell(config)
    write_lychee(config)

    if "--github-output" in sys.argv:
        import os
        outputs = github_outputs(config, packs)
        with open(os.environ["GITHUB_OUTPUT"], "a") as out:
            for key, value in outputs.items():
                out.write(f"{key}={value}\n")
        for key, value in outputs.items():
            print(f"{key}: {value}")

    packs_text = ", ".join(packs) if packs else "none"
    print(f"docs-kit: settings written. Domain packs turned on: {packs_text}.")


if __name__ == "__main__":
    main()
