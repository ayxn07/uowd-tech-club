import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { STARTUP_INTRO_FINISHED_EVENT } from "./motionEvents.ts";

const code = ts.transpileModule(
  readFileSync(new URL("./AudioToggle.tsx", import.meta.url), "utf8"),
  { compilerOptions: { target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } },
).outputText;

function harness({ loaded = true, introPlaying = false } = {}) {
  const states = [];
  const refs = [];
  const timers = new Map();
  const listeners = new Map();
  let stateIndex = 0;
  let refIndex = 0;
  let timerId = 0;
  let effect;
  let tree;
  let playResult = () => Promise.resolve();
  const audio = {
    playCalls: 0,
    pauseCalls: 0,
    paused: true,
    play() { this.playCalls++; this.paused = false; return playResult(); },
    pause() { this.pauseCalls++; this.paused = true; },
  };
  const button = { focused: false, focus() { this.focused = true; } };
  const document = {
    readyState: loaded ? "complete" : "loading",
    querySelector: () => introPlaying ? {} : null,
  };
  const compiled = { exports: {} };
  const jsx = (type, props) => ({ type, props });
  vm.runInNewContext(code, {
    module: compiled, exports: compiled.exports,
    require(name) {
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "./motionEvents") return { STARTUP_INTRO_FINISHED_EVENT };
      if (name === "./AudioToggle.css") return {};
      if (name === "react") return {
        useRef(initial) { return refs[refIndex++] ??= { current: initial }; },
        useState(initial) {
          const index = stateIndex++;
          if (!(index in states)) states[index] = initial;
          return [states[index], (value) => { states[index] = value; }];
        },
        useEffect(callback) { effect = callback; },
      };
      throw new Error(`Unexpected import: ${name}`);
    },
    document,
    window: {
      setTimeout(callback, delay) { timers.set(++timerId, { callback, delay }); return timerId; },
      clearTimeout(id) { timers.delete(id); },
      addEventListener(name, callback) { listeners.set(name, callback); },
      removeEventListener(name) { listeners.delete(name); },
    },
  });
  function render() {
    stateIndex = 0;
    refIndex = 0;
    tree = compiled.exports.AudioToggle();
    tree.props.children[0].props.ref.current = audio;
    tree.props.children[1].props.ref.current = button;
  }
  render();
  const cleanup = effect();
  return {
    audio, document, timers, listeners, cleanup, toggleButton: button,
    get button() { render(); return tree.props.children[1].props; },
    get media() { render(); return tree.props.children[0].props; },
    get dismiss() { render(); return tree.props.children[2]?.props; },
    get status() { render(); return tree.props.children[3].props; },
    click() { return this.button.onClick(); },
    finishIntro() { introPlaying = false; listeners.get(STARTUP_INTRO_FINISHED_EVENT)?.(); },
    load() { document.readyState = "complete"; listeners.get("load")?.(); },
    rejectPlayWith(result) { playResult = result; },
    flushTimers() {
      const pending = [...timers.values()];
      timers.clear();
      pending.forEach(({ callback }) => callback());
    },
  };
}

test("starts as a silent circle, then opens after one second without preloading music", () => {
  const h = harness();
  assert.equal(h.button["data-expanded"], undefined);
  assert.equal(h.button["aria-pressed"], false);
  assert.equal(h.media.preload, "none");
  assert.equal(h.media.loop, true);
  assert.equal(h.media.autoPlay, undefined);
  assert.equal(h.audio.playCalls, 0);
  assert.equal([...h.timers.values()][0].delay, 1000);
  h.flushTimers();
  assert.equal(h.button["data-expanded"], "");
  h.cleanup();
});

test("waits for both page load and the startup animation", () => {
  const h = harness({ loaded: false, introPlaying: true });
  assert.equal(h.timers.size, 0);
  h.load();
  h.flushTimers();
  assert.equal(h.button["data-expanded"], undefined);
  h.finishIntro();
  assert.equal([...h.timers.values()][0].delay, 1000);
  h.flushTimers();
  assert.equal(h.button["data-expanded"], "");
  h.cleanup();
});

test("click starts playback, collapses the pill, and the next clicks pause and resume", async () => {
  const h = harness();
  h.flushTimers();
  await h.click();
  assert.equal(h.audio.playCalls, 1);
  assert.equal(h.audio.volume, 0.4);
  h.media.onPlaying();
  assert.equal(h.button["data-expanded"], undefined);
  assert.equal(h.button["aria-pressed"], true);
  assert.equal(h.button["aria-label"], "Disable audio");
  await h.click();
  assert.equal(h.audio.paused, true);
  assert.equal(h.button["aria-pressed"], false);
  await h.click();
  h.media.onPlaying();
  assert.equal(h.audio.playCalls, 2);
  assert.equal(h.button["aria-pressed"], true);
  h.finishIntro();
  assert.equal(h.timers.size, 0);
  h.cleanup();
});

test("a click before the prompt timer prevents it opening later", async () => {
  const h = harness();
  await h.click();
  h.media.onPlaying();
  h.flushTimers();
  assert.equal(h.button["data-expanded"], undefined);
  h.cleanup();
});

test("failed playback is announced and can be retried", async () => {
  const h = harness();
  h.flushTimers();
  h.rejectPlayWith(() => Promise.reject(new Error("Playback blocked")));
  await h.click();
  assert.equal(h.button["aria-pressed"], false);
  assert.equal(h.button["data-expanded"], "");
  assert.match(h.status.children, /try again/);
  h.rejectPlayWith(() => Promise.resolve());
  await h.click();
  h.media.onPlaying();
  assert.equal(h.button["aria-pressed"], true);
  assert.equal(h.status.children, "");
  h.cleanup();
});

test("the close button dismisses the prompt silently and leaves the icon usable", async () => {
  const h = harness();
  assert.equal(h.dismiss, undefined);
  h.flushTimers();
  assert.equal(h.dismiss["aria-label"], "Dismiss audio prompt");
  h.dismiss.onClick();
  assert.equal(h.audio.playCalls, 0);
  assert.equal(h.audio.paused, true);
  assert.equal(h.button["data-expanded"], undefined);
  assert.equal(h.button["aria-pressed"], false);
  assert.equal(h.dismiss, undefined);
  assert.equal(h.toggleButton.focused, true);
  h.finishIntro();
  h.load();
  assert.equal(h.timers.size, 0);
  await h.click();
  h.media.onPlaying();
  assert.equal(h.button["aria-pressed"], true);
  h.cleanup();
});

test("dismissing while playback is pending prevents late playback or error messages", async () => {
  const h = harness();
  h.flushTimers();
  let reject;
  h.rejectPlayWith(() => new Promise((_resolve, onReject) => { reject = onReject; }));
  const pending = h.click();
  h.dismiss.onClick();
  reject(new Error("Interrupted by dismissal"));
  await pending;
  h.media.onPlaying();
  assert.equal(h.audio.paused, true);
  assert.equal(h.button["aria-pressed"], false);
  assert.equal(h.status.children, "");
  h.cleanup();
});

test("rapid toggles ignore a stale play rejection and late playing event", async () => {
  const h = harness();
  let reject;
  h.rejectPlayWith(() => new Promise((_resolve, onReject) => { reject = onReject; }));
  const pending = h.click();
  await h.click();
  reject(new Error("Interrupted by pause"));
  await pending;
  h.media.onPlaying();
  assert.equal(h.audio.paused, true);
  assert.equal(h.button["aria-pressed"], false);
  assert.equal(h.status.children, "");
  h.cleanup();
});

test("media errors reset the toggle, and unmount removes listeners and pauses music", async () => {
  const h = harness();
  await h.click();
  h.media.onPlaying();
  h.media.onError();
  assert.equal(h.button["aria-pressed"], false);
  assert.match(h.status.children, /couldn’t load/);
  h.cleanup();
  assert.equal(h.timers.size, 0);
  assert.equal(h.listeners.size, 0);
  assert.equal(h.audio.paused, true);
});

test("the dismiss circle stays vertically centered on the right of the pill", () => {
  const css = readFileSync(new URL("./AudioToggle.css", import.meta.url), "utf8");
  const dismiss = css.match(/\.audio-toggle__dismiss\s*\{([^}]+)\}/)?.[1];
  assert.ok(dismiss);
  assert.match(dismiss, /top: 50%;/);
  assert.match(dismiss, /right: 0\.625rem;/);
  assert.match(dismiss, /transform: translateY\(-50%\);/);
});

test("the supplied music is bundled and mounted once in the shared layout", () => {
  const layout = readFileSync(new URL("../../app/layout.tsx", import.meta.url), "utf8");
  assert.equal((layout.match(/<AudioToggle\s*\/>/g) ?? []).length, 1);
  assert.ok(statSync(new URL("../../public/audio/tech-club-ambient.mp3", import.meta.url)).size > 0);
  const css = readFileSync(new URL("./AudioToggle.css", import.meta.url), "utf8");
  assert.match(css, /\.audio-toggle__label:hover/);
  assert.match(css, /text-decoration-line: underline/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});
