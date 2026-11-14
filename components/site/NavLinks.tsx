"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { UtcChevron } from "@/components/brand/UtcMark";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/teams", label: "Teams" },
  { href: "/events", label: "Events" },
  { href: "/timeline", label: "Timeline" },
  { href: "/news", label: "News" },
  { href: "/gallery", label: "Gallery" },
];

// Space between the chevron and the link text, in px.
const ARROW_GAP = 6;
// Space between the bottom of the link text and the underscore, in px.
const LINE_GAP = 4;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CurrentNavLinks() {
  const pathname = usePathname();
  const active = LINKS.find((link) => isActive(pathname, link.href));
  return <NavLinks activeHref={active?.href ?? null} />;
}

export function NavLinks({ activeHref }: { activeHref: string | null }) {
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);

  // The >_ pointer follows the hovered link and falls back to the current page.
  const targetHref = hoveredHref ?? activeHref;

  useEffect(() => {
    const list = listRef.current;
    const arrow = arrowRef.current;
    const line = lineRef.current;
    if (!list || !arrow || !line) return;

    function place() {
      const link = targetHref
        ? list!.querySelector<HTMLElement>(`[data-href="${targetHref}"]`)
        : null;

      if (!link) {
        arrow!.style.opacity = "0";
        line!.style.opacity = "0";
        return;
      }

      const arrowLeft = link.offsetLeft - ARROW_GAP - arrow!.offsetWidth;
      const lineTop = link.offsetTop + link.offsetHeight + LINE_GAP;

      arrow!.style.opacity = "1";
      arrow!.style.transform = `translate(${arrowLeft}px, -50%)`;
      line!.style.opacity = "1";
      line!.style.transform = `translate(${link.offsetLeft}px, ${lineTop}px)`;
      line!.style.width = `${link.getBoundingClientRect().width}px`;

      // Enable the slide only after the first placement, so the pointer does
      // not fly in from the left edge on load.
      if (!("ready" in list!.dataset)) {
        requestAnimationFrame(() => {
          list!.dataset.ready = "";
        });
      }
    }

    place();

    // Re-measure when any link changes size, which includes the web font
    // replacing the fallback after the first placement.
    const observer = new ResizeObserver(place);
    for (const link of list.querySelectorAll("[data-href]")) {
      observer.observe(link);
    }
    document.fonts.ready.then(place);

    return () => observer.disconnect();
  }, [targetHref]);

  return (
    <ul
      ref={listRef}
      className="nav-list relative flex items-center gap-11"
      onMouseLeave={() => setHoveredHref(null)}
    >
      <span ref={arrowRef} className="nav-arrow" aria-hidden>
        <UtcChevron className="h-[0.8em] w-auto" />
      </span>
      <span ref={lineRef} className="nav-line" aria-hidden />
      {LINKS.map(({ href, label }) => {
        const current = href === activeHref;
        return (
          <li key={href}>
            <Link
              href={href}
              data-href={href}
              data-pointed={href === targetHref ? "" : undefined}
              aria-current={current ? "page" : undefined}
              onMouseEnter={() => setHoveredHref(href)}
              onFocus={() => setHoveredHref(href)}
              onBlur={() => setHoveredHref(null)}
              className="nav-link"
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
