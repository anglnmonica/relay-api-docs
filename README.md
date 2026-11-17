# Relay API docs

Documentation for Relay, a fictional private network management API,
created by [Angelin Monica Selvaraj](https://anglnmonica.github.io) to
demonstrate API documentation and a docs-as-code workflow.

Relay isn't a real product. The `relay.example` domain doesn't exist, so
the example requests don't return data.

## What's here

| Folder or file | Contents |
| --- | --- |
| `api/openapi.yaml` | The OpenAPI 3.1 specification: 8 operations for sites, devices, and alerts. The source of truth for the reference. |
| `api/generate_reference.py` | Generates the reference pages in `docs/reference/` from the spec. |
| `docs/` | The docs site: an overview, a quickstart, authentication, a task guide, pagination and rate limits, errors, release notes, and the generated reference. |
| `docs/try-it.md` | The Try it page, where visitors send requests to an in-browser sandbox. |
| `docs/javascripts/sandbox.js` | The sandbox: a fake Relay server that runs in the browser and follows the spec's rules. |
| `api/sandbox-contract-test.mjs` | Sends 37 requests to the sandbox and checks each response against the spec. |
| `.spectral.yaml` | Rules for the spec: every operation, parameter, and field needs a description, and every request and response needs an example. |
| `mkdocs.yml` | Site settings, for [MkDocs Material](https://squidfunk.github.io/mkdocs-material/). |

The guides were written from the templates in the
[docs-as-code kit](https://github.com/anglnmonica/docs-as-code-kit),
which is installed here: `docs-kit.yml`, `templates/`, `checklists/`, and
the AI skills in `.claude/skills/`.

## Checks on every pull request

| Check | What it catches |
| --- | --- |
| Style (Vale) | Departures from the Google developer documentation style guide, plus the Telecom pack's acronym, term, and unit rules |
| Rule tests | A Telecom rule that stops catching the mistakes it's meant to catch |
| Spelling (codespell) | Common misspellings |
| Links (Lychee) | Broken links on the built site |
| Accuracy (Doc Detective) | A page that no longer has what the docs say it does, such as a missing operation |
| Spec lint (Spectral) | Invalid OpenAPI, and any operation, parameter, or field without a description or example |
| Reference drift | Reference pages, or the Try it page's operation list, that don't match the spec |
| Sandbox contract | A sandbox response that doesn't match the spec |

## Change the API

1. Edit `api/openapi.yaml`.
2. Regenerate the reference pages:

   ```bash
   python3 api/generate_reference.py
   ```

3. Open a pull request with both changes. The reference drift check fails
   if you change one without the other.

## Build the site on your computer

```bash
pip install -r requirements.txt
mkdocs serve
```

Then open http://127.0.0.1:8000.
