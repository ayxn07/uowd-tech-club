import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("./CircleCursor.tsx", import.meta.url), "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
}).outputText;

function harness(finePointer = true) {
  const documentEvents = new Map();
  const windowEvents = new Map();
  const frames = new Map();
  const htmlAttributes = new Map();
  const styles = new Map();
  let effect;
  let nextFrame = 0;
  class Element {
    constructor(interactive = false) {
      this.interactive = interactive;
      this.backgroundColor = "rgba(0, 0, 0, 0)";
      this.backgroundImage = "none";
      this.tagName = "DIV";
      this.parentElement = null;
      this.grid = null;
    }
    closest() { return this.interactive ? this : null; }
    querySelector() { return this.grid; }
  }
  let hit = new Element();
  const cursor = {
    dataset: {},
    style: { setProperty: (key, value) => styles.set(key, value) },
    hasAttribute: (key) => key === "data-visible" && "visible" in cursor.dataset,
    toggleAttribute(key, enabled) {
      const name = key.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      if (enabled) this.dataset[name] = "";
      else delete this.dataset[name];
    },
    removeAttribute(key) { this.toggleAttribute(key, false); },
  };
  const pointer = {
    matches: finePointer,
    addEventListener: (_name, callback) => { pointer.onChange = callback; },
    removeEventListener: () => { delete pointer.onChange; },
  };
  const listeners = (map) => ({
    addEventListener: (name, callback) => map.set(name, callback),
    removeEventListener: (name) => map.delete(name),
  });
  const compiled = { exports: {} };
  const jsx = (type, props) => ({ type, props });
  vm.runInNewContext(code, {
    module: compiled, exports: compiled.exports, Element,
    require(name) {
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "react") return {
        useRef: () => ({ current: cursor }),
        useEffect: (callback) => { effect = callback; },
      };
      throw new Error(`Unexpected import: ${name}`);
    },
    document: {
      ...listeners(documentEvents),
      elementFromPoint: () => hit,
      documentElement: {
        setAttribute: (name, value) => htmlAttributes.set(name, value),
        removeAttribute: (name) => htmlAttributes.delete(name),
      },
    },
    window: { ...listeners(windowEvents), matchMedia: () => pointer },
    getComputedStyle: (element) => ({ backgroundColor: element.backgroundColor, backgroundImage: element.backgroundImage }),
    requestAnimationFrame: (callback) => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: (id) => frames.delete(id),
  });
  const tree = compiled.exports.CircleCursor();
  const cleanup = effect();
  return {
    cursor, styles, pointer, htmlAttributes, frames, tree, cleanup,
    documentEvents, windowEvents,
    event(name, options = {}) {
      if (name === "pointermove" || name === "pointerover") hit = options.target ?? new Element();
      (documentEvents.get(name) ?? windowEvents.get(name))?.({
        pointerType: "mouse", clientX: 100, clientY: 150, target: hit, ...options,
      });
    },
    target: () => new Element(true),
    surface(background, parent = null) {
      const element = new Element();
      element.backgroundColor = background;
      element.parentElement = parent;
      return element;
    },
    setSurface: (element) => { hit = element; },
    flush() {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback());
    },
  };
}

test("the cursor waits for movement and coalesces updates into a single frame", () => {
  const h = harness();
  assert.equal(h.tree.props["aria-hidden"], "true");
  assert.equal(h.htmlAttributes.size, 0);
  h.event("pointermove");
  h.event("pointermove", { clientX: 240, clientY: 320 });
  assert.equal(h.frames.size, 1);
  h.flush();
  assert.equal(h.styles.get("--cursor-x"), "240px");
  assert.equal(h.styles.get("--cursor-y"), "320px");
  assert.ok("visible" in h.cursor.dataset);
  assert.ok(h.htmlAttributes.has("data-circle-cursor"));
  h.cleanup();
});

test("hover and click feedback works for dynamically encountered controls", () => {
  const h = harness();
  h.event("pointermove", { target: h.target() });
  h.flush();
  assert.ok("hovered" in h.cursor.dataset);
  h.event("pointerdown");
  assert.ok("pressed" in h.cursor.dataset);
  h.event("pointerup");
  assert.ok(!("pressed" in h.cursor.dataset));
  h.event("pointerover");
  assert.ok(!("hovered" in h.cursor.dataset));
  h.cleanup();
});

test("touch and coarse pointers retain the native cursor", () => {
  for (const [fine, pointerType] of [[false, "mouse"], [true, "touch"]]) {
    const h = harness(fine);
    h.event("pointermove", { pointerType });
    h.flush();
    assert.equal(h.htmlAttributes.size, 0);
    assert.ok(!("visible" in h.cursor.dataset));
    h.cleanup();
  }
});

test("leaving, keyboard navigation and preference changes restore the native cursor", () => {
  for (const event of ["pointerleave", "blur", "pointercancel", "keydown", "preference"]) {
    const h = harness();
    h.event("pointermove");
    h.flush();
    if (event === "preference") h.pointer.onChange();
    else h.event(event, { key: "Tab" });
    assert.equal(h.htmlAttributes.size, 0);
    assert.ok(!("visible" in h.cursor.dataset));
    h.cleanup();
  }
});

test("cleanup cancels pending movement and removes every listener", () => {
  const h = harness();
  h.event("pointermove");
  h.cleanup();
  h.flush();
  assert.equal(h.frames.size, 0);
  assert.equal(h.documentEvents.size, 0);
  assert.equal(h.windowEvents.size, 0);
  assert.equal(h.htmlAttributes.size, 0);
  assert.equal(h.pointer.onChange, undefined);
});

test("styling enlarges the ring and respects reduced motion", () => {
  const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.circle-cursor-ring\s*\{[^}]*width: 44px;[^}]*height: 44px;/);
  assert.match(css, /\.circle-cursor\s*\{[^}]*--cursor-colour: #ffffff;/);
  assert.match(css, /\.circle-cursor\[data-light-surface\]\s*\{[^}]*--cursor-colour: var\(--utc-cobalt\);/);
  assert.match(css, /\.circle-cursor-dot\s*\{[^}]*background: var\(--cursor-colour\);/);
  assert.match(css, /\.circle-cursor-ring\s*\{[^}]*border: 2px solid var\(--cursor-colour\);/);
  assert.doesNotMatch(css.match(/\.circle-cursor\s*\{[^}]+\}/)?.[0] ?? "", /mix-blend-mode/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.circle-cursor-ring\s*\{\s*transition: none/);
});

test("white cards and transparent descendants use blue, while blue backgrounds use white", () => {
  const h = harness();
  const white = h.surface("rgb(255, 255, 255)");
  const text = h.surface("rgba(0, 0, 0, 0)", white);
  h.event("pointermove", { target: text });
  h.flush();
  assert.ok("lightSurface" in h.cursor.dataset);
  h.event("pointermove", { target: h.surface("rgb(16, 66, 214)", white) });
  h.flush();
  assert.ok(!("lightSurface" in h.cursor.dataset));
  h.cleanup();
});

test("translucent highlights on white are composited instead of mistaken for dark surfaces", () => {
  const h = harness();
  const white = h.surface("rgb(255, 255, 255)");
  h.event("pointermove", { target: h.surface("rgba(16, 66, 214, 0.09)", white) });
  h.flush();
  assert.ok("lightSurface" in h.cursor.dataset);
  h.cleanup();
});

test("images use white over a light page and restore blue when the pointer leaves", () => {
  const h = harness();
  const white = h.surface("rgb(255, 255, 255)");
  const image = h.surface("rgba(0, 0, 0, 0)", white);
  image.tagName = "IMG";
  for (const [target, lightSurface] of [[white, true], [image, false], [white, true]]) {
    h.event("pointermove", { target });
    h.flush();
    assert.equal("lightSurface" in h.cursor.dataset, lightSurface);
  }
  h.cleanup();
});

test("CSS background images and their transparent descendants use white", () => {
  const h = harness();
  const photo = h.surface("rgb(255, 255, 255)");
  photo.backgroundImage = 'url("/photo.webp")';
  const overlay = h.surface("rgba(0, 0, 0, 0.2)", photo);
  for (const target of [photo, overlay]) {
    h.event("pointermove", { target });
    h.flush();
    assert.ok(!("lightSurface" in h.cursor.dataset));
  }
  h.cleanup();
});

test("scrolling an image under a stationary pointer switches blue to white", () => {
  const h = harness();
  const white = h.surface("rgb(255, 255, 255)");
  h.event("pointermove", { target: white });
  h.flush();
  assert.ok("lightSurface" in h.cursor.dataset);
  const image = h.surface("rgba(0, 0, 0, 0)", white);
  image.tagName = "IMG";
  h.setSurface(image);
  h.event("scroll");
  h.flush();
  assert.ok(!("lightSurface" in h.cursor.dataset));
  h.cleanup();
});

test("scrolling under a stationary pointer updates its colour", () => {
  const h = harness();
  h.event("pointermove", { target: h.surface("rgb(255, 255, 255)") });
  h.flush();
  h.setSurface(h.surface("rgb(16, 66, 214)"));
  h.event("scroll");
  h.flush();
  assert.ok(!("lightSurface" in h.cursor.dataset));
  h.cleanup();
});

test("blue decorative grid fills keep a white cursor despite the white footer background", () => {
  const h = harness();
  const white = h.surface("rgb(255, 255, 255)");
  const cell = h.surface("rgb(16, 66, 214)");
  cell.getBoundingClientRect = () => ({ left: 80, right: 140, top: 120, bottom: 180 });
  white.grid = { querySelectorAll: () => [cell] };
  h.event("pointermove", { target: white });
  h.flush();
  assert.ok(!("lightSurface" in h.cursor.dataset));
  h.event("pointermove", { target: white, clientX: 200 });
  h.flush();
  assert.ok("lightSurface" in h.cursor.dataset);
  h.cleanup();
});
