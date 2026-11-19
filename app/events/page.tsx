import type { Metadata } from "next";
/* import Image from "next/image";
import Link from "next/link";
import { EventCollection } from "@/components/events/EventCollection";
import { EventArrow } from "@/components/events/EventCard";
import { EVENTS, formatEventDate } from "@/components/events/eventData"; */
import { InteractiveGrid } from "@/components/InteractiveGrid";

export const metadata: Metadata = {
  title: "Events | UOWD Tech Club",
  description: "Explore UOWD Tech Club workshops. Find your next session in development, AI and machine learning.",
};

export default function EventsPage() {
  // const featured = EVENTS[0];

  return (
    <main className="utc-events-page">
      <InteractiveGrid />
      {/* <div className="utc-events-container">
        <header className="utc-events-intro">
          <div>
            <p className="utc-events-eyebrow">&gt;_ THE CLUB CALENDAR / EVENTS</p>
            <h1>Show up.<br />Build something<span className="hero-underscore" aria-hidden="true" /></h1>
          </div>
          <div className="utc-events-intro-note">
            <p>New skills. Shared ideas. Something you can actually build. Find your next session with UOWD Tech Club.</p>
            <a href="#lineup" className="utc-events-text-link">Explore the lineup <span aria-hidden="true">↓</span></a>
          </div>
        </header>

        <section className="utc-events-feature" aria-labelledby="utc-events-feature-title">
          <div className="utc-events-feature-art">
            <Image src={`/images/events/${featured.slug}.png`} alt="Vibe Coding workshop poster with a laptop illustration" fill sizes="(max-width: 700px) 90vw, 38vw" priority />
          </div>
          <div className="utc-events-feature-copy">
            <div className="utc-events-feature-topline">
              <span className="utc-events-feature-label"><span aria-hidden="true" />In the spotlight</span>
              <span className="utc-events-feature-index" aria-hidden="true">01 / {String(EVENTS.length).padStart(2, "0")}</span>
            </div>
            <div>
              <p className="utc-events-eyebrow">{featured.type} / {featured.topic}</p>
              <h2 id="utc-events-feature-title">{featured.title}</h2>
              <p className="utc-events-feature-summary">{featured.summary}</p>
            </div>
            <div className="utc-events-feature-bottom">
              <div className="utc-events-feature-date"><span>Save the date</span><time dateTime={featured.date}>{formatEventDate(featured.date)}</time></div>
              <Link href={`/events/${featured.slug}`} className="utc-events-button">Explore event <EventArrow /></Link>
            </div>
          </div>
        </section>

        <EventCollection />

        <aside className="utc-events-archive">
          <div>
            <p className="utc-events-eyebrow">&gt;_ PREVIOUSLY AT UTC</p>
            <h2>Every event adds to the story.</h2>
            <p>Explore the workshops, challenges and moments that brought us here.</p>
          </div>
          <Link href="/about#club-history" className="utc-events-button utc-events-button-outline">Explore the archive <EventArrow /></Link>
        </aside>
      </div> */}
    </main>
  );
}
