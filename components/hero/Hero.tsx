"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { InteractiveGrid } from "@/components/InteractiveGrid";
import { HERO_CONTENT, HERO_ROTATION_MS } from "./heroContent";
import "./Hero.css";

export function Hero() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((index) => (index + 1) % HERO_CONTENT.length);
    }, HERO_ROTATION_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="utc-workspace-hero" aria-label="UOWD Tech Club highlights">
      <InteractiveGrid />
      <div className="utc-workspace-layout">
        {/* Retain the layers so outgoing and incoming content can crossfade
            without remounting the window or moving the surrounding layout. */}
        <div className="utc-workspace-copy" aria-live="off">
          <p className="utc-workspace-label">
            {HERO_CONTENT.map((content, index) => (
              <span className="utc-workspace-fade" key={content.label} data-active={index === active || undefined} aria-hidden={index !== active}>
                &gt;_ {content.label}
              </span>
            ))}
          </p>
          <h1 className="utc-workspace-heading">
            {HERO_CONTENT.map((content, index) => (
              <span className="utc-workspace-fade" key={content.label} data-active={index === active || undefined} aria-hidden={index !== active}>
                {content.lines.map((line, lineIndex) => (
                  <span className="utc-workspace-heading-line" key={lineIndex}>
                    {line}
                    {lineIndex < content.lines.length - 1 ? " " : null}
                    {lineIndex === content.lines.length - 1 && (
                      <span className="hero-underscore" aria-hidden />
                    )}
                  </span>
                ))}
              </span>
            ))}
          </h1>
          <div className="utc-workspace-details">
            <p className="utc-workspace-description">
              {HERO_CONTENT.map((content, index) => (
                <span className="utc-workspace-fade" key={content.label} data-active={index === active || undefined} aria-hidden={index !== active}>
                  {content.body}
                </span>
              ))}
            </p>
            <div className="utc-workspace-progress" aria-hidden>
              <div
                key={active}
                className="utc-workspace-progress-fill"
                style={{ animationDuration: `${HERO_ROTATION_MS}ms` }}
              />
            </div>
          </div>
        </div>

        <div className="utc-workspace-visual">
          <div className="utc-workspace-offset-frame" aria-hidden />
          <svg className="utc-workspace-crosshair utc-workspace-crosshair-top" viewBox="0 0 40 40" aria-hidden>
            <path d="M20 0v40M0 20h40" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>

          <div className="utc-workspace-window">
            <div className="utc-workspace-titlebar" aria-hidden>
              <span className="utc-workspace-window-dots"><i /><i /><i /></span>
              <span>community.live</span>
            </div>
            <div className="utc-workspace-photo-frame">
              {HERO_CONTENT.map((content, index) => <Image
                key={content.photo.src}
                src={content.photo.src}
                alt={index === active ? content.photo.alt : ""}
                aria-hidden={index !== active}
                data-active={index === active || undefined}
                width={content.photo.width}
                height={content.photo.height}
                sizes="(max-width: 900px) 92vw, 52vw"
                loading="eager"
                fetchPriority={index === 0 ? "high" : "low"}
                className="utc-workspace-image"
                style={{ objectPosition: content.photo.position }}
              />)}
            </div>
          </div>

          <pre className="utc-workspace-code-note" aria-hidden>{"const idea = yours;\nconst team = us;\nbuild(idea, team);"}</pre>
          <svg className="utc-workspace-cursor" viewBox="0 0 48 56" aria-hidden>
            <path d="m5 4 34 27-16 2 9 16-8 4-9-17-10 12Z" fill="var(--utc-cobalt)" stroke="currentColor" strokeWidth="2.5" />
          </svg>
          <svg className="utc-workspace-crosshair utc-workspace-crosshair-bottom" viewBox="0 0 40 40" aria-hidden>
            <path d="M20 0v40M0 20h40" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </section>
  );
}
