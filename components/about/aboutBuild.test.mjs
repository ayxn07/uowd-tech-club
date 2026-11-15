import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

// Run after `npm run build`: check the actual rendered route and emitted CSS.
const html = readFileSync(new URL("../../.next/server/app/about.html", import.meta.url), "utf8");
const main = html.match(/<main class="utc-about-page"[\s\S]*?<\/main>/)?.[0];
const chunks = new URL("../../.next/static/chunks/", import.meta.url);
const css = readdirSync(chunks)
  .filter((name) => name.endsWith(".css"))
  .map((name) => readFileSync(new URL(name, chunks), "utf8"))
  .join("\n");

test("the About route contains two distinct sections and working style names", () => {
  assert.ok(main, "Missing About page");
  assert.equal((main.match(/<section\b/g) || []).length, 2);
  assert.ok(!main.includes("undefined"));
  for (const name of [
    "utc-about-intro", "utc-about-history", "utc-about-facts",
    "utc-archive", "utc-archive-table", "utc-archive-event-panel",
  ]) {
    assert.ok(main.includes(name), `Missing markup for ${name}`);
    assert.ok(css.includes(`.${name}{`), `Missing emitted CSS for ${name}`);
  }
  assert.match(css, /\.utc-about-page\{[^}]*background:var\(--utc-cobalt\)/);
});

test("About ends with the same animated footer as the homepage", () => {
  const home = readFileSync(new URL("../../.next/server/app/index.html", import.meta.url), "utf8");
  const footer = html.match(/<footer\b[\s\S]*?<\/footer>/)?.[0];
  assert.ok(footer, "Missing About footer");
  assert.equal(footer, home.match(/<footer\b[\s\S]*?<\/footer>/)?.[0]);
  assert.ok(html.indexOf("<footer") > html.indexOf("</main>"));
  assert.ok(footer.includes('class="interactive-grid"'));
  assert.equal((html.match(/<footer\b/g) || []).length, 1);
  const metaStyles = css.match(/\.footer-meta\{([^}]+)\}/)?.[1];
  assert.ok(metaStyles);
  assert.match(metaStyles, /border-top:3px solid var\(--utc-cobalt\)/);
  assert.match(metaStyles, /padding-top:\.75rem/);
});

test("About sections share one uninterrupted background without a divider", () => {
  assert.equal((main.match(/class="interactive-grid"/g) || []).length, 1);
  assert.ok(main.indexOf('class="interactive-grid"') < main.indexOf("<section"));
  const historyStyles = css.match(/\.utc-about-history\{([^}]+)\}/)?.[1];
  assert.ok(historyStyles);
  assert.doesNotMatch(historyStyles, /border|box-shadow|background/);
  assert.match(css, /\.utc-about-page>\.interactive-grid\{z-index:-1\}/);
});

test("the About title renders STUDENTS as a real-text highlighter with its own styles", () => {
  const heading = main.match(/<h1 id="utc-about-heading"[^>]*>[\s\S]*?<\/h1>/)?.[0];
  assert.ok(heading);
  assert.ok(heading.includes('<span class="utc-about-student-highlight">students</span>.'));
  assert.ok(css.includes(".utc-about-student-highlight{"));
  assert.match(css, /\[data-reveal=(?:"pending"|pending)\] \.utc-about-student-highlight/);
  assert.match(css, /\[data-reveal=(?:"shown"|shown)\] \.utc-about-student-highlight/);
});

test("the archive heading highlights only STORY, DATE and TIME in the title palette", () => {
  const heading = main.match(/<h2 id="utc-history-heading"[^>]*>[\s\S]*?<\/h2>/)?.[0];
  assert.ok(heading);
  assert.deepEqual(
    [...heading.matchAll(/<span class="utc-about-history-highlight">(.*?)<\/span>/g)].map((match) => match[1]),
    ["story", "date", "time"],
  );
  const highlightStyles = css.match(/\.utc-about-student-highlight,\.utc-about-history-highlight\{([^}]+)\}/)?.[1];
  assert.ok(highlightStyles);
  assert.match(highlightStyles, /background:linear-gradient\(#e4e50b,#e4e50b\)/);
  assert.match(highlightStyles, /color:var\(--utc-cobalt\)/);
});

test("the timeline is replaced by five chronological year cards with their supplied logos", () => {
  const intro = main.match(/<section class="utc-about-intro"[\s\S]*?<\/section>/)?.[0];
  assert.ok(intro);
  assert.ok(!main.includes("utc-about-milestone"));
  assert.equal((intro.match(/class="utc-history-card"/g) || []).length, 5);
  let previousPosition = -1;
  for (const [index, id] of ["2022-2023", "2023-2024", "2024-2025", "2025-2026", "2026-present"].entries()) {
    const position = intro.indexOf(`id="utc-chapter-${index === 4 ? "year-" : ""}${id}"`);
    assert.ok(position > previousPosition, `Year ${id} must follow the previous year`);
    previousPosition = position;
    assert.ok(intro.includes(`utc-logo-${id}.png`));
    assert.ok(intro.includes(`data-logo-side="${index % 2 === 0 ? "left" : "right"}"`));
  }
  assert.equal((intro.match(/<img\b/g) || []).length, 5);
  const present = intro.match(/<li class="utc-history-card" data-logo-side="left" data-pending="true"[\s\S]*?<\/li>/)?.[0];
  assert.ok(present);
  assert.ok(present.includes("2026 – PRESENT"));
  assert.ok(present.includes("utc-logo-2026-present.png"));
  assert.ok(!present.includes("<h2"));
  assert.ok(!present.includes("utc-history-card-bottom"));
  assert.match(css, /\.utc-history-card\{[^}]*background:#fff/);
  assert.match(css, /\.utc-history-deck\[data-animated\]/);
});

test("the initial calendar, event and historical membership render before hydration", () => {
  assert.ok(main.includes("February 2025"));
  assert.ok(main.includes("The AI Challenge"));
  assert.ok(main.includes("Dubai Police"));
  assert.ok(main.includes("Members / 2025–26"));
  assert.ok(main.includes('aria-pressed="true"'));
  assert.ok(!main.includes("Not an upcoming event"));
  assert.ok(!main.includes("The builder spirit / Community illustration"));
  assert.ok(main.includes('class="utc-archive-event-header"'));
  assert.ok(!main.includes("Explore our story"));
  assert.ok(!main.includes('class="utc-about-explore"'));
  assert.ok(main.includes('id="club-history"'));
});

test("the desktop event card stretches to match the calendar height", () => {
  assert.match(css, /\.utc-archive-layout\{[^}]*align-items:stretch/);
  assert.match(css, /\.utc-archive-event-panel\{[^}]*justify-content:space-between/);
  assert.match(css, /@media\s*\(max-width:1050px\)\{[\s\S]*?\.utc-archive-layout\{grid-template-columns:minmax\(0,1fr\)\}/);
});

test("the initial single-event card renders an optimised portrait filling the spare space", () => {
  assert.match(main, /class="utc-archive-event-panel" data-single-event="true"/);
  assert.match(main, /class="utc-archive-community-image" data-portrait="true"/);
  assert.ok(main.includes("utc-archive-ai-portrait.webp"));
  assert.match(css, /\.utc-archive-community-image\[data-portrait\]\{[^}]*flex:1/);
  assert.match(css, /\.utc-archive-community-image\[data-portrait\] img\{object-fit:cover\}/);
});

test("the award card displays the full academic year without an arrow", () => {
  const award = main.match(/<div class="utc-about-fact utc-about-fact-award">([\s\S]*?)<\/div>/)?.[1];
  assert.ok(award, "Missing award card");
  assert.ok(award.includes("<dt>Club of the Year</dt>"));
  assert.match(award, /<dd>\s*2024 - 2025\s*<span>/);
  assert.ok(!award.includes("↗"));
});

test("the award trophy renders in brand colours with its own layout space", () => {
  assert.match(main, /<svg class="utc-about-award-trophy"[^>]*aria-hidden="true"/);
  const trophy = css.match(/\.utc-about-award-trophy\{([^}]+)\}/)?.[1];
  assert.ok(trophy);
  assert.match(trophy, /color:var\(--utc-cobalt\)/);
  // The production minifier combines grid-row and grid-column into grid-area.
  assert.match(trophy, /grid-area:1\/2\/span 2/);
  assert.ok(css.includes("@container (max-width:24rem)"));
});

test("the archive has no founding-credit row or back-to-top link", () => {
  assert.ok(!main.includes("Started on 19 September 2022 by Mohamad Dahhan and Adam Ahsan."));
  assert.ok(!main.includes("Back to the beginning"));
  assert.ok(!main.includes("utc-about-history-footnote"));
  assert.ok(!main.includes("utc-about-history-credits"));
  assert.ok(!main.includes("Selected highlights from the club history."));
  assert.ok(!css.includes("utc-about-history-footnote"));
  assert.ok(!css.includes("utc-about-history-credits"));
});
