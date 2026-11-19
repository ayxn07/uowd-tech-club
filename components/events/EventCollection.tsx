"use client";

import { useState } from "react";
import { EventCard } from "./EventCard";
import { EVENTS, findEvents } from "./eventData";

const TOPICS = ["All", "Development", "AI & ML"] as const;

export function EventCollection() {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<string>("All");
  const events = findEvents(query, topic);

  function reset() {
    setQuery("");
    setTopic("All");
  }

  return (
    <section className="utc-events-browse" id="lineup" aria-labelledby="utc-events-lineup-title">
      <div className="utc-events-section-heading">
        <div>
          <p className="utc-events-eyebrow">&gt;_ FIND YOUR NEXT THING</p>
          <h2 id="utc-events-lineup-title">The lineup<span className="hero-underscore" aria-hidden="true" /></h2>
        </div>
        <p>Pick a topic. Bring your curiosity.</p>
      </div>

      <div className="utc-events-toolbar">
        <div className="utc-events-filters" role="group" aria-label="Filter events by topic">
          {TOPICS.map((item) => (
            <button key={item} type="button" aria-pressed={topic === item} onClick={() => setTopic(item)}>
              {item === "All" ? "All events" : item}
              <span>{String(item === "All" ? EVENTS.length : EVENTS.filter((event) => event.topic === item).length).padStart(2, "0")}</span>
            </button>
          ))}
        </div>
        <div className="utc-events-search">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.7" /><path d="m16 16 5 5" stroke="currentColor" strokeWidth="1.7" /></svg>
          <label htmlFor="utc-events-search" className="sr-only">Search events</label>
          <input id="utc-events-search" type="search" placeholder="Search the lineup..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
      </div>

      <div className="utc-events-results">
        <p role="status">{events.length} {events.length === 1 ? "event" : "events"}{topic !== "All" ? ` in ${topic}` : " in the lineup"}{query.trim() ? ` matching “${query.trim()}”` : ""}</p>
        {(query || topic !== "All") && <button type="button" onClick={reset}>Clear filters <span aria-hidden="true">×</span></button>}
      </div>

      {events.length ? (
        <ul className="utc-events-cards">
          {events.map((event) => <EventCard key={event.slug} event={event} index={EVENTS.indexOf(event)} />)}
        </ul>
      ) : (
        <div className="utc-events-empty">
          <span className="utc-events-empty-symbol" aria-hidden="true">&gt;_</span>
          <h3>No events found.</h3>
          <p>Try another keyword or explore the full lineup.</p>
          <button type="button" className="utc-events-button" onClick={reset}>Show all events</button>
        </div>
      )}
    </section>
  );
}
