import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("./ScrollHeader.tsx", import.meta.url), "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
}).outputText;

function harness(initialY = 0) {
  const windowEvents = new Map();
  const headerEvents = new Map();
  const attributes = new Set();
  const frames = new Map();
  let effect;
  let frameId = 0;
  const listeners = (map) => ({
    addEventListener: (name, callback) => map.set(name, callback),
    removeEventListener: (name) => map.delete(name),
  });
  const document = { documentElement: { scrollHeight: 3000 }, activeElement: null };
  const header = {
    ...listeners(headerEvents),
    offsetHeight: 80,
    contains: (element) => element === header,
    removeAttribute: (name) => attributes.delete(name),
    toggleAttribute: (name, value) => value ? attributes.add(name) : attributes.delete(name),
  };
  const window = { ...listeners(windowEvents), scrollY: initialY, innerHeight: 800 };
  const compiled = { exports: {} };
  vm.runInNewContext(code, {
    module: compiled, exports: compiled.exports, window, document,
    require(name) {
      if (name === "react/jsx-runtime") return { jsx: (type, props) => ({ type, props }) };
      if (name === "./HeaderOutline.css") return {};
      if (name === "react") return {
        useRef: () => ({ current: header }),
        useEffect: (callback) => { effect = callback; },
      };
      throw new Error(`Unexpected import: ${name}`);
    },
    requestAnimationFrame: (callback) => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: (id) => frames.delete(id),
  });
  const tree = compiled.exports.ScrollHeader({ children: "Navigation" });
  const cleanup = effect();
  return {
    tree, header, document, frames, windowEvents, headerEvents, cleanup,
    hidden: () => attributes.has("data-scroll-hidden"),
    scroll(y) { window.scrollY = y; windowEvents.get("scroll")(); },
    flush() {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback());
    },
  };
}

test("the navbar stays visible at the top, hides scrolling down and returns scrolling up", () => {
  const h = harness();
  assert.equal(h.tree.type, "header");
  assert.equal(h.hidden(), false);
  h.scroll(60); h.flush();
  assert.equal(h.hidden(), false);
  h.scroll(140); h.flush();
  assert.equal(h.hidden(), true);
  h.scroll(130); h.flush();
  assert.equal(h.hidden(), false);
  h.cleanup();
});

test("small movements accumulate but direction changes do not flicker the navbar", () => {
  const h = harness(200);
  h.scroll(205); h.flush();
  h.scroll(210); h.flush();
  assert.equal(h.hidden(), false);
  h.scroll(212); h.flush();
  assert.equal(h.hidden(), true);
  h.scroll(209); h.flush();
  assert.equal(h.hidden(), true);
  h.scroll(214); h.flush();
  h.scroll(210); h.flush();
  assert.equal(h.hidden(), true);
  h.scroll(206); h.flush();
  assert.equal(h.hidden(), false);
  h.cleanup();
});

test("keyboard focus reveals the navbar and keeps focused navigation visible", () => {
  const h = harness(200);
  h.scroll(250); h.flush();
  assert.equal(h.hidden(), true);
  h.document.activeElement = h.header;
  h.headerEvents.get("focusin")();
  assert.equal(h.hidden(), false);
  h.scroll(400); h.flush();
  assert.equal(h.hidden(), false);
  h.cleanup();
});

test("overscroll at either page edge does not spuriously reverse direction", () => {
  const h = harness(2100);
  h.scroll(2250); h.flush();
  assert.equal(h.hidden(), true);
  h.scroll(2200); h.flush();
  assert.equal(h.hidden(), true);
  h.scroll(0); h.flush();
  assert.equal(h.hidden(), false);
  h.scroll(-30); h.flush();
  assert.equal(h.hidden(), false);
  h.cleanup();
});

test("updates are coalesced and cleanup removes listeners and pending frames", () => {
  const h = harness();
  h.scroll(100);
  h.scroll(200);
  assert.equal(h.frames.size, 1);
  h.cleanup();
  assert.equal(h.frames.size, 0);
  assert.equal(h.windowEvents.size, 0);
  assert.equal(h.headerEvents.size, 0);
  assert.equal(h.hidden(), false);
});

test("sticky navigation uses a smooth slide without changing layout and respects reduced motion", () => {
  const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.site-header\s*\{[^}]*position: sticky;[^}]*top: 0;[^}]*transition: transform 350ms/);
  assert.match(css, /\.site-header\[data-scroll-hidden\]:not\(:focus-within\)\s*\{[^}]*transform: translateY\(-100%\);/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.site-header\s*\{\s*transition: none;/);
});

test("a thin cobalt outline follows the bottom edge and both chamfered corners without blocking navigation", () => {
  const css = readFileSync(new URL("./HeaderOutline.css", import.meta.url), "utf8");
  assert.match(source, /import "\.\/HeaderOutline\.css";/);
  assert.match(css, /\.site-header\s*\{[^}]*--header-outline: 1px;/);
  const outline = css.match(/\.site-header::after\s*\{([^}]+)\}/)?.[1];
  assert.ok(outline);
  assert.match(outline, /position: absolute;/);
  assert.match(outline, /inset: 0;/);
  assert.match(outline, /pointer-events: none;/);
  assert.match(outline, /background: var\(--utc-cobalt\);/);
  assert.match(outline, /clip-path: polygon\(/);
  assert.match(outline, /var\(--chip\) 100%/);
  assert.match(outline, /calc\(100% - var\(--chip\)\) 100%/);
  assert.match(outline, /var\(--header-outline\) \* 1\.41421356/);
  assert.match(outline, /var\(--header-outline\) \* 0\.41421356/);
});
