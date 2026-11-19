// AI-readiness rules for one documentation page.
//
// AI assistants, search engines, and retrieval systems quote one section of a
// page at a time, out of context. These rules find what makes a section hard
// to quote correctly. Every rule also helps people who read the page.
//
// This file has no dependencies and no Node or browser code, so the same
// rules run in CI (cli.mjs) and in a browser demo. Change a rule here, and
// both change.

export const PAGE_RULES = [
  {
    id: "front-matter",
    title: "Title and description",
    severity: "warning",
    why: "Search engines and AI tools use the page's title and description as its summary. Without them, they guess.",
    fix: "Add a title and a one-sentence description (or excerpt) to the front matter.",
  },
  {
    id: "last-updated",
    title: "Last-updated date",
    severity: "warning",
    why: "A dated page tells readers and AI tools how current its facts are.",
    fix: "Add last_reviewed (or last_updated) to the front matter, as YYYY-MM-DD.",
  },
  {
    id: "heading-levels",
    title: "No skipped heading levels",
    severity: "warning",
    why: "Tools split pages by headings. A jump from H2 to H4 breaks the outline they build.",
    fix: "Use the next heading level down, such as H3 after H2.",
  },
  {
    id: "section-length",
    title: "Sections short enough to quote",
    severity: "warning",
    why: "AI tools retrieve one section at a time. A section over about 400 words of text, not counting tables and code, is hard to quote in one piece.",
    fix: "Split the section under more specific headings.",
  },
  {
    id: "cross-reference",
    title: "Sections that make sense on their own",
    severity: "warning",
    why: "A quoted section loses the text around it. \"As mentioned earlier\" points to text the reader doesn't have.",
    fix: "Repeat the fact, or link to the section by name.",
  },
  {
    id: "section-opener",
    title: "Sections that name their subject",
    severity: "warning",
    why: "A section that starts with \"It\" or \"This is\" doesn't say what it's about once it's quoted alone.",
    fix: "Start the section with the name of the product, feature, or task.",
  },
  {
    id: "relative-dates",
    title: "Dates that stay true",
    severity: "warning",
    why: "\"Last year\" and \"currently\" become wrong as the page ages, and a quote doesn't show when the page was written.",
    fix: "Write a date or a version instead, such as \"as of version 4.2.\"",
  },
  {
    id: "number-units",
    title: "Numbers with units",
    severity: "warning",
    why: "\"Set the timeout to 30\" can mean seconds or milliseconds. A quote can't ask.",
    fix: "Add the unit, such as \"30 seconds.\"",
  },
  {
    id: "leftover-markers",
    title: "No unfinished content",
    severity: "error",
    why: "A TODO or [unverified] marker in a published page tells readers and AI tools the content isn't confirmed.",
    fix: "Resolve the marker, or remove the sentence.",
  },
  {
    id: "image-alt",
    title: "Images described in text",
    severity: "warning",
    why: "AI tools and screen readers can't see images. The alt text is all they get.",
    fix: "Write alt text that says what the image shows. For a diagram, describe the flow or the parts.",
  },
  {
    id: "code-language",
    title: "Code blocks labeled with a language",
    severity: "warning",
    why: "A language label tells tools whether a block is a command, a config file, or output, so they don't run or quote the wrong thing.",
    fix: "Add the language right after the opening fence, such as bash or json.",
  },
  {
    id: "table-header",
    title: "Tables with headers",
    severity: "warning",
    why: "Tools read a table cell by its column header. A column with no header loses its meaning.",
    fix: "Give every column a header.",
  },
  {
    id: "link-text",
    title: "Link text that names the destination",
    severity: "warning",
    why: "\"Click here\" tells a reader or an AI tool nothing about where the link goes.",
    fix: "Use the destination's title as the link text.",
  },
  {
    id: "term-consistency",
    title: "One name for each thing",
    severity: "suggestion",
    why: "A reader or an AI tool that sees \"access point\" in one section and \"radio\" in the next can't tell whether they're one device or two.",
    fix: "Choose one term, and use it throughout. If the terms mean different things, define each one where it first appears.",
  },
  {
    id: "questions",
    title: "Questions the page answers",
    severity: "suggestion",
    why: "Listing the questions a page answers lets a reviewer, or the review-doc skill, check that each one has a clear answer.",
    fix: "Add a questions list to the front matter, with the questions readers ask.",
  },
];

const RULE = Object.fromEntries(PAGE_RULES.map((r) => [r.id, r]));

const CROSS_REFERENCE = [
  /\bas (mentioned|described|shown|noted|explained|discussed|stated) (above|below|earlier|previously|before)\b/i,
  /\b(see|shown|described|listed) (above|below)\b/i,
  /\bthe (previous|preceding|following|next|last) (section|chapter|step)s?\b/i,
  /\b(above|below)-mentioned\b/i,
];

const RELATIVE_DATES =
  /\b(last|next|this) (year|month|week|quarter|release)\b|\b(recently|currently|nowadays|these days|at the moment|at present|soon|in the near future|up to now|to date)\b/i;

const VAGUE_LINK = /^(click here|here|this|this page|this link|link|read more|more|learn more|this article|this document)$/i;

const OPENER = /^(It|They)\b|^(This|These|That|Those)\s+(is|are|was|were|has|have|can|will|lets|let|means|makes|allows|does|do|shows|provides|gives|helps)\b/;

const UNIT_WORDS =
  "timeout|interval|delay|duration|period|wait|retention|threshold|limit|bandwidth|rate|latency|size|capacity|lifetime|expiry|expiration|ttl";
const NUMBER_NO_UNIT = new RegExp(
  `\\b(${UNIT_WORDS})s?\\b[^.\\n]{0,15}?\\b(to|of|is|at|=)\\s+(\\d+(?:\\.\\d+)?)(?!\\s*(?:%|[a-zA-Zµ°]|-|\\.?\\d))`,
  "i",
);

const LEFTOVER = /\bTODO\b:?|\[unverified\]/;
const DIAGRAM_FILE = /diagram|architecture|flow|chart|topology|sequence/i;
const DATE = /^\d{4}-\d{2}-\d{2}/;
const LIMIT_WORDS = 400;

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

function parseFrontMatter(lines) {
  if (lines[0]?.trim() !== "---") return { data: null, end: 0 };
  const data = {};
  let key = null;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "---") return { data, end: i + 1 };
    // A list item, indented or not: YAML allows "- item" at the start of
    // the line under its key.
    const item = line.match(/^\s*-\s+(.*)$/);
    if (item && key && (data[key] === "" || Array.isArray(data[key]))) {
      if (!Array.isArray(data[key])) data[key] = [];
      data[key].push(unquote(item[1]));
      continue;
    }
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) {
      key = kv[1];
      const inline = kv[2].match(/^\[(.*)\]\s*$/);
      data[key] = inline
        ? inline[1].split(",").map(unquote).filter(Boolean)
        : kv[2] === "" ? "" : unquote(kv[2]);
    }
  }
  return { data: null, end: 0 };
}

function unquote(s) {
  return s.trim().replace(/^["'](.*)["']$/, "$1");
}

// Remove inline code and HTML comments from a line, keeping its length
// roughly the same so columns stay meaningful.
function textOf(line) {
  return line.replace(/`[^`]*`/g, (m) => " ".repeat(m.length)).replace(/<!--.*?-->/g, "");
}

function words(s) {
  return (s.match(/[A-Za-z0-9][\w'’-]*/g) || []).length;
}

// ---------------------------------------------------------------------------
// Checking
// ---------------------------------------------------------------------------

/**
 * Check one Markdown page.
 * @param {string} markdown - the page's source.
 * @returns {{findings: Array, checked: string[]}} findings, and the ids of the
 *   rules that ran.
 */
export function checkPage(markdown, options = {}) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const skip = new Set(options.skip || []);
  const termGroups = (options.termGroups || []).filter((g) => Array.isArray(g) && g.length > 1);
  if (!termGroups.length) skip.add("term-consistency");
  const findings = [];
  const add = (id, line, message) => {
    if (!skip.has(id)) findings.push({ rule: id, severity: RULE[id].severity, line, message, fix: RULE[id].fix });
  };

  const fm = parseFrontMatter(lines);
  const checked = PAGE_RULES.map((r) => r.id).filter((id) => !skip.has(id));
  const termUses = termGroups.map((g) => g.map(() => ({ count: 0, line: 0 })));

  // Front matter rules.
  const description = fm.data && (fm.data.description || fm.data.excerpt || fm.data.summary);
  if (!fm.data || !fm.data.title || !description || /^</.test(fm.data.title) || /^</.test(description)) {
    add("front-matter", 1, !fm.data ? "The page has no front matter." : "The front matter needs a title and a description.");
  }
  const updated = fm.data && (fm.data.last_reviewed || fm.data.last_updated || fm.data.date);
  if (!updated || !DATE.test(updated)) {
    add("last-updated", 1, "The front matter has no last-updated date.");
  }
  if (!fm.data || !Array.isArray(fm.data.questions) || fm.data.questions.length === 0) {
    add("questions", 1, "The front matter doesn't list the questions this page answers.");
  }

  // Body rules.
  let inCode = false;
  let inComment = false;
  let lastLevel = 0;
  let section = { title: null, line: fm.end + 1, words: 0, firstText: null };
  const sections = [];

  for (let i = fm.end; i < lines.length; i++) {
    const n = i + 1;
    const raw = lines[i];

    const fence = raw.match(/^\s*(```|~~~)\s*([\w+-]*)/);
    if (fence) {
      if (!inCode && !fence[2]) add("code-language", n, "This code block has no language label.");
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;
    // Multi-line HTML comments, such as template notes. One-line comments are
    // removed by textOf().
    if (inComment) {
      if (raw.includes("-->")) inComment = false;
      continue;
    }
    if (raw.includes("<!--") && !raw.slice(raw.indexOf("<!--")).includes("-->")) {
      inComment = true;
      continue;
    }

    const heading = raw.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      if (lastLevel && level > lastLevel + 1) {
        add("heading-levels", n, `This H${level} follows an H${lastLevel}.`);
      }
      lastLevel = level;
      sections.push(section);
      section = { title: heading[2].trim(), line: n, words: 0, firstText: null };
      continue;
    }

    // An HTML heading, such as <h2>, also starts a section.
    const htmlHeading = raw.match(/<h([1-6])\b[^>]*>(.*?)<\/h\1>/i);
    if (htmlHeading) {
      sections.push(section);
      section = { title: htmlHeading[2].replace(/<[^>]+>/g, "").trim(), line: n, words: 0, firstText: null };
      continue;
    }

    const text = textOf(raw);
    const plain = text.trim();
    if (!plain) continue;

    // Tables.
    if (/^\|.*\|$/.test(plain)) {
      const next = (lines[i + 1] || "").trim();
      if (/^\|?\s*:?-{2,}/.test(next)) {
        const cells = plain.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
        if (cells.some((c) => c === "")) add("table-header", n, "This table has a column with no header.");
      }
      // Tables are quoted as a unit, so they don't count toward section length.
      continue;
    }

    // Images.
    for (const m of text.matchAll(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g)) {
      checkImage(add, n, m[1], m[2]);
    }
    for (const m of text.matchAll(/<img\b[^>]*>/gi)) {
      const alt = m[0].match(/\balt\s*=\s*"([^"]*)"/i);
      const src = m[0].match(/\bsrc\s*=\s*"([^"]*)"/i);
      checkImage(add, n, alt ? alt[1] : null, src ? src[1] : "");
    }

    // Links.
    for (const m of text.matchAll(/(?<!!)\[([^\]]+)\]\([^)]+\)/g)) {
      if (VAGUE_LINK.test(m[1].trim())) add("link-text", n, `The link text "${m[1].trim()}" doesn't name its destination.`);
    }
    for (const m of text.matchAll(/<a\b[^>]*>([^<]+)<\/a>/gi)) {
      if (VAGUE_LINK.test(m[1].trim())) add("link-text", n, `The link text "${m[1].trim()}" doesn't name its destination.`);
    }

    // Words in this line, without Markdown links' URLs.
    const prose = text.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/<[^>]+>/g, " ");
    section.words += words(prose);
    if (section.firstText === null && section.title !== null) {
      section.firstText = { text: prose.replace(/^\s*([-*+]|\d+\.)\s+/, "").trim(), line: n };
    }

    // Quoted text is an example, not the writer's own words, so the wording
    // rules skip it.
    const own = prose.replace(/"[^"]*"|“[^”]*”/g, " ");
    for (const re of CROSS_REFERENCE) {
      const m = own.match(re);
      if (m) {
        add("cross-reference", n, `"${m[0]}" points to text a quoted section won't have.`);
        break;
      }
    }
    const rel = own.match(RELATIVE_DATES);
    if (rel) add("relative-dates", n, `"${rel[0]}" becomes wrong as the page ages.`);
    const num = own.match(NUMBER_NO_UNIT);
    if (num) add("number-units", n, `"${num[0].trim()}" has no unit.`);
    const left = raw.match(LEFTOVER);
    if (left) add("leftover-markers", n, `"${left[0]}" is still in the page.`);

    termGroups.forEach((group, g) =>
      group.forEach((term, t) => {
        const found = own.match(termPattern(term));
        if (found) {
          termUses[g][t].count += found.length;
          if (!termUses[g][t].line) termUses[g][t].line = n;
        }
      }),
    );
  }
  sections.push(section);

  for (const s of sections) {
    if (s.words > LIMIT_WORDS) {
      add("section-length", s.line, `${s.title ? `"${s.title}"` : "The opening section"} has ${s.words} words.`);
    }
    if (s.firstText && OPENER.test(s.firstText.text)) {
      const w = s.firstText.text.split(/\s+/).slice(0, 3).join(" ");
      add("section-opener", s.firstText.line, `The section "${s.title}" starts with "${w}…", which doesn't name its subject.`);
    }
  }

  termGroups.forEach((group, g) => {
    const used = group.map((term, t) => ({ term, ...termUses[g][t] })).filter((u) => u.count);
    if (used.length > 1) {
      const list = used.map((u) => `"${u.term}" (${u.count})`);
      const second = used.map((u) => u.line).sort((a, b) => a - b)[1];
      add("term-consistency", second, `This page uses ${list.slice(0, -1).join(", ")} and ${list.at(-1)}, which may name one thing.`);
    }
  });

  findings.sort((a, b) => a.line - b.line);
  return { findings, checked };
}

// A term as a whole word or phrase. All-capital terms, such as AP, match
// only in capitals, so "ap" in another word doesn't count.
function termPattern(term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  const caps = term === term.toUpperCase() && /[A-Z]/.test(term);
  return new RegExp(`(?<![\\w-])${escaped}s?(?![\\w-])`, caps ? "g" : "gi");
}

// ---------------------------------------------------------------------------
// Retrieval preview
// ---------------------------------------------------------------------------

const STOP = new Set(
  "a an and are as at be by can do does for from how i if in is it its my of on or the this to was what when where which who why will with you your".split(" "),
);
const tokens = (s) => (s.toLowerCase().match(/[a-z0-9][a-z0-9-]*/g) || []).filter((w) => !STOP.has(w));

/** Split a page into the sections a retrieval system would index. */
export function splitSections(markdown) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const fm = parseFrontMatter(lines);
  const out = [];
  const stack = []; // the headings above the current section, by level
  let cur = { title: "", path: "", line: fm.end + 1, lines: [] };
  let inCode = false;
  for (let i = fm.end; i < lines.length; i++) {
    const raw = lines[i];
    if (/^\s*(```|~~~)/.test(raw)) inCode = !inCode;
    const md = !inCode && raw.match(/^(#{1,6})\s+(.*)$/);
    const html = !inCode && !md && raw.match(/<h([1-6])\b[^>]*>(.*?)<\/h\1>/i);
    if (md || html) {
      if (cur.lines.join("").trim()) out.push(cur);
      const level = md ? md[1].length : Number(html[1]);
      const title = (md ? md[2] : html[2]).replace(/<[^>]+>/g, "").trim();
      stack.length = level - 1;
      // Like many retrieval tools, keep the headings above a section with it,
      // so "Example request" under "Acknowledge an alert" keeps its context.
      const path = stack.filter(Boolean).slice(1).join(" > ");
      stack[level - 1] = title;
      cur = { title, path, line: i + 1, lines: [] };
    } else {
      cur.lines.push(raw);
    }
  }
  if (cur.lines.join("").trim()) out.push(cur);
  return out.map((s) => ({ title: s.title, path: s.path, line: s.line, text: s.lines.join("\n").trim() }));
}

/**
 * Rank a page's sections for a question with BM25, the keyword scoring that
 * many search systems start from. Real AI tools often use embeddings too,
 * so this is a preview, not a prediction.
 */
export function retrieve(markdown, question, top = 3) {
  const sections = splitSections(markdown);
  const docs = sections.map((s) => tokens(`${s.path} ${s.title} ${s.title} ${s.text}`));
  const avg = docs.reduce((n, d) => n + d.length, 0) / (docs.length || 1);
  const q = [...new Set(tokens(question))];
  const df = Object.fromEntries(q.map((t) => [t, docs.filter((d) => d.includes(t)).length]));
  const k1 = 1.2, b = 0.75, N = docs.length;
  return sections
    .map((s, i) => {
      const d = docs[i];
      let score = 0;
      for (const t of q) {
        const tf = d.filter((w) => w === t).length;
        if (!tf) continue;
        const idf = Math.log(1 + (N - df[t] + 0.5) / (df[t] + 0.5));
        score += (idf * tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * d.length) / avg));
      }
      return { ...s, score: Math.round(score * 100) / 100 };
    })
    .filter((s) => s.score > 0)
    .sort((a, b2) => b2.score - a.score)
    .slice(0, top);
}

/** The questions listed in a page's front matter. */
export function pageQuestions(markdown) {
  const fm = parseFrontMatter(markdown.replace(/\r\n?/g, "\n").split("\n"));
  return fm.data && Array.isArray(fm.data.questions) ? fm.data.questions.filter((q) => q && !/^</.test(q)) : [];
}

function checkImage(add, line, alt, src) {
  if (alt === null || alt.trim() === "") {
    add("image-alt", line, "This image has no alt text.");
    return;
  }
  const count = words(alt);
  if (DIAGRAM_FILE.test(src) && count < 8) {
    add("image-alt", line, `This diagram's alt text has ${count} words. Describe what the diagram shows.`);
  } else if (count < 3) {
    add("image-alt", line, `The alt text "${alt}" is too short to describe the image.`);
  }
}

/**
 * Summarize findings as "N of M checks pass", where a check passes when it
 * has no findings.
 */
export function summarize(findings, checked) {
  const failed = new Set(findings.map((f) => f.rule));
  const passed = checked.filter((id) => !failed.has(id));
  return { passed: passed.length, total: checked.length, failedRules: [...failed] };
}
