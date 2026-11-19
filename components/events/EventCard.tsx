import Image from "next/image";
import Link from "next/link";
import { formatEventDate, type ClubEvent } from "./eventData";

export function EventArrow({ back = false }: { back?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={back ? "M20 12H4m7 7-7-7 7-7" : "M4 12h16m-7-7 7 7-7 7"} stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function EventCard({ event, index }: { event: ClubEvent; index: number }) {
  return (
    <li>
      <Link href={`/events/${event.slug}`} className="utc-event-card">
        <div className="utc-event-card-poster">
          <Image src={`/images/events/${event.slug}.png`} alt="" fill sizes="(max-width: 600px) 92vw, (max-width: 1100px) 44vw, 23vw" />
          <span className="utc-event-card-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          <span className="utc-event-card-open" aria-hidden="true"><EventArrow /></span>
        </div>
        <div className="utc-event-card-copy">
          <div className="utc-event-card-meta">
            <time dateTime={event.date}>{formatEventDate(event.date)}</time>
            <span>{event.type}</span>
          </div>
          <h3>{event.title}</h3>
          <p>{event.summary}</p>
          <span className="utc-event-card-link">Explore event <EventArrow /></span>
        </div>
      </Link>
    </li>
  );
}
