import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InteractiveGrid } from "@/components/InteractiveGrid";
import { EventArrow } from "@/components/events/EventCard";
import { EVENTS, formatEventDate } from "@/components/events/eventData";

export function generateStaticParams() {
  return EVENTS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/events/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = EVENTS.find((item) => item.slug === slug);
  if (!event) notFound();
  return { title: `${event.title} | UOWD Tech Club`, description: event.summary };
}

export default async function EventPage({ params }: PageProps<"/events/[slug]">) {
  const { slug } = await params;
  const event = EVENTS.find((item) => item.slug === slug);
  if (!event) notFound();
  const nextEvent = EVENTS[(EVENTS.indexOf(event) + 1) % EVENTS.length];

  return (
    <main className="utc-events-page">
      <InteractiveGrid />
      <div className="utc-events-container utc-event-detail-container">
        <Link href="/events#lineup" className="utc-events-text-link utc-event-back"><EventArrow back /> All events</Link>
        <article className="utc-event-detail">
          <div className="utc-event-detail-poster">
            <Image src={`/images/events/${event.slug}.png`} alt={`${event.title} workshop poster`} width={1122} height={1402} sizes="(max-width: 800px) 90vw, 40vw" priority />
          </div>
          <div className="utc-event-detail-copy">
            <p className="utc-events-eyebrow">&gt;_ {event.type} / {event.topic}</p>
            <h1>{event.title}<span className="hero-underscore" aria-hidden="true" /></h1>
            <p className="utc-event-detail-lead">{event.summary}</p>
            <dl className="utc-event-facts">
              <div><dt>Date</dt><dd><time dateTime={event.date}>{formatEventDate(event.date)}</time></dd></div>
              <div><dt>Time</dt><dd>To be announced</dd></div>
              <div><dt>Location</dt><dd>To be announced</dd></div>
              <div><dt>Topic</dt><dd>{event.topic}</dd></div>
            </dl>
            <section className="utc-event-about" aria-labelledby="utc-event-about-heading">
              <h2 id="utc-event-about-heading">About this session</h2>
              <p>{event.description}</p>
            </section>
            <div className="utc-event-registration">
              <p className="utc-events-eyebrow">REGISTRATION</p>
              <h2>Details coming soon.</h2>
              <p>The booking link and full session details will appear here once confirmed.</p>
            </div>
          </div>
        </article>
        <Link href={`/events/${nextEvent.slug}`} className="utc-event-next">
          <span><span className="utc-events-eyebrow">EXPLORE ANOTHER SESSION</span><strong>{nextEvent.title}</strong></span>
          <EventArrow />
        </Link>
      </div>
    </main>
  );
}
