"use client";

import Image from "next/image";
import { useState } from "react";
import { HISTORY_EVENTS, HISTORY_YEARS } from "./clubHistory";
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
} from "./archiveCalendar";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// AI-generated category illustrations, not photographs of the archived events.
const PORTRAIT_IMAGES: Record<string, string> = {
  AI: "/images/about/archive/utc-archive-ai-portrait.webp",
  Programming: "/images/about/archive/utc-archive-programming-portrait.webp",
  Engineering: "/images/about/archive/utc-archive-engineering-portrait.webp",
  Cybersecurity: "/images/about/archive/utc-archive-cybersecurity-portrait.webp",
  Design: "/images/about/archive/utc-archive-design-portrait.webp",
  Industry: "/images/about/archive/utc-archive-industry-portrait.webp",
  Community: "/images/about/archive/utc-archive-community-portrait.webp",
  Milestone: "/images/about/archive/utc-archive-community-portrait.webp",
};

function ViewIcon({ list = false }: { list?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      {list ? (
        <path d="M1 3h2m3 0h9M1 8h2m3 0h9M1 13h2m3 0h9" stroke="currentColor" strokeWidth="1.5" />
      ) : (
        <path d="M1 1h5v5H1zM10 1h5v5h-5zM1 10h5v5H1zM10 10h5v5h-5z" stroke="currentColor" />
      )}
    </svg>
  );
}

export function HistoryCalendar() {
  const [selection, setSelection] = useState(() => selectionForYear(HISTORY_YEARS[2], HISTORY_EVENTS));
  const [view, setView] = useState<"grid" | "list">("grid");
  const year = HISTORY_YEARS.find((year) => year.id === selection.yearId)!;
  const months = academicMonths(year);
  const monthIndex = months.indexOf(selection.month);
  const monthEvents = eventsInMonth(HISTORY_EVENTS, selection.month);
  const selectedEvent = monthEvents.find((event) => event.id === selection.eventId);
  const sameDayEvents = selectedEvent ? eventsOnDate(monthEvents, selectedEvent.date) : [];
  const usePortrait = sameDayEvents.length === 1;
  const imageSrc = usePortrait && selectedEvent
    ? PORTRAIT_IMAGES[selectedEvent.category] ?? PORTRAIT_IMAGES.Community
    : "/images/hero/utc-hero-hackathon.png";
  const term = termForMonth(selection.month);
  const days = calendarDays(selection.month);
  const weeks = Array.from({ length: days.length / 7 }, (_, index) => days.slice(index * 7, index * 7 + 7));

  function moveMonth(direction: number) {
    const month = months[monthIndex + direction];
    if (month) setSelection(selectionForMonth(year, HISTORY_EVENTS, month));
  }

  function selectEvent(id: string) {
    setSelection((current) => ({ ...current, eventId: id }));
  }

  return (
    <div className="utc-archive">
      <div className="utc-archive-controls">
        <fieldset className="utc-archive-control-group utc-archive-years">
          <legend>Academic year</legend>
          <div className="utc-archive-options">
            {HISTORY_YEARS.map((option) => (
              <button
                type="button"
                key={option.id}
                aria-pressed={year.id === option.id}
                onClick={() => setSelection(selectionForYear(option, HISTORY_EVENTS))}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="utc-archive-control-group">
          <legend>Term</legend>
          <div className="utc-archive-options">
            {TERMS.map((option) => (
              <button
                type="button"
                key={option}
                aria-pressed={term === option}
                onClick={() => setSelection(selectionForTerm(year, HISTORY_EVENTS, option))}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="utc-archive-control-group utc-archive-view">
          <legend>View</legend>
          <div className="utc-archive-options">
            <button type="button" aria-pressed={view === "grid"} onClick={() => setView("grid")}>
              <ViewIcon /> Grid
            </button>
            <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}>
              <ViewIcon list /> List
            </button>
          </div>
        </fieldset>
      </div>

      <div className="utc-archive-layout">
        <div className="utc-archive-calendar">
          <div className="utc-archive-month-nav">
            <div className="utc-archive-month-title">
              <p className="utc-archive-kicker">{term} / Event archive</p>
              <h3 id="utc-archive-month" aria-live="polite">{formatMonth(selection.month)}</h3>
            </div>
            <div className="utc-archive-month-controls">
              <label className="utc-archive-month-select">
                Jump to month
                <select value={selection.month} onChange={(event) => setSelection(selectionForMonth(year, HISTORY_EVENTS, event.target.value))}>
                  {months.map((month) => <option value={month} key={month}>{formatMonth(month)}</option>)}
                </select>
              </label>
              <div className="utc-archive-month-buttons">
                <button type="button" aria-label="Previous month" disabled={monthIndex === 0} onClick={() => moveMonth(-1)}>←</button>
                <button type="button" aria-label="Next month" disabled={monthIndex === months.length - 1} onClick={() => moveMonth(1)}>→</button>
              </div>
            </div>
          </div>

          {view === "grid" ? (
            <div className="utc-archive-table-wrap">
              <table className="utc-archive-table" aria-labelledby="utc-archive-month">
                <thead>
                  <tr>{WEEKDAYS.map((day) => <th scope="col" key={day}>{day}</th>)}</tr>
                </thead>
                <tbody>
                  {weeks.map((week) => (
                    <tr key={week[0].date}>
                      {week.map((day) => {
                        const events = day.inMonth ? eventsOnDate(monthEvents, day.date) : [];
                        const selected = events.some((event) => event.id === selection.eventId);
                        return (
                          <td key={day.date} data-outside={!day.inMonth || undefined} data-selected={selected || undefined}>
                            {events.length ? (
                              <button
                                type="button"
                                className="utc-archive-day"
                                aria-label={`${formatEventDate({ date: day.date })}: ${events.map((event) => event.title).join(", ")}`}
                                aria-pressed={selected}
                                aria-controls="utc-archive-event"
                                onClick={() => selectEvent(events[0].id)}
                              >
                                <time dateTime={day.date}>{day.day}</time>
                                <span className="utc-archive-day-events">
                                  {events.slice(0, 2).map((event) => <span className="utc-archive-event-chip" key={event.id}>{event.title}</span>)}
                                  {events.length > 2 && <span>+{events.length - 2} more</span>}
                                </span>
                                <span className="utc-archive-day-dot" aria-hidden />
                              </button>
                            ) : (
                              <span className="utc-archive-empty-day"><time dateTime={day.date}>{day.day}</time></span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="utc-archive-list-view">
              <ul aria-label={`Events in ${formatMonth(selection.month)}`}>
                {monthEvents.map((event) => (
                  <li key={event.id}>
                    <button type="button" aria-pressed={event.id === selection.eventId} aria-controls="utc-archive-event" onClick={() => selectEvent(event.id)}>
                      <time dateTime={event.date}>{formatEventDate(event)}</time>
                      <strong>{event.title}</strong>
                      <span>{event.category} <span aria-hidden>↗</span></span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

        <aside id="utc-archive-event" className="utc-archive-event-panel" data-single-event={usePortrait || undefined} aria-labelledby="utc-archive-event-title">
          <div aria-live="polite" aria-atomic="true">
            <div className="utc-archive-event-header">
              <p className="utc-archive-event-date">{selectedEvent ? formatEventDate(selectedEvent) : formatMonth(selection.month)}</p>
              {selectedEvent && (
                <div className="utc-archive-event-tags">
                  <span>{selectedEvent.category}</span>
                  {selectedEvent.location && <span>{selectedEvent.location}</span>}
                </div>
              )}
            </div>
            <h3 id="utc-archive-event-title">{selectedEvent?.title ?? "A quieter chapter."}</h3>
            <p className="utc-archive-event-description">
              {selectedEvent?.description ?? "Not every month has a recorded event. There’s more of our story to explore in the calendar."}
            </p>
          </div>

          {sameDayEvents.length > 1 && (
            <fieldset className="utc-archive-same-day">
              <legend>Also on this date</legend>
              {sameDayEvents.map((event) => (
                <button type="button" key={event.id} aria-pressed={event.id === selection.eventId} onClick={() => selectEvent(event.id)}>{event.title}</button>
              ))}
            </fieldset>
          )}

          <figure className="utc-archive-community-image" data-portrait={usePortrait || undefined}>
            <Image
              src={imageSrc}
              alt=""
              {...(usePortrait ? { fill: true } : { width: 1672, height: 941 })}
              sizes="(max-width: 600px) 85vw, (max-width: 1050px) 40vw, 28vw"
            />
          </figure>
        </aside>
      </div>
    </div>
  );
}
