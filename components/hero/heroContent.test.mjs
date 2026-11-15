import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { HERO_CONTENT, HERO_ROTATION_MS } from "./heroContent.ts";

test("the original headings and order are preserved", () => {
  assert.deepEqual(
    HERO_CONTENT.map(({ label, lines }) => [label, lines.join(" ")]),
    [
      ["UOWD TECH CLUB", "We build what's coming next"],
      ["WORKSHOPS", "Learn it. Build it. Ship projects"],
      ["HACKATHONS", "One idea. One team. One weekend"],
      ["COMMUNITY", "Built by students, for students"],
    ],
  );
});

test("each hero description is a concise one-liner", () => {
  assert.deepEqual(HERO_CONTENT.map(({ body }) => body), [
    "UOWD's student-led tech community.",
    "Learn by building real projects.",
    "Build, pitch and compete in one weekend.",
    "Connect with students and industry.",
  ]);
  for (const { body } of HERO_CONTENT) {
    assert.ok(body.length <= 40);
    assert.ok(!body.includes("\n"));
  }
});

test("each content update uses four fixed heading lines and one original photo", () => {
  assert.equal(HERO_ROTATION_MS, 5000);
  assert.equal(HERO_CONTENT.length, 4);
  assert.equal(new Set(HERO_CONTENT.map(({ photo }) => photo.src)).size, 4);
  for (const content of HERO_CONTENT) {
    assert.equal(content.lines.length, 4);
    assert.ok(content.photo.alt.length > 0);
    assert.ok(content.photo.width > 0 && content.photo.height > 0);
    const path = fileURLToPath(new URL(`../../public${content.photo.src}`, import.meta.url));
    assert.ok(existsSync(path), `Missing hero photo: ${content.photo.src}`);
  }
});
