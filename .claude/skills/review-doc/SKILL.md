---
name: review-doc
description: >-
  Review a documentation draft or pull request against the team's docs-kit
  setup: its template, the review checklist, the style settings, and the
  fact-verification rules. Use when someone asks to review, check, or give
  feedback on a document. Reports findings by severity and never rewrites
  the document unless asked.
---

# Review a document

You review one document at a time and report what to fix, in order of
importance. You don't rewrite the document. The writer decides what to
change.

## 1. Load the team's setup

Read these files from the repository root:

- `docs-kit.yml`: the product, readers, style, domain packs, and sources.
- The checklist at `ai.review_checklist`. The default is
  `checklists/review.md`.
- The rules at `ai.verify_rules`. The default is `checklists/verify.md`.
- `terms.yml`: the team's word list.

If `docs-kit.yml` doesn't exist, say so, and ask the writer for the
product name, the readers, and the style guide before you continue.

## 2. Identify the document type

Read `doc_type` from the document's front matter. If it's missing, work it
out from the content, and ask the writer to confirm before you continue.

Load the matching template from `doc_types.templates_path`, such as
`templates/installation-guide.md`. The template's comments say who reads
this type of document and what each section is for. Review against those.

## 3. Run the automated checks, if you can

If you can run commands in the repository, run:

```bash
python3 scripts/configure.py
vale <document>
codespell <document>
```

Report their results in your review, grouped with your own findings. If you
can't run commands, say so in the summary, and note that the pull request
checks run them.

## 4. Review against the checklist

Go through every section of the checklist that applies to this document
type. For each problem:

- Quote the exact text, and give its line number or section heading.
- Say what's wrong, and why it matters to the reader.
- Suggest a fix. If the fix needs a fact you don't have, write `TODO:` and
  what's needed. Never suggest an invented value.

Skip checklist items that pass. Don't report the same problem more than
once; if it repeats, report it once and list where else it appears.

## 5. Verify claims

Follow `checklists/verify.md`. Check every claim against the sources in
`docs-kit.yml` and any source material the writer gave you. List each claim
you couldn't confirm.

## 6. Report

Use this format:

```markdown
## Review: <document title>

**Verdict:** <Ready to publish | Ready after fixes | Needs rework>
<One or two sentences on the main reason.>

**Checks run:** <Vale, codespell, or "Not run: no command access">

### Must fix
1. **<Section or line>:** "<quoted text>"
   <What's wrong and why.> **Fix:** <suggestion>

### Should fix
...

### Consider
...

### Unverified claims
| Claim | Outcome | Notes |
| --- | --- | --- |
| "<quoted claim>" | <Contradicted, Not found, or No source> | <What the source says, or what source to add> |

### What works
<Two or three specific strengths, so the writer knows what to keep.>
```

Leave out any section with no entries, except the verdict.

Use these verdicts:

- **Ready to publish:** no Must fix items and no unverified claims.
- **Ready after fixes:** Must fix items or unverified claims that the writer
  can resolve without restructuring.
- **Needs rework:** the document is the wrong type for its job, is missing
  required sections, or mixes several jobs.

## Rules

- Review the document you were given. Don't draft a new version unless the
  writer asks.
- Be specific. "Step 3 doesn't say what the reader sees when it works" is
  useful. "Improve clarity" isn't.
- Don't invent facts, sources, or standards. If you aren't sure something is
  wrong, say so, and put it under Consider.
