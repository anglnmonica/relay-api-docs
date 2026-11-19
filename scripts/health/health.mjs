// Docs health: one report on every page in a docs repository.
//
// For each page, the report gives its title, status, review date, and
// AI-readiness score. The summary answers the question a docs lead asks
// first: which pages are stale, unfinished, or hard for readers and AI tools
// to use right now?
//
// No dependencies, so it runs anywhere Node.js 18 or later runs.

import fs from "node:fs";
import path from "node:path";
import { checkPage, summarize, frontMatter } from "../ai-ready/rules.mjs";

/** The page statuses the kit accepts, in workflow order. */
export const STATUSES = ["draft", "in-review", "published"];

const DAY = 24 * 60 * 60 * 1000;

/** Every Markdown file under the given paths, sorted. */
export function markdownFiles(paths) {
  const out = [];
  const walk = (p) => {
    const stat = fs.statSync(p);
    if (stat.isFile()) {
      if (/\.(md|mdx|markdown)$/.test(p)) out.push(p);
      return;
    }
    for (const e of fs.readdirSync(p, { withFileTypes: true })) {
      if (e.name.startsWith(".") || e.name === "node_modules") continue;
      walk(path.join(p, e.name));
    }
  };
  for (const p of paths) walk(p);
  return [...new Set(out)].sort();
}

function parseDate(value) {
  const m = String(value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * The health of one page.
 *
 * options.today: the date to measure review age from (a Date).
 * options.reviewEveryDays: how old a review can be before it's due.
 * options.pageOptions: passed to the AI-readiness checkPage().
 */
export function pageHealth(file, markdown, options = {}) {
  const today = options.today || new Date();
  const reviewEveryDays = options.reviewEveryDays ?? 180;
  const fm = frontMatter(markdown) || {};
  const { findings, checked } = checkPage(markdown, options.pageOptions || {});
  const ai = summarize(findings, checked);
  const reviewed = parseDate(fm.last_reviewed);
  const ageDays = reviewed ? Math.floor((today - reviewed) / DAY) : null;
  const rawStatus = typeof fm.status === "string" ? fm.status.trim().toLowerCase() : "";

  let review = "missing";
  if (ageDays !== null) review = ageDays > reviewEveryDays ? "due" : "current";

  const firstHeading = markdown.match(/^#\s+(.+)$/m);
  return {
    file,
    title: (typeof fm.title === "string" && fm.title) || (firstHeading && firstHeading[1].trim()) || path.basename(file),
    status: rawStatus || "not-set",
    statusValid: !rawStatus || STATUSES.includes(rawStatus),
    lastReviewed: reviewed ? reviewed.toISOString().slice(0, 10) : null,
    reviewAgeDays: ageDays,
    review,
    reviewDueOn: reviewed ? new Date(reviewed.getTime() + reviewEveryDays * DAY).toISOString().slice(0, 10) : null,
    questions: Array.isArray(fm.questions) ? fm.questions.filter((q) => q && !/^</.test(q)).length : 0,
    ai: {
      passed: ai.passed,
      total: ai.total,
      errors: findings.filter((f) => f.severity === "error").length,
      warnings: findings.filter((f) => f.severity === "warning").length,
      suggestions: findings.filter((f) => f.severity === "suggestion").length,
      failing: [...new Set(findings.map((f) => f.rule))],
    },
  };
}

/** The health of every page, plus a summary. */
export function buildReport(files, options = {}) {
  const today = options.today || new Date();
  const pages = files
    .map((file) => ({ file, text: fs.readFileSync(file, "utf8") }))
    .filter(({ text }) => text.trim()) // An empty file is a placeholder, not a page.
    .map(({ file, text }) => pageHealth(path.relative(options.root || ".", file), text, { ...options, today }));

  const count = (fn) => pages.filter(fn).length;
  const passed = pages.reduce((n, p) => n + p.ai.passed, 0);
  const total = pages.reduce((n, p) => n + p.ai.total, 0);
  return {
    generated: today.toISOString().slice(0, 10),
    reviewEveryDays: options.reviewEveryDays ?? 180,
    summary: {
      pages: pages.length,
      status: Object.fromEntries([...STATUSES, "not-set"].map((s) => [s, count((p) => p.status === s)])),
      invalidStatus: count((p) => !p.statusValid),
      reviewDue: count((p) => p.review === "due"),
      reviewMissing: count((p) => p.review === "missing"),
      aiChecksPassed: total ? Math.round((100 * passed) / total) : 100,
      pagesWithErrors: count((p) => p.ai.errors > 0),
      pagesWithoutQuestions: count((p) => p.questions === 0),
    },
    pages,
  };
}

/**
 * Pages that aren't ready to publish: marked draft, or with a status the
 * kit doesn't know. Pages with no status pass, so existing docs don't fail
 * the day a team turns the check on.
 */
export function publishProblems(report) {
  return report.pages
    .filter((p) => p.status === "draft" || !p.statusValid)
    .map((p) => ({
      file: p.file,
      message: p.statusValid
        ? `${p.file} is marked status: draft. Change it to in-review or published when it's ready to merge.`
        : `${p.file} has status: ${p.status}, which isn't one of ${STATUSES.join(", ")}.`,
    }));
}
