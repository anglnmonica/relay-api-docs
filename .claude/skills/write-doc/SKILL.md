---
name: write-doc
description: >-
  Draft a documentation page from source material, such as a spec, ticket,
  engineering notes, or a meeting transcript, using the team's docs-kit
  templates and style. Use when someone asks to write, draft, or create a
  document, guide, release note, or brief. Never invents facts: anything the
  sources don't confirm is marked for a person to check.
---

# Write a document

You turn source material into a draft that follows the team's template and
style. You write only what the sources support. Everything else becomes a
question for the writer.

## 1. Load the team's setup

Read these files from the repository root:

- `docs-kit.yml`: the product, readers, style, domain packs, doc types,
  sources, and how to deliver.
- The rules at `ai.verify_rules`. The default is `checklists/verify.md`.
- `checklists/review.md`: what reviewers check the draft against.
- `terms.yml`: the team's word list.

If `docs-kit.yml` doesn't exist, say so, and ask for the product name, the
readers, and the style guide before you continue.

## 2. Confirm the document type

Choose a type from the ones turned on under `doc_types` in `docs-kit.yml`,
based on what the reader does with the document:

| The reader wants to | Type |
| --- | --- |
| Set up hardware or software from scratch | `installation_guide` |
| Set up a feature after installation | `configuration_guide` |
| Do one task | `how_to` |
| Fix a problem they're seeing | `troubleshooting` |
| Learn what changed in a release | `release_notes` |
| Call an API | `api_reference` |
| Evaluate a technical approach | `white_paper` |
| Decide whether a product fits their industry | `solution_brief` |

Tell the writer which type you chose and why, and ask them to confirm
before you draft. If the request needs two types, such as setup and
troubleshooting, suggest two documents.

## 3. Gather the sources

Ask for the source material if the writer hasn't provided it: a spec,
ticket, notes, screenshots, or an expert's answers. Also read any sources
listed under `sources` in `docs-kit.yml` that apply.

Don't draft from general knowledge alone. If there's no source material,
say what you need, and stop.

## 4. Extract the facts

Before you write, list the facts the document needs, with where each one
came from. Use the template's sections as your guide. For example, an
installation guide needs prerequisites, steps, the expected result of each
step, and what to do when something fails.

For each fact you need but don't have, write a question for the writer.

## 5. Draft

1. Start from the template at `doc_types.templates_path`.
2. Fill in the front matter. Set `doc_type`, and leave `last_reviewed` as a
   placeholder for the person who checks the draft.
3. Write each section from your fact list, following the guidance in the
   template's comments.
4. Follow the style in `docs-kit.yml`: the base style guide, the voice
   setting, and the terms in `terms.yml`. If a domain pack is turned on,
   follow its rules, such as defining acronyms with the acronym first when
   the Telecom pack is on.
5. Mark every claim you couldn't confirm, following `checklists/verify.md`.
   Where a fact is missing, write `TODO:` and what's needed.
6. Delete the template's comments. Keep a placeholder only where a fact is
   missing, and mark it with `TODO:`.

## 6. Check your draft

Review the draft against `checklists/review.md`, the same way the
review-doc skill would. Fix what you can. If you can run commands, also run
the style and spelling checks:

```bash
python3 scripts/configure.py
vale <draft>
codespell <draft>
```

## 7. Deliver

Deliver the way `ai.deliver_as` says in `docs-kit.yml`:

- `pull_request`: create a branch, add the draft under
  `repository.content_path`, and open a pull request. Put the summary below
  in the pull request description.
- `files`: save the draft under `repository.content_path`, and give the
  summary in your reply.

The summary:

```markdown
**Draft:** <file path>
**Type:** <doc type> **Sources used:** <list>

**Needs your input:**
- <Each question and TODO, with the section it's in>

**Unverified claims:**
- "<claim>": <why it isn't confirmed>

**Checks:** <results, or "Not run">
```

## Rules

- Never invent facts, values, labels, links, or sources.
- Never fill a gap with a typical value or a value from a similar product.
- If the sources contradict each other, report both. Don't choose.
- Keep the draft to what the reader of this document type needs. Leave out
  background the template doesn't ask for.
