"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, type CSSProperties } from "react";
import { InteractiveGrid } from "@/components/InteractiveGrid";
import { RevealOnScroll } from "@/components/about/RevealOnScroll";
import { EVENTS, formatEventDate } from "@/components/events/eventData";

// Placeholder data: the same four events twice so the row overflows.
const SLIDES = [...EVENTS, ...EVENTS];

// A border can't follow clipped corners, so the button outline is drawn as an
// octagon: a square with a small 45-degree cut on each corner.
function ArrowFrame() {
  return (
    <svg className="upnext-arrow-frame" viewBox="0 0 72 72" aria-hidden>
      <polygon points="11 1.5 61 1.5 70.5 11 70.5 61 61 70.5 11 70.5 1.5 61 1.5 11" />
    </svg>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg className="relative" width="22" height="22" viewBox="0 0 22 22" aria-hidden>
      <path
        d={direction === "left" ? "M14 4 7 11l7 7" : "M8 4l7 7-7 7"}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function UpNext() {
  const trackRef = useRef<HTMLDivElement>(null);

  // Moves one card at a time and wraps around at either end.
  function step(direction: 1 | -1) {
    const track = trackRef.current!;
    const card = track.firstElementChild as HTMLElement;
    const stride = card.offsetWidth + parseFloat(getComputedStyle(track).columnGap);
    const end = track.scrollWidth - track.clientWidth;
    const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";

    if (direction === 1 && track.scrollLeft >= end - 2) {
      track.scrollTo({ left: 0, behavior });
    } else if (direction === -1 && track.scrollLeft <= 2) {
      track.scrollTo({ left: end, behavior });
    } else {
      track.scrollBy({ left: stride * direction, behavior });
    }
  }

  return (
    <section
      className="section-dark relative min-h-svh overflow-x-clip"
      aria-labelledby="upnext-heading"
    >
      <InteractiveGrid dissolveRows={5} />

      <RevealOnScroll className="upnext relative flex min-h-svh flex-col pt-36 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-6 px-10">
          <div className="upnext-head">
            <p className="hero-label">&gt;_ UPCOMING</p>
            <h2 id="upnext-heading" className="about-heading mt-6">
              Up next
              <span className="hero-underscore" aria-hidden />
            </h2>
          </div>

          <div className="upnext-controls flex gap-6">
            <button
              type="button"
              className="upnext-arrow"
              aria-label="Previous events"
              onClick={() => step(-1)}
            >
              <ArrowFrame />
              <Chevron direction="left" />
            </button>
            <button
              type="button"
              className="upnext-arrow"
              aria-label="Next events"
              onClick={() => step(1)}
            >
              <ArrowFrame />
              <Chevron direction="right" />
            </button>
          </div>
        </div>

        <div ref={trackRef} className="upnext-track mt-14">
          {SLIDES.map((event, index) => (
            <Link
              key={index}
              href={`/events/${event.slug}`}
              className="upnext-card"
              style={{ "--i": Math.min(index, 5) } as CSSProperties}
            >
              <div className="upnext-frame">
                <Image
                  src={`/images/events/${event.slug}.png`}
                  alt=""
                  fill
                  sizes="(max-width: 1100px) 16rem, 25vw"
                  className="object-cover"
                />
                <div className="upnext-overlay">
                  <p className="upnext-type">{event.type}</p>
                  <h3 className="upnext-name">{event.title}</h3>
                  <time className="upnext-date" dateTime={event.date}>
                    {formatEventDate(event.date)}
                  </time>
                </div>
              </div>

              <span className="upnext-tab" aria-hidden>
                <span className="upnext-tab-label">View</span>
                <svg width="26" height="18" viewBox="0 0 26 18">
                  <path
                    d="M0 9h22M15 2l7 7-7 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="square"
                  />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </RevealOnScroll>
    </section>
  );
}
