# Docs health report

These files are copied from the
[docs-as-code kit](https://github.com/anglnmonica/docs-as-code-kit):
`scripts/health/health.mjs` and `report.mjs`. Don't edit them here. Change
them in the kit, run its tests, and copy them again.

The report lists every page's status, review date, and AI-readiness score.
The Publish site workflow publishes it at `/relay-api-docs/docs-health/` on
every merge and every Monday. The Docs checks workflow also fails a pull
request that would merge a page marked `status: draft`.

To build the report on your computer:

```bash
node scripts/health/report.mjs --out docs-health docs/
```
