import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("./DirectionalCursor.tsx", import.meta.url), "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
}).outputText;

function harness({ fine = true, reduced = false } = {}) {
  const windowEvents = new Map();
  const documentEvents = new Map();
  const frames = new Map();
  const attributes = new Set();
  let effect;
  let nextFrame = 0;
  let time = 0;
  class Element {
    constructor(text = false) { this.text = text; }
    closest() { return this.text ? this : null; }
  }
  let hit = new Element();
  const cursor = {
    style: {}, attributes: new Set(),
    toggleAttribute(name, value) {
      if (value) this.attributes.add(name);
      else this.attributes.delete(name);
    },
    removeAttribute(name) { this.attributes.delete(name); },
  };
  const shape = { style: {} };
  const media = (matches) => ({
    matches,
    addEventListener(_name, callback) { this.change = callback; },
    removeEventListener() { delete this.change; },
  });
  const pointer = media(fine);
  const motion = media(reduced);
  const listeners = (map) => ({
    addEventListener: (name, callback) => map.set(name, callback),
    removeEventListener: (name) => map.delete(name),
  });
  const compiled = { exports: {} };
  let ref = 0;
  const jsx = (type, props) => ({ type, props });
  vm.runInNewContext(code, {
    module: compiled, exports: compiled.exports, Element,
    require(name) {
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "react") return {
        useRef: () => ({ current: ref++ === 0 ? cursor : shape }),
        useEffect: (callback) => { effect = callback; },
      };
      throw new Error(`Unexpected import: ${name}`);
    },
    document: {
      ...listeners(documentEvents),
      elementFromPoint: () => hit,
      documentElement: {
        toggleAttribute(name, value) { if (value) attributes.add(name); else attributes.delete(name); },
        removeAttribute: (name) => attributes.delete(name),
      },
    },
    window: {
      ...listeners(windowEvents),
      matchMedia: (query) => query.includes("reduced-motion") ? motion : pointer,
    },
    requestAnimationFrame: (callback) => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: (id) => frames.delete(id),
  });
  const tree = compiled.exports.DirectionalCursor();
  const cleanup = effect();
  return {
    cursor, shape, pointer, motion, attributes, frames, tree, cleanup,
    windowEvents, documentEvents,
    target: (text = false) => new Element(text),
    setTarget: (target) => { hit = target; },
    event(name, options = {}) {
      if (options.target) hit = options.target;
      (windowEvents.get(name) ?? documentEvents.get(name))?.({
        pointerType: "mouse", clientX: 100, clientY: 100, target: hit, ...options,
      });
    },
    flush() {
      const callbacks = [...frames.values()];
      frames.clear();
      time += 16;
      callbacks.forEach((callback) => callback(time));
    },
  };
}

test("mounts hidden and positions the arrow immediately at the pointer", () => {
  const h = harness();
  assert.equal(h.tree.props["aria-hidden"], "true");
  assert.equal(h.attributes.size, 0);
  h.event("pointermove", { clientX: 240, clientY: 320 });
  assert.equal(h.cursor.style.transform, "translate3d(240px, 320px, 0)");
  assert.ok(h.cursor.attributes.has("data-visible"));
  assert.ok(h.attributes.has("data-directional-cursor"));
  h.cleanup();
});

test("rotation follows direction smoothly, ignores jitter and eventually stops", () => {
  const h = harness();
  h.event("pointermove");
  h.event("pointermove", { clientX: 101 });
  assert.equal(h.frames.size, 0);
  h.event("pointermove", { clientX: 150 });
  h.flush();
  const angle = Number(h.shape.style.transform.match(/rotate\((.*)deg\)/)[1]);
  assert.ok(angle > 0 && angle < 90);
  for (let frame = 0; frame < 100 && h.frames.size; frame++) h.flush();
  assert.equal(h.shape.style.transform, "rotate(90deg)");
  assert.equal(h.frames.size, 0);
  h.cleanup();
});

test("reduced motion turns immediately without an animation loop", () => {
  const h = harness({ reduced: true });
  h.event("pointermove");
  h.event("pointermove", { clientY: 50 });
  assert.equal(h.shape.style.transform, "rotate(0deg)");
  h.event("pointermove", { clientX: 150, clientY: 50 });
  assert.equal(h.shape.style.transform, "rotate(90deg)");
  assert.equal(h.frames.size, 0);
  h.cleanup();
});

test("text fields restore the native caret, including after scrolling", () => {
  const h = harness();
  h.event("pointermove", { target: h.target(true) });
  assert.equal(h.attributes.size, 0);
  assert.ok(!h.cursor.attributes.has("data-visible"));
  h.setTarget(h.target());
  h.event("scroll");
  assert.ok(h.attributes.has("data-directional-cursor"));
  h.setTarget(h.target(true));
  h.event("pointerover");
  assert.equal(h.attributes.size, 0);
  h.cleanup();
});

test("coarse and touch pointers never hide the native cursor", () => {
  for (const [fine, pointerType] of [[false, "mouse"], [true, "touch"]]) {
    const h = harness({ fine });
    h.event("pointermove", { pointerType });
    assert.equal(h.attributes.size, 0);
    assert.equal(h.frames.size, 0);
    h.cleanup();
  }
});

test("exit, cancellation, keyboard and preference changes restore the native cursor", () => {
  for (const event of ["pointerout", "pointercancel", "blur", "keydown", "pointer", "motion"]) {
    const h = harness();
    h.event("pointermove");
    h.event("pointermove", { clientX: 150 });
    if (event === "pointer" || event === "motion") h[event].change();
    else h.event(event, { relatedTarget: null, key: "Tab" });
    assert.equal(h.attributes.size, 0);
    assert.equal(h.frames.size, 0);
    assert.ok(!h.cursor.attributes.has("data-visible"));
    h.cleanup();
  }
});

test("cleanup removes every listener and pending frame", () => {
  const h = harness();
  h.event("pointermove");
  h.event("pointermove", { clientX: 150 });
  h.cleanup();
  assert.equal(h.frames.size, 0);
  assert.equal(h.attributes.size, 0);
  assert.equal(h.windowEvents.size, 0);
  assert.equal(h.documentEvents.size, 0);
  assert.equal(h.pointer.change, undefined);
  assert.equal(h.motion.change, undefined);
});

test("brand arrow has opaque cobalt, a white outline and an ink contrast edge without blending", () => {
  const svg = readFileSync(new URL("../../public/utc-cursor.svg", import.meta.url), "utf8");
  const css = readFileSync(new URL("./DirectionalCursor.css", import.meta.url), "utf8");
  const layout = readFileSync(new URL("../../app/layout.tsx", import.meta.url), "utf8");
  assert.match(svg, /fill="#1072eb"/);
  assert.match(svg, /stroke="#ffffff"/);
  assert.match(css, /drop-shadow\(0 0 1px var\(--utc-ink\)\)/);
  assert.match(css, /transform-origin: 18px 4px/);
  assert.doesNotMatch(css, /mix-blend-mode/);
  assert.match(layout, /<DirectionalCursor \/>/);
  assert.doesNotMatch(layout, /CircleCursor/);
});
