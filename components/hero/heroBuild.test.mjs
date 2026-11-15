import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { HERO_CONTENT } from "./heroContent.ts";

// Run after `npm run build`. Inspect actual output, not just TypeScript:
// the earlier CSS-module failure built successfully with missing class names.
const html = readFileSync(new URL("../../.next/server/app/index.html", import.meta.url), "utf8");
const hero = html.match(/<section class="utc-workspace-hero"[\s\S]*?<\/section>/)?.[0];
const chunks = new URL("../../.next/static/chunks/", import.meta.url);
const css = readdirSync(chunks)
  .filter((name) => name.endsWith(".css"))
  .map((name) => readFileSync(new URL(name, chunks), "utf8"))
  .join("\n");

test("the built hero has real layout classes with matching CSS", () => {
  assert.ok(hero, "Missing styled hero section in the generated HTML");
  assert.ok(!hero.includes("undefined"), "Unresolved style names in the generated hero");
  for (const name of [
    "utc-workspace-hero", "utc-workspace-layout", "utc-workspace-copy",
    "utc-workspace-heading", "utc-workspace-window", "utc-workspace-photo-frame",
    "utc-workspace-image", "utc-workspace-code-note", "utc-workspace-progress",
    "utc-workspace-progress-fill",
  ]) {
    assert.ok(hero.includes(`class="${name}"`), `Missing HTML class: ${name}`);
    assert.ok(css.includes(`.${name}{`), `Missing CSS selector: ${name}`);
  }
  assert.match(css, /\.utc-workspace-hero\{[^}]*position:relative/);
  assert.match(css, /\.utc-workspace-layout\{[^}]*display:grid/);
  assert.match(css, /\.utc-workspace-image\{[^}]*object-fit:cover/);
});

test("the built hero has one accessible heading and retained layers for a smooth crossfade", () => {
  assert.ok(hero);
  assert.equal((hero.match(/<h1\b/g) || []).length, 1);
  assert.equal((hero.match(/<img\b/g) || []).length, HERO_CONTENT.length);
  assert.ok(hero.includes(HERO_CONTENT[0].body.replaceAll("'", "&#x27;")));
  assert.ok(hero.includes("utc-hero-hackathon.png"));
  assert.ok(!hero.includes("carousel"));
  assert.equal((hero.match(/data-active="true"/g) || []).length, 4, "One label, heading, description and photo should start active");
  assert.equal((hero.match(/aria-hidden="true" data-active="true"/g) || []).length, 0);
  assert.ok(!hero.includes("data-nimg=\"fill\""));
  assert.ok(!hero.includes("Join the club"));
  assert.match(css, /transition:opacity \.9s cubic-bezier\(\.4,0,\.2,1\)/);
  assert.match(css, /\.utc-workspace-fade\{grid-area:1\/1\}/);
  assert.ok(hero.includes("animation-duration:5000ms"));
  assert.match(css, /@keyframes utc-workspace-countdown/);
});
