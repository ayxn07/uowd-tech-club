import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { HERO_CONTENT, HERO_ROTATION_MS } from "./heroContent.ts";

test("every five seconds the retained text and photo layers crossfade without changing layout", () => {
  let state = 0;
  let mounted = false;
  let tick;
  let intervalMs;
  let cleanup;
  let cleared = false;
  const jsx = (type, props, key) => ({ type, props, key });
  const imageType = () => null;
  const gridType = () => null;
  const compiledModule = { exports: {} };
  const code = ts.transpileModule(
    readFileSync(new URL("./Hero.tsx", import.meta.url), "utf8"),
    { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true } },
  ).outputText;

  vm.runInNewContext(code, {
    module: compiledModule,
    exports: compiledModule.exports,
    require(name) {
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "react") return {
        useState: () => [state, (update) => { state = update(state); }],
        useEffect: (effect) => {
          if (!mounted) {
            cleanup = effect();
            mounted = true;
          }
        },
      };
      if (name === "next/image") return imageType;
      if (name === "@/components/InteractiveGrid") return { InteractiveGrid: gridType };
      if (name === "./heroContent") return { HERO_CONTENT, HERO_ROTATION_MS };
      if (name === "./Hero.css") return {};
      throw new Error(`Unexpected import: ${name}`);
    },
    setInterval(callback, ms) {
      tick = callback;
      intervalMs = ms;
      return 1;
    },
    clearInterval(id) { cleared = id === 1; },
  });

  function flatten(node) {
    if (!node || typeof node !== "object") return [];
    return [node, ...[node.props.children].flat(Infinity).flatMap(flatten)];
  }

  let initialStructure;
  for (let index = 0; index <= HERO_CONTENT.length; index++) {
    const nodes = flatten(compiledModule.exports.Hero());
    const structure = nodes.map(({ type, props }) => [type, props.className]);
    if (!initialStructure) initialStructure = structure;
    assert.deepEqual(structure, initialStructure, "The layout must not change between updates");
    const expected = HERO_CONTENT[index % HERO_CONTENT.length];
    const images = nodes.filter(({ type }) => type === imageType);
    assert.equal(images.length, HERO_CONTENT.length);
    assert.deepEqual(images.map(({ props }) => props.src), HERO_CONTENT.map(({ photo }) => photo.src));
    const visibleImages = images.filter(({ props }) => props["data-active"]);
    assert.equal(visibleImages.length, 1);
    assert.equal(visibleImages[0].props.src, expected.photo.src);
    assert.equal(visibleImages[0].props.alt, expected.photo.alt);
    for (const image of images) {
      assert.equal(image.props["aria-hidden"], !image.props["data-active"]);
      if (!image.props["data-active"]) assert.equal(image.props.alt, "");
    }
    assert.equal(nodes.filter(({ type }) => type === "h1").length, 1);
    for (const name of ["label", "heading", "description"]) {
      const layers = nodes.find(({ props }) => props.className === `utc-workspace-${name}`).props.children;
      assert.equal(layers.length, HERO_CONTENT.length);
      assert.equal(layers.filter(({ props }) => props["data-active"]).length, 1);
      for (const layer of layers) assert.equal(layer.props["aria-hidden"], !layer.props["data-active"]);
      const visible = layers.find(({ props }) => props["data-active"]);
      if (name === "label") assert.equal(visible.props.children[1], expected.label);
      if (name === "description") assert.equal(visible.props.children, expected.body);
      if (name === "heading") {
        assert.deepEqual(Array.from(visible.props.children, ({ props }) => props.children[0]), expected.lines);
      }
    }
    const countdown = nodes.find(({ props }) => props.className === "utc-workspace-progress-fill");
    assert.equal(countdown.key, index % HERO_CONTENT.length, "Reset the countdown with every content change");
    assert.equal(countdown.props.style.animationDuration, `${HERO_ROTATION_MS}ms`);
    assert.equal(intervalMs, 5000);
    tick();
  }
  cleanup();
  assert.ok(cleared, "The content timer must be cleared when the hero unmounts");
});

test("the hero crossfades opacity smoothly, keeps layers overlaid and honours reduced motion", () => {
  const css = readFileSync(new URL("./Hero.css", import.meta.url), "utf8");
  assert.match(css, /\.utc-workspace-fade,\s*\.utc-workspace-image\s*\{[^}]*opacity: 0;[^}]*transition: opacity 900ms cubic-bezier\(0\.4, 0, 0\.2, 1\);/);
  assert.match(css, /\.utc-workspace-fade\s*\{[^}]*grid-area: 1 \/ 1;/);
  assert.match(css, /\.utc-workspace-fade\[data-active\],\s*\.utc-workspace-image\[data-active\]\s*\{[^}]*opacity: 1;/);
  assert.match(css, /\.utc-workspace-image\s*\{[^}]*position: absolute;[^}]*inset: 0;/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.utc-workspace-fade,\s*\.utc-workspace-image\s*\{\s*transition: none;/);
});
