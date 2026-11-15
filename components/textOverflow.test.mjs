import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const about = read("./about/AboutPage.css");
const hero = read("./hero/Hero.css");
const global = read("../app/globals.css");
const rule = (css, selector) => {
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]+)\}/g);
  const matches = [...rules].filter(([, selectors]) => selectors.split(",").some((item) => item.trim() === selector));
  const match = matches.find(([, selectors]) => selectors.trim() === selector) ?? matches[0];
  assert.ok(match, `Missing CSS rule: ${selector}`);
  return match[2];
};

// Source-level regression checks, not browser layout measurements.
test("About page section labels match the homepage label font size", () => {
  const size = (declarations) => declarations.match(/font-size:\s*([^;]+);/)?.[1];
  assert.equal(size(rule(about, ".utc-about-eyebrow")), size(rule(global, ".hero-label")));
});

test("the three About highlights use brand-blue backgrounds and white text, including reduced motion", () => {
  const component = read("./about/About.tsx");
  const highlights = read("./about/AboutHighlights.css");
  assert.match(component, /import "\.\/AboutHighlights\.css";/);
  assert.deepEqual([...component.matchAll(/className="hl">([^<]+)</g)].map((match) => match[1]), ["club", "students", "builders"]);
  assert.match(rule(highlights, ".about .hl"), /color: var\(--about-highlight-ink\);/);
  assert.match(rule(highlights, ".about .hl"), /background-image: linear-gradient\(var\(--about-highlight-fill\), var\(--about-highlight-fill\)\);/);
  assert.match(rule(highlights, ".about"), /--about-highlight-fill: var\(--utc-cobalt\);/);
  assert.match(rule(highlights, ".about"), /--about-highlight-ink: #ffffff;/);
  assert.match(highlights, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.about \.about-copy \.hl\s*\{\s*color: var\(--about-highlight-ink\) !important;/);
});

test("the About-page STUDENTS word uses a separate gold-and-blue scroll-triggered highlighter", () => {
  const page = read("../app/about/page.tsx");
  const highlight = read("./about/AboutStudentHighlight.css");
  assert.match(page, /<RevealOnScroll className="utc-about-intro-copy" replayOnNavigation="\/about">/);
  assert.match(page, /Built by <span className="utc-about-student-highlight">students<\/span>\.<\/span>/);
  assert.match(page, /import "@\/components\/about\/AboutStudentHighlight\.css";/);
  const styling = rule(highlight, ".utc-about-student-highlight");
  assert.match(styling, /background: linear-gradient\(#e4e50b, #e4e50b\) no-repeat 0 0 \/ 100% 100%;/);
  assert.match(styling, /color: var\(--utc-cobalt\);/);
  assert.match(styling, /background-size 420ms cubic-bezier\(0\.65, 0, 0\.35, 1\)/);
  assert.match(styling, /color 120ms linear/);
  assert.match(rule(highlight, '.utc-about-intro-copy[data-reveal="pending"] .utc-about-student-highlight'), /background-size: 0% 100%;\s*color: #ffffff;/);
  assert.match(rule(highlight, '.utc-about-intro-copy[data-reveal="shown"] .utc-about-student-highlight'), /transition-delay: 1000ms, 1180ms;/);
  assert.match(highlight, /@media \(prefers-reduced-motion: reduce\)[\s\S]*background-size: 100% 100% !important;[\s\S]*color: var\(--utc-cobalt\) !important;[\s\S]*transition: none;/);
});

test("About introduction uses balanced vertical padding and consistent copy gaps", () => {
  const intro = rule(about, ".utc-about-intro");
  assert.match(intro, /padding-block: clamp\(5rem, 8vw, 8rem\);/);
  assert.match(rule(about, ".utc-about-intro-copy"), /gap: clamp\(1.5rem, 2.5vw, 2rem\);/);
  assert.match(rule(about, ".utc-about-intro-copy > .utc-about-lead"), /margin: 0;/);
  const introRules = [...about.matchAll(/\.utc-about-intro\s*\{([^}]+)\}/g)];
  assert.equal(introRules.length, 2);
  assert.match(introRules[1][1], /padding-block: 4rem;/);
  for (const [, declarations] of introRules) {
    assert.doesNotMatch(declarations, /padding-(?:top|bottom):/);
  }
});

test("the replacement history cards keep copy in flow and only position the animated deck", () => {
  const stack = read("./about/HistoryCardStack.css");
  assert.ok(!about.includes("utc-about-milestone"));
  assert.match(rule(stack, ".utc-history-card"), /background: #ffffff;/);
  assert.match(rule(stack, ".utc-history-card"), /min-height: 30rem;/);
  assert.match(rule(stack, ".utc-history-card"), /width: min\(66rem, calc\(100% - 4rem\)\);/);
  assert.match(rule(stack, ".utc-history-card"), /padding: clamp\(1\.25rem, 2\.5vw, 2\.5rem\);/);
  assert.match(rule(stack, ".utc-history-card"), /gap: 1\.25rem;/);
  assert.match(rule(stack, ".utc-history-card"), /grid-template-rows: minmax\(min-content, 1fr\) auto minmax\(min-content, 1fr\);/);
  assert.match(rule(stack, ".utc-history-card-body"), /place-self: center;/);
  assert.match(rule(stack, ".utc-history-card-body"), /width: fit-content;/);
  assert.match(rule(stack, ".utc-history-card-body"), /max-width: 100%;/);
  assert.match(rule(stack, ".utc-history-card-body"), /grid-template-columns: minmax\(0, max-content\) minmax\(0, 38rem\);/);
  assert.match(rule(stack, '.utc-history-card[data-logo-side="right"] .utc-history-card-body'), /grid-template-columns: minmax\(0, 38rem\) minmax\(0, max-content\);/);
  assert.match(rule(stack, ".utc-history-card-top"), /align-self: start;/);
  assert.match(rule(stack, ".utc-history-year"), /font-size: clamp\(1\.875rem, 3\.5vw, 3\.25rem\);/);
  assert.match(rule(stack, ".utc-history-card-bottom"), /align-self: end;/);
  assert.doesNotMatch(rule(stack, ".utc-history-card-copy"), /height:|overflow:|position: absolute/);
  assert.doesNotMatch(stack, /line-clamp|text-overflow:\s*ellipsis/);
  assert.match(rule(stack, '.utc-history-card[data-logo-side="right"] .utc-history-logo'), /grid-column: 2;/);
  const animatedCard = rule(stack, ".utc-history-deck[data-animated] .utc-history-card");
  assert.match(animatedCard, /height: min\(var\(--history-card-height, 30rem\), calc\(100svh - 8rem\)\);/);
  assert.match(animatedCard, /overflow-y: auto;/);
});

test("calendar chips wrap without line limits or hidden overflow", () => {
  const chip = rule(about, ".utc-archive-event-chip");
  assert.match(chip, /display: block;/);
  assert.match(chip, /white-space: normal;/);
  assert.match(chip, /overflow-wrap: anywhere;/);
  assert.doesNotMatch(chip, /line-clamp|overflow:\s*(?:hidden|clip)|(?:max-)?height:/);
  assert.match(rule(about, ".utc-archive-day-events"), /grid-template-columns: minmax\(0, 1fr\);/);
  assert.doesNotMatch(rule(about, ".utc-archive-day"), /(?:^|;)\s*(?:max-)?height:/);
  assert.doesNotMatch(about, /line-clamp|text-overflow:\s*ellipsis/);
});

test("archive logo grids hug the logo with equal padding on all four sides", () => {
  const stack = read("./about/HistoryCardStack.css");
  const frame = rule(stack, ".utc-history-logo-frame");
  assert.match(frame, /width: fit-content;/);
  assert.match(frame, /max-width: 100%;/);
  assert.match(frame, /margin-inline: auto;/);
  assert.match(frame, /padding: 1rem;/);
  assert.match(frame, /transform: scale\(1\.08\);/);
  assert.match(frame, /transform-origin: center;/);
  for (const [, declarations] of stack.matchAll(/\.utc-history-logo-frame\s*\{([^}]+)\}/g)) {
    assert.doesNotMatch(declarations, /min-height:|padding-(?:inline|block|left|right|top|bottom):/);
  }
});

test("hero text can wrap and its section can grow beyond the viewport", () => {
  assert.doesNotMatch(rule(hero, ".utc-workspace-hero"), /(?:^|;)\s*height:/);
  assert.doesNotMatch(rule(hero, ".utc-workspace-heading-line"), /white-space:\s*nowrap/);
  assert.match(rule(hero, ".utc-workspace-code-note"), /white-space: pre-wrap;/);
});

test("event card text participates in layout instead of a fixed overlay box", () => {
  assert.match(rule(global, ".upnext-frame"), /position: relative;/);
  assert.match(rule(global, ".upnext-overlay"), /position: relative;/);
  assert.match(rule(global, ".upnext-card"), /flex: 0 0 max\(16rem,/);
});

test("shared navigation scrolls and footer content wraps without a fixed height", () => {
  assert.match(rule(global, ".site-header nav"), /overflow-x: auto;/);
  assert.ok(!about.includes(".site-shell:has(.utc-about-page)"), "Shared fixes must not depend on visiting About");
  const footer = read("./site/Footer.tsx");
  assert.ok(footer.includes("footer-meta mt-8 flex flex-wrap"));
  assert.doesNotMatch(footer, /(?:\s|\")h-\[50svh\]/);
  assert.match(rule(global, ".footer-link"), /flex-wrap: wrap;/);
});

test("footer links have no diagonal arrows and Connect links align to the right", () => {
  const footer = read("./site/Footer.tsx");
  assert.doesNotMatch(footer, /<svg/);
  assert.ok(footer.includes('align === "right" ? "ml-auto text-right"'));
  assert.ok(footer.includes('align === "right" ? "items-end" : "items-start"'));
  assert.match(footer, /<SocialList label="CONNECT" links=\{CONNECT\} align="right"/);
});

test("footer links underline on hover and keyboard focus", () => {
  const footer = read("./site/Footer.tsx");
  // Decorate the text element itself: decoration on an inline-flex parent
  // does not reliably propagate to its flex items.
  assert.match(footer, /<span className="footer-link-label">\{link.label\}<\/span>/);
  assert.match(global, /\.footer-link:hover \.footer-link-label,\s*\.footer-link:focus-visible \.footer-link-label\s*\{\s*text-decoration-line: underline;/);
  assert.match(rule(global, ".footer-link-label"), /text-underline-offset: 0\.2em;/);
});

test("footer social headings use blue badges with white text and the About page shape", () => {
  const footer = read("./site/Footer.tsx");
  assert.match(footer, /<p className="hero-label footer-social-label" data-align=\{align\}>/);
  const badge = rule(global, ".footer-social-label");
  assert.match(badge, /background: var\(--utc-cobalt\);/);
  assert.match(badge, /color: #ffffff;/);
  const clipPath = (declarations) => declarations.match(/clip-path:\s*([^;]+);/)?.[1];
  assert.ok(clipPath(badge));
  assert.equal(clipPath(badge), clipPath(rule(about, ".utc-about-fact")));
});

test("Connect mirrors the cut to the top-left and places the terminal prompt after the label", () => {
  const footer = read("./site/Footer.tsx");
  assert.ok(footer.includes('align === "right" ? `${label} _<` : `>_ ${label}`'));
  const connectBadge = rule(global, '.footer-social-label[data-align="right"]');
  assert.match(connectBadge, /padding: 0\.75rem 1rem 0\.75rem 1\.75rem;/);
  assert.match(connectBadge, /clip-path: polygon\(1\.25rem 0, 100% 0, 100% 100%, 0 100%, 0 1\.25rem\);/);
});
