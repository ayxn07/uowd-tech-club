import assert from "node:assert/strict";
import test from "node:test";
import { HISTORY_EVENTS, HISTORY_YEARS } from "./clubHistory.ts";
import {
  TERMS,
  academicMonths,
  calendarDays,
  eventsInMonth,
  eventsOnDate,
  formatEventDate,
  formatMonth,
  selectionForMonth,
  selectionForTerm,
  selectionForYear,
  termForMonth,
} from "./archiveCalendar.ts";

test("the approved preview opens on the AI Challenge in February 2025", () => {
  assert.deepEqual(selectionForYear(HISTORY_YEARS[2], HISTORY_EVENTS), {
    yearId: "2024-25", month: "2025-02", eventId: "ai-challenge",
  });
  assert.equal(formatMonth("2025-02"), "February 2025");
});

test("academic years run from September to August with the right terms", () => {
  for (const year of HISTORY_YEARS) {
    const months = academicMonths(year);
    assert.equal(months.length, 12);
    assert.equal(months[0], `${year.startYear}-09`);
    assert.equal(months[11], `${year.startYear + 1}-08`);
    assert.deepEqual(months.map(termForMonth), [
      ...Array(4).fill("Autumn"), ...Array(3).fill("Winter"), ...Array(5).fill("Spring"),
    ]);
  }
});

test("every year and term selects a valid month and never keeps a stale event", () => {
  for (const year of HISTORY_YEARS) {
    for (const selection of [
      selectionForYear(year, HISTORY_EVENTS),
      ...TERMS.map((term) => selectionForTerm(year, HISTORY_EVENTS, term)),
    ]) {
      assert.equal(selection.yearId, year.id);
      assert.ok(academicMonths(year).includes(selection.month));
      const events = eventsInMonth(HISTORY_EVENTS, selection.month);
      assert.ok(selection.eventId === null || events.some((event) => event.id === selection.eventId));
    }
    for (const term of TERMS) {
      assert.equal(termForMonth(selectionForTerm(year, HISTORY_EVENTS, term).month), term);
    }
  }
});

test("the empty Autumn 2023 term does not invent events", () => {
  const selection = selectionForTerm(HISTORY_YEARS[1], HISTORY_EVENTS, "Autumn");
  assert.equal(selection.month, "2023-09");
  assert.equal(selection.eventId, null);
  assert.deepEqual(eventsInMonth(HISTORY_EVENTS, "2023-09"), []);
});

test("every calendar month has valid Monday-first weeks, including leap years", () => {
  for (const year of HISTORY_YEARS) {
    for (const month of academicMonths(year)) {
      const days = calendarDays(month);
      assert.equal(days.length % 7, 0);
      assert.equal(new Set(days.map(({ date }) => date)).size, days.length);
      assert.equal(new Date(`${days[0].date}T12:00:00Z`).getUTCDay(), 1);
      assert.equal(new Date(`${days.at(-1).date}T12:00:00Z`).getUTCDay(), 0);
      const [y, m] = month.split("-").map(Number);
      const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
      assert.equal(days.filter(({ inMonth }) => inMonth).length, count);
      assert.deepEqual(days.filter(({ inMonth }) => inMonth).map(({ day }) => day), Array.from({ length: count }, (_, i) => i + 1));
    }
  }
  assert.equal(calendarDays("2024-02").filter(({ inMonth }) => inMonth).length, 29);
  const february = calendarDays("2025-02");
  assert.equal(february.findIndex(({ date }) => date === "2025-02-01"), 5);
  assert.equal(february.findIndex(({ date }) => date === "2025-02-21") % 7, 4);
});

test("overlapping events and multi-day workshops remain independently available", () => {
  assert.deepEqual(eventsOnDate(HISTORY_EVENTS, "2025-02-06").map(({ id }) => id), ["react-2", "arduino"]);
  assert.equal(eventsOnDate(HISTORY_EVENTS, "2026-06-08").find(({ id }) => id === "odoo-series")?.title, "The Odoo Series");
  assert.ok(!eventsOnDate(HISTORY_EVENTS, "2026-06-09").some(({ id }) => id === "odoo-series"));
  assert.ok(eventsOnDate(HISTORY_EVENTS, "2026-06-10").some(({ id }) => id === "mcp-build"));
  assert.equal(formatEventDate(HISTORY_EVENTS.find(({ id }) => id === "odoo-series")), "1 Jun 2026 – 8 Jun 2026");
});

test("navigation stays within the academic year and empty months clear the selection", () => {
  const year = HISTORY_YEARS[2];
  assert.equal(selectionForMonth(year, HISTORY_EVENTS, "2026-02").month, "2024-09");
  assert.equal(selectionForMonth(year, HISTORY_EVENTS, "2025-08").eventId, null);
});

test("archive records have unique IDs, valid source dates and a single academic year", () => {
  assert.equal(new Set(HISTORY_EVENTS.map(({ id }) => id)).size, HISTORY_EVENTS.length);
  for (const event of HISTORY_EVENTS) {
    assert.equal(new Date(`${event.date}T12:00:00Z`).toISOString().slice(0, 10), event.date);
    assert.ok(event.title.length > 0 && event.description.length > 0);
    assert.ok((event.endDate ?? event.date) >= event.date);
    assert.equal(HISTORY_YEARS.filter((year) => academicMonths(year).includes(event.date.slice(0, 7))).length, 1);
  }
  for (const year of HISTORY_YEARS) {
    assert.ok(HISTORY_EVENTS.some(({ id }) => id === year.featuredEventId));
  }
});
