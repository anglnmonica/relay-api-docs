# Templates

A template for each common document type. Each one has placeholders in
angle brackets, such as `<product name>`, and comments that explain who
reads that type of document and what each section is for.

## Choose a template

| Template | Use it for | Example title |
| --- | --- | --- |
| [Installation guide](installation-guide.md) | Getting hardware or software from the box to a working state | Install the access point |
| [Configuration guide](configuration-guide.md) | Setting up a feature after installation | Configure single sign-on |
| [How-to](how-to.md) | One task with one result | Export a network report |
| [Troubleshooting](troubleshooting.md) | Problems readers can recognize and fix themselves | Troubleshoot device connections |
| [Release notes](release-notes.md) | What changed in one release, and what to do before upgrading | Release 4.2 release notes |
| [API reference](api-reference.md) | The overview of a REST API, and endpoint pages you can't generate from a spec | Network API reference |
| [White paper](white-paper.md) | An evidence-based case that an approach solves an industry problem | Reliable timing for private 5G networks |
| [Solution brief](solution-brief.md) | A one- or two-page summary of how a product solves one industry's problem | Reliable connectivity for remote sites |

Not sure which to use? Ask what the reader is trying to do:

- **Set something up:** an installation or configuration guide.
- **Do one thing:** a how-to.
- **Fix something:** troubleshooting.
- **Decide whether to upgrade:** release notes.
- **Build an integration:** API reference.
- **Decide whether to buy:** a solution brief, or a white paper for a
  technical evaluation.

## Start a document

1. Copy the template into your docs folder, and rename it after the
   document, such as `install-access-point.md`.
2. Replace every placeholder in angle brackets.
3. Delete any section marked optional that you don't need.
4. Delete the comments.
5. Open a pull request. The checks run on the new page like any other.

## Turn templates on or off

The `doc_types` section of `docs-kit.yml` lists the templates your team
uses. The AI skills, when they're added, offer only the types turned on
there. If a type is turned on but its template is missing,
`scripts/configure.py` prints a warning.

## Front matter

Each template starts with the same fields, so pages stay consistent and
tools can sort them:

| Field | Description |
| --- | --- |
| `title` | The page title, in sentence case. |
| `description` | One sentence for search results and link previews. |
| `doc_type` | The template the page was made from. |
| `audience` | Who the page is for. |
| `product_version` | The version the page applies to. API references use `api_version`. |
| `last_reviewed` | When someone last checked the page against the product. |

Release notes also have `release_date`. Delete any field your site
generator doesn't use.
