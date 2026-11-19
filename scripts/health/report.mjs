#!/usr/bin/env node
// Build the docs health report, or check that no draft page is about to
// be published.
//
// Usage:
//   node scripts/health/report.mjs [--out FOLDER] [--title TEXT]
//        [--config .docs-kit/health.json] [--today YYYY-MM-DD]
//        [--check-status] [--json] PATH...
//
// --out writes index.html and report.json to FOLDER, so you can publish the
// report with your site. --check-status exits with status 1 when a page is
// marked status: draft, or has a status the kit doesn't know. Without
// --out, the report prints as text.

import fs from "node:fs";
import path from "node:path";
import { buildReport, markdownFiles, publishProblems, STATUSES } from "./health.mjs";

function parseArgs(argv) {
  const opts = { paths: [], out: null, title: "Docs health", config: null, today: null, checkStatus: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") opts.out = argv[++i];
    else if (a === "--title") opts.title = argv[++i];
    else if (a === "--config") opts.config = argv[++i];
    else if (a === "--today") opts.today = argv[++i];
    else if (a === "--check-status") opts.checkStatus = true;
    else if (a === "--json") opts.json = true;
    else if (a === "--help" || a === "-h") opts.help = true;
    else opts.paths.push(a);
  }
  return opts;
}

const opts = parseArgs(process.argv.slice(2));
if (opts.help || !opts.paths.length) {
  console.log("Usage: node scripts/health/report.mjs [--out FOLDER] [--title TEXT] [--config FILE] [--today YYYY-MM-DD] [--check-status] [--json] PATH...");
  process.exit(opts.help ? 0 : 2);
}
for (const p of opts.paths) {
  if (!fs.existsSync(p)) {
    console.error(`${p} doesn't exist.`);
    process.exit(2);
  }
}

// Settings from docs-kit.yml and terms.yml, written by scripts/configure.py.
function readJson(file, required) {
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"));
  if (required) {
    console.error(`${file} doesn't exist. Run python3 scripts/configure.py to write it.`);
    process.exit(2);
  }
  return {};
}
const health = readJson(opts.config || ".docs-kit/health.json", Boolean(opts.config));
const aiReady = readJson(".docs-kit/ai-ready.json", false);

let today = new Date();
if (opts.today) {
  today = new Date(`${opts.today}T00:00:00Z`);
  if (Number.isNaN(today.getTime())) {
    console.error(`--today ${opts.today} isn't a date. Use YYYY-MM-DD.`);
    process.exit(2);
  }
}

const report = buildReport(markdownFiles(opts.paths), {
  today,
  reviewEveryDays: health.review_every_days ?? 180,
  pageOptions: { skip: aiReady.skip || [], termGroups: aiReady.term_groups || [] },
});

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const s = report.summary;
const lines = [
  `${opts.title}: ${s.pages} pages, ${report.generated}`,
  `  Status: ${STATUSES.map((st) => `${s.status[st]} ${st}`).join(", ")}, ${s.status["not-set"]} not set`,
  `  Review due: ${s.reviewDue} (older than ${report.reviewEveryDays} days); no review date: ${s.reviewMissing}`,
  `  AI readiness: ${s.aiChecksPassed}% of checks pass; ${s.pagesWithErrors} pages with errors; ${s.pagesWithoutQuestions} pages with no questions list`,
];
const attention = report.pages.filter((p) => p.review !== "current" || p.status === "draft" || p.ai.errors);
if (attention.length) {
  lines.push("  Needs attention:");
  for (const p of attention) {
    const why = [
      p.review === "due" && `review due since ${p.reviewDueOn}`,
      p.review === "missing" && "no review date",
      p.status === "draft" && "draft",
      p.ai.errors && `${p.ai.errors} AI-readiness errors`,
    ].filter(Boolean);
    lines.push(`    ${p.file}: ${why.join("; ")}`);
  }
}

if (opts.json) console.log(JSON.stringify(report, null, 2));
else console.log(lines.join("\n"));

if (opts.out) {
  fs.mkdirSync(opts.out, { recursive: true });
  fs.writeFileSync(path.join(opts.out, "report.json"), JSON.stringify(report, null, 2) + "\n");
  fs.writeFileSync(path.join(opts.out, "index.html"), renderHtml(report, opts.title));
  if (!opts.json) console.log(`\nWrote ${path.join(opts.out, "index.html")} and report.json.`);
}

// In GitHub Actions, also show the summary on the run's page.
if (process.env.GITHUB_STEP_SUMMARY) {
  const md = [
    `### ${opts.title}`,
    "",
    "| Pages | Published | In review | Draft | Review due | AI checks passed |",
    "| --- | --- | --- | --- | --- | --- |",
    `| ${s.pages} | ${s.status.published} | ${s.status["in-review"]} | ${s.status.draft} | ${s.reviewDue} | ${s.aiChecksPassed}% |`,
    "",
  ];
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md.join("\n"));
}

if (opts.checkStatus) {
  const problems = publishProblems(report);
  if (problems.length) {
    console.error("\nNot ready to publish:");
    for (const p of problems) console.error(`  ${p.message}`);
    process.exit(1);
  }
  if (!opts.json) console.log("\nPublish readiness: no page is marked draft.");
}

// ---------------------------------------------------------------------------
// The HTML page
// ---------------------------------------------------------------------------

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function renderHtml(r, title) {
  const s = r.summary;
  const label = { draft: "Draft", "in-review": "In review", published: "Published", "not-set": "Not set" };
  const rank = (p) => (p.review === "due" ? 0 : p.status === "draft" ? 1 : p.ai.errors ? 2 : p.review === "missing" ? 3 : p.status === "in-review" ? 4 : 5);
  const pages = [...r.pages].sort((a, b) => rank(a) - rank(b) || a.ai.passed / a.ai.total - b.ai.passed / b.ai.total || a.file.localeCompare(b.file));

  const rows = pages
    .map((p) => {
      const pct = p.ai.total ? Math.round((100 * p.ai.passed) / p.ai.total) : 100;
      const review =
        p.review === "due"
          ? `<span class="flag flag--due">Review due</span><span class="sub">Last reviewed ${esc(p.lastReviewed)}, ${p.reviewAgeDays} days ago</span>`
          : p.review === "missing"
            ? `<span class="flag flag--missing">No review date</span>`
            : `<span class="date">${esc(p.lastReviewed)}</span><span class="sub date">Due ${esc(p.reviewDueOn)}</span>`;
      const failing = p.ai.failing.length ? `<span class="sub">To fix: ${p.ai.failing.map(esc).join(", ")}</span>` : "";
      const tags = [p.review, p.status, p.ai.errors ? "errors" : "", p.questions ? "" : "no-questions"].join(" ");
      return `<tr data-tags="${esc(tags)}">
  <td><span class="title">${esc(p.title)}</span><span class="sub file">${esc(p.file)}</span></td>
  <td><span class="status status--${esc(p.statusValid ? p.status : "invalid")}">${esc(label[p.status] || p.status)}</span></td>
  <td>${review}</td>
  <td><span class="score">${p.ai.passed} of ${p.ai.total}</span><span class="bar" aria-hidden="true"><span style="width:${pct}%"></span></span>${failing}</td>
  <td class="num">${p.questions || '<span class="flag flag--missing">None</span>'}</td>
</tr>`;
    })
    .join("\n");

  const tile = (n, text, filter, warn) =>
    `<button type="button" class="tile${warn && n ? " tile--warn" : ""}" data-filter="${filter}" aria-pressed="false"><span class="n">${n}</span><span class="t">${text}</span></button>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)}</title>
<style>
:root {
  --bg: #ffffff; --panel: #f6f7f9; --ink: #1c2430; --muted: #5b6676; --line: #dfe3e8;
  --accent: #1f5fbf; --good: #1d7a46; --warn: #a14a00; --warn-bg: #fff3e6; --bad: #b42318; --bad-bg: #fdecea;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #12161c; --panel: #1b2129; --ink: #e6eaf0; --muted: #9aa5b4; --line: #2c3540;
    --accent: #7fb0ff; --good: #5cc98a; --warn: #f0a35e; --warn-bg: #3a2a1a; --bad: #ff8a80; --bad-bg: #3b1d1b;
  }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
main { max-width: 1100px; margin: 0 auto; padding: 32px 16px 64px; }
h1 { font-size: 28px; margin: 0 0 4px; }
.lede { color: var(--muted); margin: 0 0 24px; max-width: 46em; }
.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 8px; }
.tile { text-align: left; font: inherit; color: inherit; background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 12px 14px; cursor: pointer; }
.tile:hover { border-color: var(--accent); }
.tile[aria-pressed="true"] { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
.tile:focus-visible, button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.tile .n { display: block; font-size: 26px; font-weight: 700; line-height: 1.2; }
.tile .t { color: var(--muted); font-size: 14px; }
.tile--warn .n { color: var(--warn); }
.tile--static { cursor: default; }
.tile--static:hover { border-color: var(--line); }
.date { white-space: nowrap; }
.hint { color: var(--muted); font-size: 14px; margin: 0 0 16px; }
.wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 8px; }
table { width: 100%; border-collapse: collapse; font-size: 15px; }
th, td { padding: 10px 12px; text-align: left; vertical-align: top; border-bottom: 1px solid var(--line); }
th { background: var(--panel); font-size: 13px; font-weight: 600; color: var(--muted); white-space: nowrap; }
tr:last-child td { border-bottom: 0; }
tr[hidden] { display: none; }
.title { font-weight: 600; }
.sub { display: block; color: var(--muted); font-size: 13px; }
.file { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px; word-break: break-all; }
.num { text-align: right; }
.status, .flag { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 13px; white-space: nowrap; border: 1px solid var(--line); }
.status--published { color: var(--good); border-color: currentColor; }
.status--in-review { color: var(--accent); border-color: currentColor; }
.status--draft, .status--invalid { color: var(--bad); border-color: currentColor; }
.status--not-set { color: var(--muted); }
.flag--due { color: var(--warn); background: var(--warn-bg); border-color: transparent; }
.flag--missing { color: var(--muted); }
.score { font-variant-numeric: tabular-nums; }
.bar { display: block; height: 4px; width: 100px; max-width: 100%; background: var(--line); border-radius: 2px; margin: 4px 0; }
.bar span { display: block; height: 100%; background: var(--accent); border-radius: 2px; }
footer { margin-top: 24px; color: var(--muted); font-size: 14px; }
footer a { color: var(--accent); }
</style>
</head>
<body>
<main>
<h1>${esc(title)}</h1>
<p class="lede">The state of every page on ${esc(r.generated)}: its status, when it was last reviewed, and how many AI-readiness checks it passes. Pages that need attention come first. A review is due after ${r.reviewEveryDays} days.</p>
<div class="tiles" role="group" aria-label="Show only">
${tile(s.pages, "pages", "all", false)}
${tile(s.reviewDue, "reviews due", "due", true)}
${tile(s.status.draft + s.status["in-review"], "drafts and pages in review", "unpublished", true)}
${tile(s.pagesWithErrors, "pages with AI-readiness errors", "errors", true)}
${tile(s.pagesWithoutQuestions, "pages with no questions list", "no-questions", false)}
<div class="tile tile--static"><span class="n">${s.aiChecksPassed}%</span><span class="t">of AI-readiness checks pass</span></div>
</div>
<p class="hint">Select a number to show only those pages. Select it again to show every page.</p>
<div class="wrap">
<table>
<thead><tr><th scope="col">Page</th><th scope="col">Status</th><th scope="col">Last reviewed</th><th scope="col">AI readiness</th><th scope="col" class="num">Questions</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>
</div>
<footer>Built by the <a href="https://github.com/anglnmonica/docs-as-code-kit">docs-as-code kit</a> on every merge. The data is in <a href="report.json">report.json</a>.</footer>
</main>
<script>
const match = { all: () => true, due: (t) => t.includes("due"), unpublished: (t) => /\\b(draft|in-review)\\b/.test(t), errors: (t) => t.includes("errors"), "no-questions": (t) => t.includes("no-questions") };
const tiles = [...document.querySelectorAll("button.tile")];
tiles.forEach((tile) => tile.addEventListener("click", () => {
  const on = tile.getAttribute("aria-pressed") !== "true" && tile.dataset.filter !== "all";
  tiles.forEach((t) => t.setAttribute("aria-pressed", "false"));
  if (on) tile.setAttribute("aria-pressed", "true");
  const test = match[on ? tile.dataset.filter : "all"];
  document.querySelectorAll("tbody tr").forEach((row) => { row.hidden = !test(row.dataset.tags.split(" ")); });
}));
</script>
</body>
</html>
`;
}
