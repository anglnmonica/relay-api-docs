# Review checklist

What the review skill checks a document against. Writers can use it on
their own, too.

Each item has a level:

- **Must fix:** the document is wrong, unsafe, or unusable without the fix.
- **Should fix:** the document works, but readers or AI tools struggle with it.
- **Consider:** an improvement worth making when there's time.

Many items come from writing for AI readers. AI assistants and agents
retrieve single sections, fill gaps with guesses, and can't tell what
success looks like unless the document says so. Every item here helps
people, too.

## Accuracy

- [ ] **Must fix:** Every claim is confirmed by a source, or marked
  unverified. See [verify.md](verify.md).
- [ ] **Must fix:** No placeholders in angle brackets, `TODO:` notes, or
  template comments are left in a document marked ready to publish.
- [ ] **Must fix:** Safety warnings come before the step they apply to.
- [ ] **Should fix:** The page shows which product version it applies to,
  and when it was last reviewed.

## Fit with its template

- [ ] **Must fix:** The document follows the template for its `doc_type`,
  with every required section present.
- [ ] **Should fix:** Sections are in the template's order, unless there's a
  reason to change it.
- [ ] **Should fix:** The document does one job. A page that mixes setup,
  troubleshooting, and reference should be split.

## Structure

- [ ] **Should fix:** Each section makes sense on its own. It names the
  product or feature instead of saying `as described above`.
- [ ] **Should fix:** Headings say what the section answers or does, such
  as "Register a small cell," not "Step 2" or "Overview."
- [ ] **Should fix:** Headings, lists, and tables use real Markdown, not
  text formatted to look like them.
- [ ] **Consider:** Long procedures are split into stages, each with its own
  heading.

## Language

- [ ] **Must fix:** The document follows the style set in `docs-kit.yml`,
  and the style check reports no errors.
- [ ] **Should fix:** One term means one thing throughout, and terms match
  `terms.yml`.
- [ ] **Should fix:** `It`, `this`, and `the above` are replaced with the
  noun they refer to, where the meaning could be unclear.
- [ ] **Should fix:** Acronyms are defined on every page that uses them, not
  only on the first page of a guide.
- [ ] **Should fix:** Link text describes the destination. No "click here."

## Procedures

- [ ] **Must fix:** Prerequisites come before the first step.
- [ ] **Must fix:** Actions that can't be undone are marked as such, before
  the step.
- [ ] **Should fix:** Each step has one action and starts with a verb.
- [ ] **Should fix:** Names, units, ranges, and defaults are exact, such as
  "Valid range: 0 to 30 dBm. Default: 23 dBm."
- [ ] **Should fix:** Steps that change something say what the reader sees
  when it worked.
- [ ] **Should fix:** Error messages appear word for word, with the cause
  and the fix.
- [ ] **Consider:** Constraints explain why, such as "Upload the device data
  first. Enabling registration first disconnects all users."

## API reference

Only for `api_reference` documents.

- [ ] **Must fix:** Every endpoint has a complete, working example request
  and response.
- [ ] **Must fix:** Every parameter and field has a description, type, and
  whether it's required.
- [ ] **Should fix:** Limits are stated: rate limits, maximum values, and any
  required order of calls.

## Images and media

- [ ] **Must fix:** Every value, field name, and menu path in a screenshot is
  also in the text.
- [ ] **Should fix:** Images have alt text that describes what they show,
  including any values or labels.
- [ ] **Should fix:** No visual directions, such as "the blue button on the
  right."
- [ ] **Should fix:** Videos have transcripts.

## Marketing documents

Only for `white_paper` and `solution_brief` documents.

- [ ] **Must fix:** Every figure has a source, and the source is cited.
- [ ] **Should fix:** The problem is described before the product.
- [ ] **Should fix:** Claims are specific and measurable, not "best-in-class"
  or "seamless."
