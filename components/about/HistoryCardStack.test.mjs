import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { HISTORY_CHAPTERS } from "./historyChapters.ts";
import * as motion from "./historyStackMotion.ts";

const read = (file) => readFileSync(new URL(file, import.meta.url), "utf8");
const compile = (file) => ts.transpileModule(read(file), {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;

test("four sourced years retain their correct original logo assets and document crops", () => {
  assert.deepEqual(HISTORY_CHAPTERS.slice(0, 4).map(({ id }) => id), ["2022-2023", "2023-2024", "2024-2025", "2025-2026"]);
  assert.match(HISTORY_CHAPTERS[0].membershipNote, /Estimated/);
  assert.match(HISTORY_CHAPTERS[2].milestone, /Club of the Year/);
  assert.match(HISTORY_CHAPTERS[3].highlights.join(" "), /Best Event Award.*Innovation in Student Engagement Award/);
  const provenance = JSON.parse(read("../../public/images/about/history/provenance.json"));
  assert.equal(provenance.document, "The Document (1).docx");
  for (const [index, chapter] of HISTORY_CHAPTERS.slice(0, 4).entries()) {
    const file = readFileSync(new URL(`../../public${chapter.logo.src}`, import.meta.url));
    assert.equal(file.subarray(1, 4).toString(), "PNG");
    assert.equal(file.readUInt32BE(16), chapter.logo.width);
    assert.equal(file.readUInt32BE(20), chapter.logo.height);
    assert.equal(file[25], 6, "RGBA preserves the document's transparent ellipse masks");
    const source = provenance.logos[index];
    assert.equal(source.year, chapter.id);
    assert.equal(source.filename, chapter.logo.src.split("/").at(-1));
    assert.equal(source.documentShape, index === 0 ? "rect" : "ellipse");
    assert.match(source.sourceSha256, /^[0-9a-f]{64}$/);
  }
  assert.equal(HISTORY_CHAPTERS[0].logo.height, 133, "The first logo must not include the stray banner below Word's crop");
});

test("the supplied current logo is the fifth year, with no invented content", () => {
  assert.equal(HISTORY_CHAPTERS.length, 5);
  const chapter = HISTORY_CHAPTERS.at(-1);
  assert.equal(chapter.id, "2026-present");
  assert.equal(chapter.year, "2026 – PRESENT");
  assert.equal(chapter.title, "");
  assert.equal(chapter.summary, "");
  assert.deepEqual(chapter.highlights, []);
  assert.equal(chapter.membership, "");
  assert.equal(chapter.milestone, "");
  const logo = readFileSync(new URL(`../../public${chapter.logo.src}`, import.meta.url));
  assert.equal(logo.subarray(1, 4).toString(), "PNG");
  assert.equal(logo.readUInt32BE(16), 1254);
  assert.equal(logo.readUInt32BE(20), 1254);
});

test("the rendered deck alternates logo sides, keeps oldest on top, and contains real text before effects", () => {
  let effect;
  let initialised = 0;
  const cleanup = () => {};
  const compiled = { exports: {} };
  const jsx = (type, props) => ({ type, props });
  vm.runInNewContext(compile("./HistoryCardStack.tsx"), {
    module: compiled, exports: compiled.exports,
    require(name) {
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "react") return {
        useRef: () => ({ current: {} }),
        useLayoutEffect: (callback) => { effect = callback; },
      };
      if (name === "next/image") return () => null;
      if (name === "./historyChapters") return { HISTORY_CHAPTERS };
      if (name === "./initHistoryCardStack") return { initHistoryCardStack: () => { initialised++; return cleanup; } };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  const tree = compiled.exports.HistoryCardStack();
  const deck = tree.props.children[1];
  assert.equal(deck.type, "ol");
  assert.equal(deck.props.children.length, 5);
  for (const [index, card] of deck.props.children.entries()) {
    const chapter = HISTORY_CHAPTERS[index];
    assert.equal(card.props["data-logo-side"], index % 2 === 0 ? "left" : "right");
    assert.equal(card.props.style.zIndex, 5 - index);
    assert.equal(card.props.children[0].props.children[1].props.children.join(""), `${String(index + 1).padStart(2, "0")} / 05`);
    const body = card.props.children[1];
    const figure = body.props.children[0];
    assert.equal(figure.type, "figure");
    assert.equal(figure.props.children.type, "div", "Logo has only its frame, with no archive caption");
    const logo = figure.props.children.props.children;
    const copy = body.props.children[1];
    assert.equal(logo.props.src, chapter.logo.src);
    if (chapter.title) {
      assert.equal(copy.props.children[0].props.children, chapter.title);
      assert.equal(copy.props.children[1].props.children, chapter.summary);
      assert.equal(copy.props.children[2].props.children.length, 3);
    } else {
      assert.equal(card.props["data-pending"], true);
      assert.equal(card.props["data-logo-side"], "left");
      assert.equal(card.props["aria-labelledby"], "utc-chapter-year-2026-present");
      assert.equal(card.props.children[0].props.children[0].props.id, "utc-chapter-year-2026-present");
      assert.equal(copy.props.children[0], "");
      assert.equal(copy.props.children[1], "");
      assert.equal(copy.props.children[2], false);
      assert.equal(card.props.children[2], null);
    }
  }
  assert.equal(initialised, 0);
  assert.equal(effect(), cleanup);
  assert.equal(initialised, 1);
});

test("the supplied motion equations raise and scale the deck in chronological order", () => {
  assert.deepEqual(motion.historyCardPose(0, 0, 4), { xPercent: -50, yPercent: -50, rotationX: 0, scale: 1 });
  assert.equal(motion.historyCardPose(0, 1, 4).yPercent, -45);
  assert.equal(motion.historyCardPose(0, 1, 4).scale, 0.925);
  assert.equal(motion.historyCardPose(0, 3, 4).scale, 0.775);
  const segment = motion.STACK_TRANSITION_END / 3;
  assert.equal(motion.historyCardPose(segment / 2, 0, 4).rotationX, 17.5);
  assert.equal(motion.historyCardPose(segment / 2, 0, 4).yPercent, -125);
  assert.equal(motion.historyCardPose(segment, 1, 4).yPercent, -50);
  assert.equal(motion.historyCardPose(segment + 0.01, 0, 4).yPercent, -250);
  for (const progress of [motion.STACK_TRANSITION_END, 1]) {
    assert.deepEqual(motion.historyCardPose(progress, 3, 4), { xPercent: -50, yPercent: -50, rotationX: 0, scale: 1 });
  }
});

test("reverse scrolling is deterministic, with clamped endpoints and no cumulative transforms", () => {
  const forward = [0, 0.2, 0.4, 0.6, 0.8, 1].map((progress) =>
    Array.from({ length: 4 }, (_, index) => motion.historyCardPose(progress, index, 4)));
  const backward = [1, 0.8, 0.6, 0.4, 0.2, 0].map((progress) =>
    Array.from({ length: 4 }, (_, index) => motion.historyCardPose(progress, index, 4))).reverse();
  assert.deepEqual(forward, backward);
  assert.deepEqual(motion.historyCardPose(-1, 0, 4), motion.historyCardPose(0, 0, 4));
  assert.deepEqual(motion.historyCardPose(2, 3, 4), motion.historyCardPose(1, 3, 4));
  assert.deepEqual(motion.historyCardPose(0.5, 0, 1), { xPercent: -50, yPercent: -50, rotationX: 0, scale: 1 });
});

function animationHarness({ reduced = false, height = 520, count = 4, viewportHeight = 900, viewportWidth = 1280 } = {}) {
  const attributes = new Set();
  const styles = new Map();
  const frames = new Map();
  const transforms = new Map();
  const cards = Array.from({ length: count }, () => ({ offsetHeight: height, scrollHeight: height }));
  const deck = {
    querySelectorAll: () => cards,
    setAttribute: (name) => attributes.add(name),
    removeAttribute: (name) => attributes.delete(name),
    style: { setProperty: (key, value) => styles.set(key, value), removeProperty: (key) => styles.delete(key) },
  };
  let query, trigger, mediaCleanup, fontReady;
  let reverted = 0, refreshed = 0, frameId = 0;
  const ScrollTrigger = {
    create: (options) => { trigger = options; },
    refresh: () => { refreshed++; trigger?.onRefreshInit(); },
  };
  const gsap = {
    registerPlugin: () => {},
    set: (card, pose) => transforms.set(card, pose),
    matchMedia: () => ({
      add(mediaQuery, setup, scope) {
        query = mediaQuery;
        assert.equal(scope, deck);
        mediaCleanup = setup({ conditions: { reduce: reduced, animate: !reduced } });
      },
      revert() { reverted++; mediaCleanup?.(); transforms.clear(); },
    }),
  };
  const compiled = { exports: {} };
  vm.runInNewContext(compile("./initHistoryCardStack.ts"), {
    module: compiled, exports: compiled.exports,
    require(name) {
      if (name === "gsap") return gsap;
      if (name === "gsap/ScrollTrigger") return { ScrollTrigger };
      if (name === "./historyStackMotion") return motion;
      throw new Error(`Unexpected import: ${name}`);
    },
    document: { fonts: { ready: { then: (callback) => { fontReady = callback; } } } },
    window: { innerHeight: viewportHeight, innerWidth: viewportWidth },
    requestAnimationFrame: (callback) => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: (id) => frames.delete(id),
  });
  const cleanup = compiled.exports.initHistoryCardStack(deck);
  return {
    attributes, styles, frames, transforms, cards, cleanup,
    get query() { return query; }, get trigger() { return trigger; },
    get reverted() { return reverted; }, get refreshed() { return refreshed; },
    fontsReady: () => fontReady?.(),
    flush() { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach((callback) => callback()); },
  };
}

test("animation pins four viewports, measures copy, and fully cleans up on unmount", () => {
  const h = animationHarness();
  assert.ok(h.attributes.has("data-animated"));
  assert.equal(h.styles.get("--history-card-height"), "520px");
  assert.equal(h.trigger.pin, true);
  assert.equal(h.trigger.pinSpacing, true);
  assert.equal(h.trigger.end(), "+=3600");
  h.trigger.onUpdate({ progress: 0.5 });
  assert.deepEqual(h.transforms.get(h.cards[2]), motion.historyCardPose(0.5, 2, 4));
  h.flush();
  assert.equal(h.refreshed, 1);
  h.cleanup();
  assert.equal(h.reverted, 1);
  assert.equal(h.attributes.size, 0);
  assert.equal(h.styles.size, 0);
  assert.equal(h.transforms.size, 0);
  assert.equal(h.frames.size, 0);
  h.fontsReady();
  assert.equal(h.frames.size, 0, "Late fonts cannot refresh an unmounted route");
});

test("only reduced motion or an empty deck opts out of the supplied animation", () => {
  for (const options of [{ reduced: true }, { count: 0 }]) {
    const h = animationHarness(options);
    assert.equal(h.attributes.size, 0);
    assert.equal(h.trigger, undefined);
    assert.equal(h.transforms.size, 0);
    if (h.query) {
      assert.equal(h.query.reduce, "(prefers-reduced-motion: reduce)");
      assert.equal(h.query.animate, "(prefers-reduced-motion: no-preference)");
    }
    h.cleanup();
    assert.equal(h.frames.size, 0);
  }
});

test("short windows, mobile widths and taller copy still initialise the real pinned stack", () => {
  for (const options of [
    { viewportHeight: 600 },
    { viewportHeight: 500, viewportWidth: 1366 },
    { viewportWidth: 390, viewportHeight: 844 },
    { height: 850 },
    { height: 1000, viewportWidth: 390, viewportHeight: 667 },
  ]) {
    const h = animationHarness(options);
    assert.ok(h.attributes.has("data-animated"));
    assert.equal(h.trigger.pin, true);
    assert.equal(h.trigger.end(), `+=${(options.viewportHeight ?? 900) * 4}`);
    assert.equal(Object.keys(h.query).length, 2, "The source only checks motion preferences, not viewport size");
    h.trigger.onUpdate({ progress: 0.5 });
    assert.equal(h.transforms.get(h.cards[0]).yPercent, -250);
    assert.deepEqual(h.transforms.get(h.cards[2]), motion.historyCardPose(0.5, 2, 4));
    h.cleanup();
  }
});

test("refreshes account for long content without disabling the deck", () => {
  const h = animationHarness();
  h.cards[1].scrollHeight = 950;
  h.trigger.onRefreshInit();
  assert.equal(h.styles.get("--history-card-height"), "950px");
  assert.ok(h.attributes.has("data-animated"));
  assert.equal(h.trigger.pin, true);
  h.cleanup();
});

test("the fifth card gets additional scroll distance and remains visible at the end", () => {
  const h = animationHarness({ count: 5 });
  assert.equal(h.trigger.end(), "+=4500");
  assert.equal(h.transforms.size, 5);
  h.trigger.onUpdate({ progress: 1 });
  assert.deepEqual(h.transforms.get(h.cards[4]), { xPercent: -50, yPercent: -50, rotationX: 0, scale: 1 });
  for (let index = 0; index < 4; index++) assert.equal(h.transforms.get(h.cards[index]).yPercent, -250);
  h.trigger.onUpdate({ progress: 0 });
  assert.equal(h.transforms.get(h.cards[0]).yPercent, -50);
  assert.equal(h.transforms.get(h.cards[4]).scale, 0.7);
  h.cleanup();
});
