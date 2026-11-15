import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as history from "./clubHistory.ts";
import * as calendar from "./archiveCalendar.ts";

function calendarHarness() {
  const state = [];
  let cursor = 0;
  const jsx = (type, props, key) => ({ type, props, key });
  const compiledModule = { exports: {} };
  const code = ts.transpileModule(
    readFileSync(new URL("./HistoryCalendar.tsx", import.meta.url), "utf8"),
    { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true } },
  ).outputText;

  vm.runInNewContext(code, {
    module: compiledModule,
    exports: compiledModule.exports,
    require(name) {
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "react") return {
        useState(initial) {
          const index = cursor++;
          if (!(index in state)) state[index] = typeof initial === "function" ? initial() : initial;
          return [state[index], (update) => {
            state[index] = typeof update === "function" ? update(state[index]) : update;
          }];
        },
      };
      if (name === "next/image") return () => null;
      if (name === "./clubHistory") return history;
      if (name === "./archiveCalendar") return calendar;
      throw new Error(`Unexpected import ${name}`);
    },
  });

  function flatten(node) {
    if (!node || typeof node !== "object") return [];
    return [node, ...[node.props.children].flat(Infinity).flatMap(flatten)];
  }
  function render() {
    cursor = 0;
    return flatten(compiledModule.exports.HistoryCalendar());
  }
  function text(node) {
    if (node === null || node === undefined || typeof node === "boolean") return "";
    if (typeof node !== "object") return String(node);
    return [node.props.children].flat(Infinity).map(text).join("");
  }
  function button(nodes, label) {
    const result = nodes.find((node) => node.type === "button" && (node.props["aria-label"] === label || text(node).trim() === label));
    assert.ok(result, `Missing button: ${label}`);
    return result;
  }
  return { render, text, button };
}

test("year, term, month and list controls actually change the archive", () => {
  const { render, button, text } = calendarHarness();
  let nodes = render();
  assert.equal(text(nodes.find(({ props }) => props.id === "utc-archive-event-title")), "The AI Challenge");

  button(nodes, "2025–26").props.onClick();
  nodes = render();
  assert.equal(text(nodes.find(({ props }) => props.id === "utc-archive-month")), "June 2026");
  assert.equal(text(nodes.find(({ props }) => props.id === "utc-archive-event-title")), "UOWD Capture the Flag");

  button(nodes, "Winter").props.onClick();
  nodes = render();
  assert.equal(text(nodes.find(({ props }) => props.id === "utc-archive-month")), "January 2026");
  button(nodes, "Next month").props.onClick();
  nodes = render();
  assert.equal(text(nodes.find(({ props }) => props.id === "utc-archive-month")), "February 2026");

  button(nodes, "List").props.onClick();
  nodes = render();
  assert.ok(!nodes.some(({ type }) => type === "table"));
  const agent = nodes.find((node) => node.type === "button" && text(node).includes("Agentic AI Workshop"));
  agent.props.onClick();
  nodes = render();
  assert.equal(text(nodes.find(({ props }) => props.id === "utc-archive-event-title")), "Agentic AI Workshop");
  assert.ok(nodes.some(({ props }) => props["aria-pressed"] === true));

  button(nodes, "Grid").props.onClick();
  nodes = render();
  assert.ok(nodes.some(({ type }) => type === "table"));
});

test("the archive starts with selectors and has no year-summary block for any year", () => {
  const { render, button } = calendarHarness();
  for (const year of history.HISTORY_YEARS) {
    button(render(), year.label).props.onClick();
    const nodes = render();
    const archive = nodes.find(({ props }) => props.className === "utc-archive");
    assert.deepEqual(Array.from(archive.props.children, ({ props }) => props.className), [
      "utc-archive-controls", "utc-archive-layout",
    ]);
    assert.ok(!nodes.some(({ props }) => props.className === "utc-archive-chapter"));
  }
});

test("the archive top spacing matches its side padding without extra control padding", () => {
  const css = readFileSync(new URL("./AboutPage.css", import.meta.url), "utf8");
  const archive = css.match(/\.utc-archive\s*\{([^}]+)\}/)?.[1];
  const controls = css.match(/\.utc-archive-controls\s*\{([^}]+)\}/)?.[1];
  assert.ok(archive);
  assert.ok(controls);
  assert.match(archive, /padding: clamp\(1rem, 2\.5vw, 2\.5rem\);/);
  assert.match(controls, /padding-bottom: 2rem;/);
  assert.doesNotMatch(controls, /(?:padding(?:-top|-block)?|margin(?:-top|-block)?):/);
});

test("the month dropdown sits immediately before the navigation arrows", () => {
  const nodes = calendarHarness().render();
  const controls = nodes.find(({ props }) => props.className === "utc-archive-month-controls");
  assert.ok(controls);
  assert.deepEqual(Array.from(controls.props.children, ({ props }) => props.className), [
    "utc-archive-month-select", "utc-archive-month-buttons",
  ]);
  const nav = nodes.find(({ props }) => props.className === "utc-archive-month-nav");
  assert.ok(nav.props.children.includes(controls));
});

test("event tags share a header with the date and the image has no caption or footer note", () => {
  const { render, text } = calendarHarness();
  const nodes = render();
  const header = nodes.find(({ props }) => props.className === "utc-archive-event-header");
  assert.ok(header);
  assert.deepEqual(Array.from(header.props.children, ({ props }) => props.className), [
    "utc-archive-event-date", "utc-archive-event-tags",
  ]);
  const tags = nodes.find(({ props }) => props.className === "utc-archive-event-tags");
  assert.equal(text(tags), "AI");
  assert.ok(!nodes.some(({ type }) => type === "figcaption"));
  assert.ok(!nodes.some(({ props }) => props.className === "utc-archive-event-footer"));

  const css = readFileSync(new URL("./AboutPage.css", import.meta.url), "utf8");
  assert.match(css, /\.utc-archive-event-header\s*\{[^}]*grid-template-columns: max-content minmax\(0, 1fr\);[^}]*align-items: center;/);
  assert.match(css, /\.utc-archive-event-tags\s*\{[^}]*justify-content: flex-end;/);
  assert.doesNotMatch(css, /\.utc-archive-event-footer/);
});

test("both events on the same date are selectable", () => {
  const { render, button, text } = calendarHarness();
  let nodes = render();
  const day = nodes.find((node) => node.type === "button" && node.props["aria-label"]?.startsWith("6 Feb 2025:"));
  day.props.onClick();
  nodes = render();
  assert.equal(text(nodes.find(({ props }) => props.id === "utc-archive-event-title")), "React Foundation Series · 2");
  button(nodes, "Arduino Workshop").props.onClick();
  nodes = render();
  assert.equal(text(nodes.find(({ props }) => props.id === "utc-archive-event-title")), "Arduino Workshop");
});

test("single-event dates use category portraits while every shared date keeps the original landscape", () => {
  const { render, button, text } = calendarHarness();
  const portraits = new Set();
  const sharedDates = new Set();
  for (const year of history.HISTORY_YEARS) {
    button(render(), year.label).props.onClick();
    for (const month of calendar.academicMonths(year)) {
      render().find(({ type }) => type === "select").props.onChange({ target: { value: month } });
      button(render(), "List").props.onClick();
      const monthEvents = calendar.eventsInMonth(history.HISTORY_EVENTS, month);
      for (const event of monthEvents) {
        const item = render().find((node) => node.type === "button"
          && node.props["aria-controls"] === "utc-archive-event" && text(node).includes(event.title));
        item.props.onClick();
        const nodes = render();
        const panel = nodes.find(({ props }) => props.id === "utc-archive-event");
        const figure = nodes.find(({ props }) => props.className === "utc-archive-community-image");
        const image = figure.props.children;
        const sameDay = calendar.eventsOnDate(monthEvents, event.date);
        const controls = nodes.find(({ props }) => props.className === "utc-archive-same-day");
        if (sameDay.length === 1) {
          assert.equal(panel.props["data-single-event"], true, event.id);
          assert.equal(figure.props["data-portrait"], true, event.id);
          assert.equal(image.props.fill, true);
          assert.equal(image.props.width, undefined);
          assert.equal(image.props.height, undefined);
          assert.match(image.props.src, /^\/images\/about\/archive\/utc-archive-\w+-portrait\.webp$/);
          assert.equal(controls, undefined);
          portraits.add(image.props.src);
        } else {
          sharedDates.add(event.date);
          assert.equal(panel.props["data-single-event"], undefined);
          assert.equal(figure.props["data-portrait"], undefined);
          assert.equal(image.props.src, "/images/hero/utc-hero-hackathon.png");
          assert.equal(image.props.width, 1672);
          assert.equal(image.props.height, 941);
          assert.equal(image.props.fill, undefined);
          assert.ok(controls);
          for (const alternative of sameDay) assert.ok(text(controls).includes(alternative.title));
        }
      }
    }
  }
  assert.equal(portraits.size, 7);
  assert.equal(sharedDates.size, 3);
  for (const src of portraits) {
    const file = readFileSync(new URL(`../../public${src}`, import.meta.url));
    assert.equal(file.toString("ascii", 0, 4), "RIFF");
    assert.equal(file.toString("ascii", 8, 12), "WEBP");
    assert.ok(file.length < 200_000, `Portrait should be web-optimised: ${src}`);
  }
});

test("portrait images fill unused desktop card space and stay portrait on smaller screens", () => {
  const css = readFileSync(new URL("./AboutPage.css", import.meta.url), "utf8");
  assert.match(css, /\.utc-archive-event-panel\[data-single-event\]\s*\{[^}]*gap: 2rem;/);
  assert.match(css, /\.utc-archive-community-image\[data-portrait\]\s*\{[^}]*position: relative;[^}]*flex: 1;[^}]*min-height: 20rem;/);
  assert.match(css, /\.utc-archive-community-image\[data-portrait\] img\s*\{[^}]*object-fit: cover;/);
  assert.match(css, /@media \(max-width: 1050px\)[\s\S]*?\.utc-archive-community-image\[data-portrait\]\s*\{[^}]*aspect-ratio: 2 \/ 3;/);
  assert.match(css, /@media \(max-width: 600px\)[\s\S]*?\.utc-archive-community-image\[data-portrait\]\s*\{[^}]*flex: none;/);
});

test("every month renders complete event titles in grid and list views", () => {
  const { render, button, text } = calendarHarness();
  for (const year of history.HISTORY_YEARS) {
    button(render(), year.label).props.onClick();
    for (const month of calendar.academicMonths(year)) {
      render().find(({ type }) => type === "select").props.onChange({ target: { value: month } });
      const expected = calendar.eventsInMonth(history.HISTORY_EVENTS, month);
      let nodes = render();
      for (const event of expected) {
        assert.ok(nodes.some(({ props }) => props.className === "utc-archive-event-chip" && text({ props }) === event.title), `Missing grid title: ${event.title}`);
      }
      button(nodes, "List").props.onClick();
      nodes = render();
      for (const event of expected) {
        assert.ok(nodes.some((node) => node.type === "strong" && text(node) === event.title), `Missing list title: ${event.title}`);
      }
      button(nodes, "Grid").props.onClick();
    }
  }
});

test("empty months display an honest empty state and year boundaries disable navigation", () => {
  const { render, button, text } = calendarHarness();
  let nodes = render();
  button(nodes, "2023–24").props.onClick();
  nodes = render();
  button(nodes, "Autumn").props.onClick();
  nodes = render();
  assert.equal(button(nodes, "Previous month").props.disabled, true);
  assert.equal(text(nodes.find(({ props }) => props.id === "utc-archive-event-title")), "A quieter chapter.");
  assert.match(text(nodes.find(({ props }) => props.className === "utc-archive-event-description")), /Not every month has a recorded event/);
  assert.equal(nodes.find(({ props }) => props.id === "utc-archive-event").props["data-single-event"], undefined);
  assert.equal(nodes.find(({ props }) => props.className === "utc-archive-community-image").props.children.props.src, "/images/hero/utc-hero-hackathon.png");

  nodes.find(({ type }) => type === "select").props.onChange({ target: { value: "2024-08" } });
  nodes = render();
  assert.equal(button(nodes, "Next month").props.disabled, true);
  assert.equal(text(nodes.find(({ props }) => props.id === "utc-archive-month")), "August 2024");
});
