// AI-readiness checks for a whole built site: llms.txt, the sitemap,
// robots.txt, structured data, and Markdown copies of pages.
// Runs in Node, on the folder your site generator builds.

import fs from "node:fs";
import path from "node:path";

export const SITE_RULES = [
  {
    id: "llms-txt",
    title: "llms.txt that works",
    severity: "error",
    why: "llms.txt gives AI tools a map of your docs. A broken link in it sends them to a missing page.",
    fix: "Fix or remove each broken link, and keep each link's text matching its page title.",
  },
  {
    id: "sitemap",
    title: "Sitemap that lists every page",
    severity: "warning",
    why: "Search engines and crawlers find pages through the sitemap. A page that isn't listed may never be found.",
    fix: "Add the missing pages to sitemap.xml, or let your site generator build it.",
  },
  {
    id: "robots",
    title: "AI crawler access, on purpose",
    severity: "info",
    why: "robots.txt decides which AI crawlers can read your docs. Blocking or allowing them is a business decision, so this check only reports it.",
    fix: "Confirm that the crawlers listed are allowed or blocked on purpose.",
  },
  {
    id: "structured-data",
    title: "Structured data",
    severity: "suggestion",
    why: "Structured data (JSON-LD) tells search engines what a page is, such as a technical article or a how-to.",
    fix: "Add JSON-LD with a type such as TechArticle to your page layout.",
  },
  {
    id: "markdown-copies",
    title: "Markdown copies of pages",
    severity: "suggestion",
    why: "The llms.txt proposal suggests publishing a Markdown copy of each page, which AI tools read more reliably than HTML.",
    fix: "Publish page.md next to each page.html, and link to it from llms.txt.",
  },
];

const RULE = Object.fromEntries(SITE_RULES.map((r) => [r.id, r]));
const AI_CRAWLERS = ["GPTBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Google-Extended", "PerplexityBot", "CCBot", "Applebot-Extended"];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

// The page title from an HTML file, without a " | Site name" suffix.
function htmlTitle(file) {
  const m = fs.readFileSync(file, "utf8").match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? m[1].replace(/&amp;/g, "&").replace(/\s*[|·–—-]\s*[^|·–—-]*$/, "").trim() : "";
}

// Map a URL in llms.txt to a file in the built site, or null.
function resolve(siteDir, url, baseUrl) {
  let p = url;
  if (baseUrl && p.startsWith(baseUrl)) p = p.slice(baseUrl.length);
  else if (/^https?:\/\//.test(p)) return { external: true };
  p = decodeURI(p.split("#")[0].split("?")[0]).replace(/^\/+/, "");
  const candidates = [p, path.join(p, "index.html"), `${p}.html`, `${p.replace(/\/$/, "")}.html`];
  for (const c of candidates) {
    const f = path.join(siteDir, c);
    if (fs.existsSync(f) && fs.statSync(f).isFile()) return { file: f };
  }
  return { file: null };
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Check a built site.
 * @param {string} siteDir - the build output folder.
 * @param {string} baseUrl - the site's address, such as https://example.com/docs/
 */
export function checkSite(siteDir, baseUrl = "") {
  const findings = [];
  const add = (id, file, message) =>
    findings.push({ rule: id, severity: RULE[id].severity, file, message, fix: RULE[id].fix });
  if (baseUrl && !baseUrl.endsWith("/")) baseUrl += "/";

  const files = walk(siteDir);
  const pages = files.filter((f) => f.endsWith(".html") && !/\b404\b/.test(path.basename(f)));
  const rel = (f) => path.relative(siteDir, f);

  // llms.txt
  const llms = path.join(siteDir, "llms.txt");
  if (!fs.existsSync(llms)) {
    add("llms-txt", "llms.txt", "The site has no llms.txt.");
  } else {
    const text = fs.readFileSync(llms, "utf8");
    for (const m of text.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)) {
      const [, label, url] = m;
      const r = resolve(siteDir, url, baseUrl);
      if (r.external) continue;
      if (!r.file) {
        add("llms-txt", "llms.txt", `The link "${label}" goes to ${url}, which isn't in the built site.`);
        continue;
      }
      if (r.file.endsWith(".html")) {
        const title = htmlTitle(r.file);
        if (title && !norm(title).includes(norm(label)) && !norm(label).includes(norm(title))) {
          add("llms-txt", "llms.txt", `The link "${label}" goes to a page titled "${title}".`);
        }
      }
    }
  }

  // Sitemap
  const sitemap = path.join(siteDir, "sitemap.xml");
  if (!fs.existsSync(sitemap)) {
    add("sitemap", "sitemap.xml", "The site has no sitemap.xml.");
  } else {
    const xml = fs.readFileSync(sitemap, "utf8");
    const listed = new Set();
    for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
      const r = resolve(siteDir, m[1], baseUrl);
      if (r.file) listed.add(path.resolve(r.file));
    }
    const missing = pages.filter((p) => !listed.has(path.resolve(p)) && !/noindex/i.test(fs.readFileSync(p, "utf8").slice(0, 4000)));
    for (const p of missing.slice(0, 10)) add("sitemap", rel(p), "This page isn't in sitemap.xml.");
    if (missing.length > 10) add("sitemap", "sitemap.xml", `${missing.length - 10} more pages aren't listed.`);
  }

  // robots.txt: report, never fail.
  const robots = path.join(siteDir, "robots.txt");
  if (fs.existsSync(robots)) {
    const text = fs.readFileSync(robots, "utf8");
    const blocked = [];
    let agents = [];
    let readingAgents = false;
    for (const line of text.split("\n")) {
      const [k, ...v] = line.split(":");
      const key = (k || "").trim().toLowerCase();
      const val = v.join(":").trim();
      if (key === "user-agent") {
        if (!readingAgents) agents = [];
        agents.push(val);
        readingAgents = true;
      } else {
        readingAgents = false;
        if (key === "disallow" && val === "/") {
          for (const a of agents) if (a === "*" || AI_CRAWLERS.includes(a)) blocked.push(a);
        }
      }
    }
    const all = blocked.includes("*");
    const list = all ? AI_CRAWLERS : AI_CRAWLERS.filter((c) => blocked.includes(c));
    add("robots", "robots.txt", list.length ? `Blocked AI crawlers: ${list.join(", ")}.` : "No AI crawlers are blocked.");
  } else {
    add("robots", "robots.txt", "The site has no robots.txt, so all crawlers are allowed.");
  }

  // Structured data
  const withLd = pages.filter((p) => /application\/ld\+json/i.test(fs.readFileSync(p, "utf8")));
  if (pages.length && withLd.length === 0) {
    add("structured-data", "", `None of the ${pages.length} pages has structured data.`);
  }

  // Markdown copies
  const withMd = pages.filter((p) => fs.existsSync(p.replace(/\.html$/, ".md")) || fs.existsSync(`${p}.md`));
  if (pages.length && withMd.length === 0) {
    add("markdown-copies", "", "No page has a Markdown copy.");
  }

  return { findings, checked: SITE_RULES.map((r) => r.id), pages: pages.length };
}
