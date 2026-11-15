import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const code = ts.transpileModule(
  readFileSync(new URL("./StartupIntro.tsx", import.meta.url), "utf8"),
  { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } },
).outputText;

// Exercise the component's effects without a browser or animation driver.
function loadIntro(storage = new Map(), storageDisabled = false) {
  const compiledModule = { exports: {} };
  const frames = new Map();
  const listeners = new Map();
  const shell = { inert: false };
  const root = { dataset: {}, querySelector: () => null, querySelectorAll: () => [] };
  let instance;
  let nextFrame = 0;
  let animationCount = 0;
  const mark = {
    getBoundingClientRect: () => ({ left: 100, top: 100, width: 500, height: 200 }),
    animate: () => {
      animationCount++;
      return { finished: new Promise(() => {}), cancel() {} };
    },
  };
  const jsx = (type, props) => ({ type, props });
  vm.runInNewContext(code, {
    module: compiledModule, exports: compiledModule.exports,
    require(name) {
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "@/components/brand/UtcMark") return { UtcMark: () => null };
      if (name === "react") return {
        useState: (initial) => {
          instance.complete ??= typeof initial === "function" ? initial() : initial;
          return [instance.complete, (value) => { instance.complete = value; }];
        },
        useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot(),
        useCallback: (callback) => callback,
        useRef: (value) => {
          const index = instance.refIndex++;
          return instance.refs[index] ??= { current: value };
        },
        useEffect: (effect) => { instance.effect = effect; },
      };
      throw new Error(`Unexpected import: ${name}`);
    },
    document: {
      querySelector: (selector) => selector === ".site-shell" ? shell : mark,
    },
    window: {
      sessionStorage: {
        getItem(key) {
          if (storageDisabled) throw new Error("Storage disabled");
          return storage.get(key) ?? null;
        },
        setItem(key, value) {
          if (storageDisabled) throw new Error("Storage disabled");
          storage.set(key, value);
        },
      },
      matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
      setTimeout: () => 1,
      clearTimeout() {},
      addEventListener: (name, callback) => listeners.set(name, callback),
      removeEventListener: (name) => listeners.delete(name),
    },
    requestAnimationFrame: (callback) => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: (id) => frames.delete(id),
    getComputedStyle: () => ({ color: "blue" }),
  });

  return {
    shell, root,
    get animationCount() { return animationCount; },
    mount() {
      instance = { refs: [], refIndex: 0 };
      const animation = compiledModule.exports.StartupIntro();
      const tree = animation.type();
      if (tree) {
        tree.props.ref.current = root;
        instance.refs[1].current = mark;
      }
      const cleanup = instance.effect();
      return {
        cleanup,
        replayEffect: () => instance.effect(),
        get complete() { return instance.complete; },
      };
    },
    flushFrames() {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback());
    },
    dismiss: () => listeners.get("keydown")?.({ key: "Escape" }),
  };
}

test("the first visit animates, then releases the page and navbar logo", () => {
  const intro = loadIntro();
  const mounted = intro.mount();
  assert.equal(intro.shell.inert, true);
  assert.ok("playing" in intro.root.dataset);
  intro.flushFrames();
  assert.equal(intro.animationCount, 1);
  intro.dismiss();
  assert.equal(mounted.complete, true);
  mounted.cleanup();
  assert.equal(intro.shell.inert, false);
  assert.ok(!("playing" in intro.root.dataset));
});

test("navigation and full document loads in the same tab never replay the intro", () => {
  const storage = new Map();
  const intro = loadIntro(storage);
  const first = intro.mount();
  first.cleanup();
  const remounted = intro.mount();
  assert.equal(remounted.complete, true);
  assert.equal(intro.shell.inert, false);
  assert.ok(!("playing" in intro.root.dataset));

  const nextDocument = loadIntro(storage);
  assert.equal(nextDocument.mount().complete, true);
  nextDocument.flushFrames();
  assert.equal(nextDocument.animationCount, 0);
  assert.ok(!("playing" in nextDocument.root.dataset));
});

test("a new tab session still plays the intro", () => {
  const intro = loadIntro();
  assert.equal(intro.mount().complete, false);
  intro.flushFrames();
  assert.equal(intro.animationCount, 1);
});

test("development effect replay does not skip the initial animation", () => {
  const intro = loadIntro();
  const mounted = intro.mount();
  mounted.cleanup();
  const cleanup = mounted.replayEffect();
  assert.equal(mounted.complete, false);
  intro.flushFrames();
  assert.equal(intro.animationCount, 1);
  cleanup();
  assert.equal(intro.shell.inert, false);
});

test("disabled storage does not block the site or replay on client remounts", () => {
  const intro = loadIntro(new Map(), true);
  const first = intro.mount();
  intro.flushFrames();
  assert.equal(intro.animationCount, 1);
  first.cleanup();
  assert.equal(intro.mount().complete, true);
  assert.equal(intro.shell.inert, false);
});

test("the overlay is hidden until playback is explicitly enabled", () => {
  const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.startup-intro\s*\{[^}]*display: none;/);
  assert.match(css, /\.startup-intro\[data-playing\]\s*\{\s*display: grid;/);
  assert.match(css, /body:has\(\.startup-intro\[data-playing\]\) \.site-brand\s*\{\s*visibility: hidden;/);
  assert.ok(!css.includes("body:has(.startup-intro)"));
});
