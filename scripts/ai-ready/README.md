# AI-readiness check

These files are copied from the
[docs-as-code kit](https://github.com/anglnmonica/docs-as-code-kit):
`scripts/ai-ready/rules.mjs`, `site.mjs`, and `cli.mjs`. Don't edit them
here. Change them in the kit, run its tests, and copy them again.

The Docs checks workflow runs them on every pull request. To run them on
your computer, build the site, then run:

```bash
mkdocs build
node scripts/ai-ready/cli.mjs --retrieval --site site --base-url https://anglnmonica.github.io/relay-api-docs/ docs/
```

`--retrieval` shows, for each question in a page's `questions` list, the
section a keyword search would retrieve first. The kit's
[AI-readiness checks](https://github.com/anglnmonica/docs-as-code-kit/blob/main/docs/ai-readiness.md)
page explains each rule.
