"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import { HISTORY_CHAPTERS } from "./historyChapters";
import { initHistoryCardStack } from "./initHistoryCardStack";

export function HistoryCardStack() {
  const deckRef = useRef<HTMLOListElement>(null);

  useLayoutEffect(() => {
    if (deckRef.current) return initHistoryCardStack(deckRef.current);
  }, []);

  return (
    <div className="utc-history-stack">
      <div className="utc-history-stack-heading">
        <p>&gt;_ Our story / 2022–PRESENT</p>
      </div>

      <ol ref={deckRef} className="utc-history-deck" aria-label="Club history by academic year">
        {HISTORY_CHAPTERS.map((chapter, index) => (
          <li
            key={chapter.id}
            className="utc-history-card"
            data-logo-side={index % 2 === 0 ? "left" : "right"}
            data-pending={!chapter.title || undefined}
            aria-labelledby={chapter.title ? `utc-chapter-${chapter.id}` : `utc-chapter-year-${chapter.id}`}
            style={{ zIndex: HISTORY_CHAPTERS.length - index }}
          >
            <div className="utc-history-card-top">
              <p className="utc-history-year" id={`utc-chapter-year-${chapter.id}`}>{chapter.year}</p>
              <span className="utc-history-card-index">{String(index + 1).padStart(2, "0")} / {String(HISTORY_CHAPTERS.length).padStart(2, "0")}</span>
            </div>

            <div className="utc-history-card-body">
              <figure className="utc-history-logo">
                <div className="utc-history-logo-frame">
                  <Image
                    src={chapter.logo.src}
                    alt={`UOWD Tech Club logo used in ${chapter.year}`}
                    width={chapter.logo.width}
                    height={chapter.logo.height}
                    sizes="(max-width: 760px) 160px, 247px"
                  />
                </div>
              </figure>

              <div className="utc-history-card-copy">
                {chapter.title && <h2 id={`utc-chapter-${chapter.id}`}>{chapter.title}</h2>}
                {chapter.summary && <p>{chapter.summary}</p>}
                {chapter.highlights.length > 0 && <ul>
                  {chapter.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
                </ul>}
              </div>
            </div>

            {(chapter.membership || chapter.milestone) ? <div className="utc-history-card-bottom">
              <p><strong>{chapter.membership}</strong><span>{chapter.membershipNote}</span></p>
              <p className="utc-history-milestone">{chapter.milestone}</p>
            </div> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
