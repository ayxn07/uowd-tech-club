import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as geometry from "./scrollbarGeometry.ts";

const source = readFileSync(new URL("./AdaptiveScrollbar.tsx", import.meta.url), "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
}).outputText;

function harness({ fine = true, forced = false, documentHeight = 3200 } = {}) {
  const windowEvents = new Map();
  const documentEvents = new Map();
  const trackEvents = new Map();
  const attributes = new Map();
  const styles = new Map();
  const frames = new Map();
  const observers = [];
  let effect;
  let refIndex = 0;
  let frameId = 0;
  let captured;
  const listeners = (map) => ({
    addEventListener: (name, callback) => map.set(name, callback),
    removeEventListener: (name) => map.delete(name),
  });
  const preference = (matches) => ({
    matches,
    addEventListener(_name, callback) { this.change = callback; },
    removeEventListener() { delete this.change; },
  });
  const finePointer = preference(fine);
  const forcedColors = preference(forced);
  let surfaces = [];
  const root = {
    clientHeight: 800,
    scrollHeight: documentHeight,
    toggleAttribute(name, enabled) { if (enabled) attributes.set(name, ""); else attributes.delete(name); },
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: (name) => attributes.delete(name),
  };
  const surface = (backgroundColor, parentElement = null) => ({
    backgroundColor, parentElement,
    querySelector() { return this.grid ?? null; },
  });
  let hit = surface("rgb(16, 66, 214)");
  const track = {
    ...listeners(trackEvents),
    hidden: true,
    clientHeight: 784,
    clientWidth: 20,
    dataset: {},
    style: { setProperty: (name, value) => styles.set(name, value) },
    getBoundingClientRect: () => ({ top: 8, bottom: 792, left: 980 }),
    contains: (element) => element === track || element === thumb,
    toggleAttribute(name, enabled) { if (enabled) attributes.set(name, ""); else attributes.delete(name); },
    setAttribute: (name, value) => attributes.set(name, value),
    setPointerCapture: (id) => { captured = id; },
    hasPointerCapture: (id) => captured === id,
    releasePointerCapture: () => { captured = undefined; },
    focus: () => { track.focused = true; },
  };
  const thumb = { style: {} };
  const window = {
    ...listeners(windowEvents),
    scrollY: 0,
    matchMedia: (query) => query.includes("any-pointer") ? finePointer : forcedColors,
    scrollTo({ top }) { this.scrollY = top; },
  };
  class Observer {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  const compiled = { exports: {} };
  const jsx = (type, props) => ({ type, props });
  vm.runInNewContext(code, {
    module: compiled, exports: compiled.exports,
    require(name) {
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "react") return {
        useRef: () => ({ current: refIndex++ === 0 ? track : thumb }),
        useEffect: (callback) => { effect = callback; },
      };
      if (name === "./scrollbarGeometry") return geometry;
      if (name === "./AdaptiveScrollbar.css") return {};
      throw new Error(`Unexpected import: ${name}`);
    },
    document: {
      ...listeners(documentEvents),
      documentElement: root, body: {},
      elementsFromPoint: (x, y) => [track, typeof hit === "function" ? hit(x, y) : hit],
      querySelectorAll: () => surfaces,
    },
    window,
    getComputedStyle: (element) => ({ backgroundColor: element.backgroundColor }),
    ResizeObserver: Observer,
    MutationObserver: Observer,
    requestAnimationFrame: (callback) => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: (id) => frames.delete(id),
  });
  const tree = compiled.exports.AdaptiveScrollbar();
  const cleanup = effect();
  return {
    track, thumb, root, window, attributes, frames, tree, observers, finePointer, forcedColors, cleanup,
    windowEvents, documentEvents, trackEvents, styles, surface,
    setSurface: (element) => { hit = element; },
    setSurfaces: (elements) => { surfaces = elements; },
    flush() {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback());
    },
    event(name, options = {}) {
      let prevented = false;
      (trackEvents.get(name) ?? windowEvents.get(name) ?? documentEvents.get(name))?.({
        button: 0, pointerId: 1, clientY: 20,
        preventDefault: () => { prevented = true; }, ...options,
      });
      return prevented;
    },
  };
}

test("progressive enhancement enables an accessible scrollbar and coalesces scroll updates", () => {
  const h = harness();
  assert.equal(h.track.hidden, true);
  assert.equal(h.tree.props.role, "scrollbar");
  assert.equal(h.tree.props["aria-controls"], "site-content");
  h.flush();
  assert.ok(h.attributes.has("data-adaptive-scrollbar"));
  assert.equal(h.thumb.style.height, "80px");
  h.window.scrollY = 1200;
  h.event("scroll");
  h.event("scroll");
  assert.equal(h.frames.size, 1);
  h.flush();
  assert.equal(h.thumb.style.transform, "translateY(352px)");
  assert.equal(h.attributes.get("aria-valuenow"), "50");
  h.cleanup();
});

test("route changes refresh progress without stretching the reference's handle", () => {
  const h = harness();
  h.flush();
  assert.equal(h.thumb.style.height, "80px");
  h.root.scrollHeight = 1600;
  h.window.scrollY = 800;
  h.observers[1].callback();
  h.flush();
  assert.equal(h.thumb.style.height, "80px");
  assert.equal(h.thumb.style.transform, "translateY(696px)");
  assert.equal(h.attributes.get("aria-valuenow"), "100");
  h.cleanup();
});

test("the tech slider has chamfered ends, three contrasting grips and a rail with square caps", () => {
  const css = readFileSync(new URL("./AdaptiveScrollbar.css", import.meta.url), "utf8");
  assert.match(css, /clip-path: polygon\(/);
  assert.match(css, /background: var\(--scrollbar-ink\);/);
  assert.match(css, /box-shadow: 0 4px var\(--scrollbar-grip\), 0 8px var\(--scrollbar-grip\);/);
  assert.match(css, /\.adaptive-scrollbar\[data-light-surface\]/);
  assert.match(css, /\.adaptive-scrollbar-rail\s*\{/);
  assert.match(css, /\.adaptive-scrollbar-cap-top\s*\{/);
  assert.match(css, /\.adaptive-scrollbar-cap-bottom\s*\{/);
  assert.match(css, /width: 20px;/);
  assert.match(css, /width: 12px;/);
  assert.match(css, /width: 6px;/);
  assert.match(css, /width: 4px;/);
  assert.doesNotMatch(css, /drop-shadow/);
  assert.match(source, /import "\.\/AdaptiveScrollbar\.css";/);
});

test("the compact scrollbar overlays the right edge without a gutter or backdrop", () => {
  const css = readFileSync(new URL("./AdaptiveScrollbar.css", import.meta.url), "utf8");
  assert.match(css, /\.adaptive-scrollbar\s*\{[^}]*right: 0;[^}]*width: 20px;[^}]*background: transparent;/);
  assert.match(css, /#site-content\.site-shell\s*\{\s*margin-right: 0;/);
  assert.doesNotMatch(css, /page-scrollbar-gutter|scrollbar-surface|\.adaptive-scrollbar::before/);
  assert.doesNotMatch(source, /scrollbar-surface/);
});

test("the scrollbar thumb has a one-pixel black outline that follows its cut corners", () => {
  const css = readFileSync(new URL("./AdaptiveScrollbar.css", import.meta.url), "utf8");
  assert.match(css, /\.adaptive-scrollbar-thumb::before\s*\{[^}]*background: var\(--scrollbar-outline, #000000\);[^}]*clip-path: polygon\(/);
  assert.match(css, /\.adaptive-scrollbar-thumb-fill\s*\{[^}]*inset: 1px;[^}]*background: var\(--scrollbar-ink\);[^}]*clip-path: polygon\(/);
  assert.match(source, /<span className="adaptive-scrollbar-thumb-fill" \/>/);
  assert.match(css, /--scrollbar-outline: CanvasText;/);
});

test("contrast is sampled directly beneath the rail rather than beside it", () => {
  const h = harness();
  h.setSurface((x) => h.surface(x === 990 ? "rgb(255, 255, 255)" : "rgb(16, 66, 214)"));
  h.flush();
  assert.ok(h.attributes.has("data-light-surface"));
  assert.equal(h.styles.get("--scrollbar-top-ink"), "var(--utc-cobalt)");
  assert.equal(h.styles.get("--scrollbar-bottom-ink"), "var(--utc-cobalt)");
  h.cleanup();
});

test("native page scrollbars are hidden on html and body from first paint, without a JS attribute", () => {
  const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /html,\s*body\s*\{[^}]*scrollbar-width: none !important;[^}]*scrollbar-gutter: auto !important;/);
  assert.match(css, /html::-webkit-scrollbar,\s*body::-webkit-scrollbar\s*\{[^}]*display: none !important;[^}]*width: 0 !important;[^}]*height: 0 !important;/);
  assert.doesNotMatch(css, /scrollbar-gutter: stable;/);
});

test("the single rail changes colour at the actual section boundary", () => {
  const h = harness();
  h.setSurface((_x, y) => h.surface(y < 400 ? "rgb(16, 66, 214)" : "rgb(255, 255, 255)"));
  h.setSurfaces([
    { getBoundingClientRect: () => ({ left: 0, right: 1100, top: 0, bottom: 400 }), classList: { contains: () => false } },
    { getBoundingClientRect: () => ({ left: 0, right: 1100, top: 400, bottom: 1600 }), classList: { contains: () => false } },
  ]);
  h.flush();
  assert.equal(h.styles.get("--scrollbar-rail"), "linear-gradient(to bottom, rgb(255 255 255 / 0.6) 0px 392px, color-mix(in srgb, var(--utc-cobalt) 60%, transparent) 392px 784px)");
  h.cleanup();
});

test("the thumb switches to cobalt on white and back to white on cobalt while scrolling", () => {
  const h = harness();
  h.flush();
  assert.ok(!h.attributes.has("data-light-surface"));
  h.setSurface(h.surface("rgb(255, 255, 255)"));
  h.event("scroll");
  h.flush();
  assert.ok(h.attributes.has("data-light-surface"));
  h.setSurface(h.surface("rgb(16, 66, 214)"));
  h.event("scroll");
  h.flush();
  assert.ok(!h.attributes.has("data-light-surface"));
  h.cleanup();
});

test("caps sample their own backgrounds rather than copying the thumb's colour", () => {
  const h = harness();
  h.setSurface((_x, y) => h.surface(y > 400 ? "rgb(255, 255, 255)" : "rgb(16, 66, 214)"));
  h.flush();
  assert.equal(h.styles.get("--scrollbar-top-ink"), "#ffffff");
  assert.equal(h.styles.get("--scrollbar-bottom-ink"), "var(--utc-cobalt)");
  assert.ok(!h.attributes.has("data-light-surface"));
  h.cleanup();
});

test("transparent content and pointer-transparent dissolve cells preserve surface contrast", () => {
  const h = harness();
  const white = h.surface("rgb(255, 255, 255)");
  const content = h.surface("rgba(0, 0, 0, 0)", white);
  h.setSurface(content);
  h.flush();
  assert.ok(h.attributes.has("data-light-surface"));

  const cell = h.surface("rgb(16, 66, 214)");
  cell.getBoundingClientRect = () => ({ left: 960, right: 1020, top: 0, bottom: 800 });
  white.grid = { querySelectorAll: () => [cell] };
  h.observers[1].callback();
  h.flush();
  assert.ok(!h.attributes.has("data-light-surface"));

  cell.backgroundColor = "rgb(255, 255, 255)";
  h.event("transitionend");
  h.flush();
  assert.ok(h.attributes.has("data-light-surface"));
  h.cleanup();
});

test("dragging keeps the grab offset, clamps endpoints and stops on cancellation", () => {
  const h = harness();
  h.flush();
  assert.equal(h.event("pointerdown", { clientY: 40 }), true);
  assert.equal(h.track.focused, true);
  assert.equal(h.window.scrollY, 0);
  h.event("pointermove", { clientY: 384 });
  assert.equal(h.window.scrollY, 1200);
  h.event("pointermove", { clientY: 2000 });
  assert.equal(h.window.scrollY, 2400);
  h.event("pointercancel");
  h.event("pointermove", { clientY: 0 });
  assert.equal(h.window.scrollY, 2400);
  assert.equal(h.track.dataset.dragging, undefined);
  h.cleanup();
});

test("track clicks centre the thumb and keyboard controls scroll the page", () => {
  const h = harness();
  h.flush();
  h.event("pointerdown", { clientY: 400 });
  assert.equal(h.window.scrollY, 1200);
  h.event("pointerup");
  for (const [key, expected] of [["End", 2400], ["Home", 0], ["ArrowDown", 40], ["PageDown", 760], ["ArrowUp", 720]]) {
    assert.equal(h.event("keydown", { key }), true);
    assert.equal(h.window.scrollY, expected);
  }
  assert.equal(h.event("keydown", { key: "Tab" }), false);
  h.cleanup();
});

test("touch-only devices and forced colours also use the custom scrollbar", () => {
  for (const options of [{ fine: false }, { forced: true }]) {
    const h = harness(options);
    h.flush();
    assert.equal(h.track.hidden, false);
    assert.ok(h.attributes.has("data-adaptive-scrollbar"));
    h.event("pointerdown", { pointerType: "touch", clientY: 40 });
    h.event("pointermove", { pointerType: "touch", clientY: 384 });
    assert.equal(h.window.scrollY, 1200);
    h.event("pointerup");
    assert.equal(h.track.dataset.dragging, undefined);
    h.cleanup();
  }
  const css = readFileSync(new URL("./AdaptiveScrollbar.css", import.meta.url), "utf8");
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.match(css, /--scrollbar-ink: CanvasText;/);
  assert.match(css, /--scrollbar-grip: Canvas;/);
});

test("non-scrolling pages hide the thumb; cleanup removes enhancement listeners", () => {
  const h = harness({ documentHeight: 800 });
  h.flush();
  assert.equal(h.track.hidden, true);
  h.root.scrollHeight = 3200;
  h.observers[0].callback();
  h.flush();
  assert.equal(h.track.hidden, false);
  h.event("scroll");
  h.cleanup();
  assert.equal(h.frames.size, 0);
  assert.equal(h.windowEvents.size, 0);
  assert.equal(h.documentEvents.size, 0);
  assert.equal(h.trackEvents.size, 0);
  assert.ok(h.observers.every((observer) => observer.disconnected));
  assert.ok(!h.attributes.has("data-adaptive-scrollbar"));
});
