import type { AcademicYear, HistoryEvent } from "./clubHistory";

export const TERMS = ["Autumn", "Winter", "Spring"] as const;
export type Term = (typeof TERMS)[number];

export type ArchiveSelection = {
  yearId: string;
  month: string;
  eventId: string | null;
};

export type CalendarDay = {
  date: string;
  day: number;
  inMonth: boolean;
};

const MONTH_FORMAT = new Intl.DateTimeFormat("en-GB", {
  month: "long", year: "numeric", timeZone: "UTC",
});
const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
});

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function utcDate(date: string) {
  return new Date(`${date}T12:00:00Z`);
}

export function formatMonth(month: string) {
  return MONTH_FORMAT.format(utcDate(`${month}-01`));
}

export function formatEventDate(event: Pick<HistoryEvent, "date" | "endDate">) {
  const start = DATE_FORMAT.format(utcDate(event.date));
  return event.endDate
    ? `${start} – ${DATE_FORMAT.format(utcDate(event.endDate))}`
    : start;
}

export function termForMonth(month: string): Term {
  const number = Number(month.slice(5, 7));
  return number >= 9 ? "Autumn" : number <= 3 ? "Winter" : "Spring";
}

export function academicMonths(year: AcademicYear) {
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(year.startYear, 8 + index, 1, 12));
    return isoDate(date).slice(0, 7);
  });
}

export function eventsInMonth(events: readonly HistoryEvent[], month: string) {
  const start = `${month}-01`;
  const [year, monthNumber] = month.split("-").map(Number);
  const end = isoDate(new Date(Date.UTC(year, monthNumber, 0, 12)));
  return events
    .filter((event) => event.date <= end && (event.endDate ?? event.date) >= start)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function eventsOnDate(events: readonly HistoryEvent[], date: string) {
  return events.filter((event) => event.date <= date && (event.endDate ?? event.date) >= date);
}

export function selectionForMonth(
  year: AcademicYear,
  events: readonly HistoryEvent[],
  month: string,
): ArchiveSelection {
  // Keep all navigation inside its academic year.
  const validMonth = academicMonths(year).includes(month)
    ? month
    : academicMonths(year)[0];
  return {
    yearId: year.id,
    month: validMonth,
    eventId: eventsInMonth(events, validMonth)[0]?.id ?? null,
  };
}

export function selectionForYear(year: AcademicYear, events: readonly HistoryEvent[]): ArchiveSelection {
  const featured = events.find((event) => event.id === year.featuredEventId);
  const selection = selectionForMonth(year, events, featured?.date.slice(0, 7) ?? academicMonths(year)[0]);
  return { ...selection, eventId: featured?.id ?? selection.eventId };
}

export function selectionForTerm(year: AcademicYear, events: readonly HistoryEvent[], term: Term) {
  const months = academicMonths(year).filter((month) => termForMonth(month) === term);
  const month = months.find((month) => eventsInMonth(events, month).length > 0) ?? months[0];
  return selectionForMonth(year, events, month);
}

export function calendarDays(month: string): CalendarDay[] {
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1, 12));
  const offset = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const cellCount = Math.ceil((offset + count) / 7) * 7;

  return Array.from({ length: cellCount }, (_, index) => {
    const date = new Date(Date.UTC(year, monthNumber - 1, 1 - offset + index, 12));
    return {
      date: isoDate(date),
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === monthNumber - 1,
    };
  });
}
