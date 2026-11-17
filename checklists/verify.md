# Verify claims

Rules for checking facts in a document. Both AI skills follow them: the
write skill while drafting, and the review skill while reviewing.

The goal is simple: a document never states something as fact unless a
source confirms it. When a claim can't be confirmed, the document says so,
and a person decides.

## What counts as a claim

A claim is anything a reader could act on or repeat, such as:

- Names: UI labels, menu paths, settings, fields, commands, and error messages
- Values: defaults, ranges, limits, units, ports, and version numbers
- Behavior: what happens when the reader does something, and in what order
- Requirements: prerequisites, permissions, licenses, and supported hardware
- Numbers in marketing documents: performance figures, savings, and statistics

General explanations of how a technology works aren't claims about the
product, but they must still be accurate.

## Where to check

Check claims against the sources listed under `sources` in `docs-kit.yml`,
plus any source material the writer provides for this document:

| Claim | Check against |
| --- | --- |
| UI labels and menu paths | `sources.ui_strings`, or screenshots the writer provides |
| API operations, parameters, and responses | `sources.api_spec` |
| Behavior, requirements, and limits | `sources.product_specs`, or the source material for this document |
| Figures and statistics | The study, test, or report they come from |

Search for the exact text of the claim, such as the label or the value, not
for the general topic. A related passage isn't confirmation.

## Outcomes

| Outcome | What to do |
| --- | --- |
| **Confirmed:** a source states the same thing | Keep the claim. Note the source in your summary for the writer, never in the document itself. |
| **Contradicted:** a source states something different | Don't change the claim yourself. Mark it unverified, and tell the writer what the source says and where. |
| **Not found:** no source mentions it | Mark it unverified. |
| **No source available:** `docs-kit.yml` lists no source for this kind of claim | Mark it unverified, and suggest a source the team could add. |
| **Gap:** a source mentions something the document leaves out, such as a prerequisite | Suggest adding it, and mark the suggestion for the writer to confirm. Never add it silently. |

## How to mark a claim

Put the marker set in `ai.unverified_marker` in `docs-kit.yml` right after
the claim. The default is `[unverified]`:

```markdown
The default transmit power is 23 dBm. [unverified]
```

The style check doesn't remove markers, so an unverified claim stays
visible in the pull request until a person confirms it and deletes the
marker.

## Rules

- Never invent a fact, value, label, link, or source. If something is
  missing, write `TODO:` and what's needed, such as `TODO: confirm the
  maximum number of devices per site`.
- Never fill a gap with a typical value, a value from a similar product, or
  a value you remember.
- When the writer's source material and another source disagree, report
  both. Don't choose.
