import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as events from "../site/motionEvents.ts";

const code = ts.transpileModule(readFileSync(new URL("./RevealOnScroll.tsx", import.meta.url), "utf8"), {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
}).outputText;

function harness(route = "/about", introPlaying = false) {
  const element = { dataset: {} };
  const shell = { inert: introPlaying };
  const listeners = new Map();
  const frames = new Map();
  let frameId = 0;
  let effect, observer;
  let disconnected = false;
  let observeCount = 0;
  const compiled = { exports: {} };
  vm.runInNewContext(code, {
    module: compiled, exports: compiled.exports,
    require(name) {
      if (name === "react/jsx-runtime") return { jsx: (type, props) => ({ type, props }) };
      if (name === "react") return {
        useRef: () => ({ current: element }),
        useLayoutEffect: (callback) => { effect = callback; },
      };
      if (name === "../site/motionEvents") return events;
      if (name === "./RevealOnScroll.css") return {};
      throw new Error(`Unexpected import: ${name}`);
    },
    document: { querySelector: (selector) => selector === ".site-shell" ? shell : introPlaying ? {} : null },
    window: {
      addEventListener: (name, callback) => listeners.set(name, callback),
      removeEventListener: (name) => listeners.delete(name),
    },
    IntersectionObserver: class {
      constructor(callback, options) { observer = { callback, options }; }
      observe() { observeCount++; }
      unobserve() {}
      disconnect() { disconnected = true; }
    },
    requestAnimationFrame: (callback) => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: (id) => frames.delete(id),
  });
  const tree = compiled.exports.RevealOnScroll({ className: "copy", children: "Readable content", replayOnNavigation: route });
  const cleanup = effect();
  return {
    element, shell, tree, frames, listeners, cleanup,
    get observeCount() { return observeCount; },
    get disconnected() { return disconnected; },
    remount: () => effect(),
    intersect: (visible) => observer.callback([{ isIntersecting: visible }]),
    navigate: (href) => listeners.get(events.NAVIGATION_REPLAY_EVENT)?.({ detail: { href } }),
    setIntro(playing) { introPlaying = playing; shell.inert = playing; },
    finishIntro() {
      introPlaying = false;
      shell.inert = false;
      listeners.get(events.STARTUP_INTRO_FINISHED_EVENT)?.();
    },
    flush() {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback());
    },
  };
}

test("pending highlight paints before its smooth reveal, only when in view", () => {
  const h = harness();
  assert.equal(h.tree.props.children, "Readable content");
  assert.equal(h.tree.props["data-reveal"], undefined, "No-JS markup stays readable");
  assert.equal(h.element.dataset.reveal, "pending");
  assert.ok("revealReset" in h.element.dataset);
  assert.equal(h.frames.size, 0);
  h.intersect(true);
  h.flush();
  assert.equal(h.element.dataset.reveal, "pending");
  h.flush();
  assert.equal(h.element.dataset.reveal, "shown");
  assert.ok(!("revealReset" in h.element.dataset));
  h.cleanup();
});

test("every About navbar visit restarts a completed or cached highlight", () => {
  const h = harness("/about");
  for (let visit = 0; visit < 4; visit++) {
    if (visit) h.navigate("/about");
    assert.equal(h.element.dataset.reveal, "pending");
    h.intersect(true);
    h.flush(); h.flush();
    assert.equal(h.element.dataset.reveal, "shown");
  }
  assert.equal(h.observeCount, 4);
  h.cleanup();
  const cleanup = h.remount();
  assert.equal(h.element.dataset.reveal, "pending", "Reactivated cached pages also re-arm the reveal");
  h.intersect(true);
  h.flush(); h.flush();
  assert.equal(h.element.dataset.reveal, "shown");
  cleanup();
});

test("Home highlights re-arm on Home navigation, ignore other pages and wait for scrolling", () => {
  const h = harness("/");
  h.intersect(true);
  h.flush(); h.flush();
  h.navigate("/about");
  assert.equal(h.element.dataset.reveal, "shown");
  h.navigate("/");
  assert.equal(h.element.dataset.reveal, "pending");
  h.intersect(false);
  h.flush(); h.flush();
  assert.equal(h.element.dataset.reveal, "pending");
  h.intersect(true);
  h.flush(); h.flush();
  assert.equal(h.element.dataset.reveal, "shown");
  h.cleanup();
});

test("highlight waits for the intro screen to release the page", () => {
  const h = harness("/about", true);
  h.intersect(true);
  assert.equal(h.frames.size, 0);
  assert.equal(h.element.dataset.reveal, "pending");
  h.finishIntro();
  h.flush(); h.flush();
  assert.equal(h.element.dataset.reveal, "shown");
  h.cleanup();
});

test("an intro starting between frames or leaving the viewport cannot consume the reveal", () => {
  const h = harness();
  h.intersect(true);
  h.flush();
  h.setIntro(true);
  h.flush();
  assert.equal(h.element.dataset.reveal, "pending");
  h.finishIntro();
  h.flush();
  h.intersect(false);
  h.flush();
  assert.equal(h.element.dataset.reveal, "pending");
  h.intersect(true);
  h.flush(); h.flush();
  assert.equal(h.element.dataset.reveal, "shown");
  h.cleanup();
});

test("repeated navigation cancels stale frames and cleanup removes every listener", () => {
  const h = harness();
  h.intersect(true);
  h.flush();
  h.navigate("/about");
  assert.equal(h.frames.size, 0);
  h.intersect(true);
  h.cleanup();
  assert.equal(h.frames.size, 0);
  assert.equal(h.listeners.size, 0);
  assert.equal(h.disconnected, true);
  assert.deepEqual(h.element.dataset, {});
});

test("navbar uses actual client navigation events, not hover or modified-click handlers", () => {
  const nav = readFileSync(new URL("../site/NavLinks.tsx", import.meta.url), "utf8");
  assert.match(nav, /onNavigate=\{\(\) => window\.dispatchEvent\(new CustomEvent\(NAVIGATION_REPLAY_EVENT, \{ detail: \{ href \} \}\)\)\}/);
  const resetCss = readFileSync(new URL("./RevealOnScroll.css", import.meta.url), "utf8");
  assert.match(resetCss, /\[data-reveal-reset\] \.hl/);
  assert.match(resetCss, /\[data-reveal-reset\] \.utc-about-student-highlight/);
  assert.match(resetCss, /\[data-reveal-reset\] \.utc-about-history-highlight/);
  assert.match(resetCss, /transition: none !important;/);
});

test("archive highlights use the scroll reveal with staggered sweeps and reduced-motion support", () => {
  const page = readFileSync(new URL("../../app/about/page.tsx", import.meta.url), "utf8");
  assert.match(page, /<RevealOnScroll className="utc-about-history-copy" replayOnNavigation="\/about">[\s\S]*?id="utc-history-heading"[\s\S]*?<\/RevealOnScroll>/);
  const css = readFileSync(new URL("./AboutStudentHighlight.css", import.meta.url), "utf8");
  assert.match(css, /\.utc-about-history-copy\[data-reveal="pending"\] \.utc-about-history-highlight\s*\{[^}]*background-size: 0% 100%;[^}]*color: #ffffff;/);
  for (const [child, delay] of [["", 200], [":nth-child(2)", 400], [":nth-child(3)", 600]]) {
    assert.ok(css.includes(`.utc-about-history-copy[data-reveal="shown"] .utc-about-history-highlight${child} {\n  transition-delay: ${delay}ms, ${delay + 180}ms;`));
  }
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.utc-about-history-copy \.utc-about-history-highlight\s*\{[^}]*background-size: 100% 100% !important;[^}]*transition: none;/);
});
