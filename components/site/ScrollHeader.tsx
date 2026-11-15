"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { NAVIGATION_REPLAY_EVENT, STARTUP_INTRO_FINISHED_EVENT } from "./motionEvents";
import "./HeaderOutline.css";
import "./ScrollHeader.css";

const HIDE_TRAVEL = 24;
const SHOW_TRAVEL = 12;

export function ScrollHeader({ children }: { children: ReactNode }) {
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    function scrollPosition() {
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      return { y: Math.max(0, Math.min(window.scrollY, max)), max };
    }

    let previous = scrollPosition();
    let pathname = window.location.pathname;
    let travel = 0;
    let frame = 0;

    function reveal() {
      header!.removeAttribute("data-scroll-hidden");
      previous = scrollPosition();
      pathname = window.location.pathname;
      travel = 0;
    }

    function update() {
      frame = 0;
      const position = scrollPosition();
      const { y } = position;
      const delta = y - previous.y;
      const layoutChanged = Math.abs(position.max - previous.max) > 1;
      previous = position;

      // Clicking a navbar link must not pin it open for the entire next page.
      // Only keyboard-visible focus keeps navigation on screen while scrolling.
      if (y <= header!.offsetHeight || header!.querySelector(":focus-visible") || window.location.pathname !== pathname) {
        reveal();
        return;
      }
      // Pin spacers, font loading and viewport changes alter the document's
      // scroll range. Rebase rather than interpreting these as user intent.
      if (layoutChanged) {
        travel = 0;
        return;
      }
      if (!delta) return;

      // Accumulate small movements, resetting on a direction change to avoid jitter.
      travel = delta > 0 ? Math.max(0, travel) + delta : Math.min(0, travel) + delta;
      if (travel >= HIDE_TRAVEL || travel <= -SHOW_TRAVEL) {
        header!.toggleAttribute("data-scroll-hidden", travel > 0);
        travel = 0;
      }
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", reveal);
    window.addEventListener(NAVIGATION_REPLAY_EVENT, reveal);
    window.addEventListener(STARTUP_INTRO_FINISHED_EVENT, reveal);
    header.addEventListener("focusin", reveal);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", reveal);
      window.removeEventListener(NAVIGATION_REPLAY_EVENT, reveal);
      window.removeEventListener(STARTUP_INTRO_FINISHED_EVENT, reveal);
      header.removeEventListener("focusin", reveal);
      header.removeAttribute("data-scroll-hidden");
    };
  }, []);

  return (
    <header ref={headerRef} className="site-header -mb-5 flex h-20 items-center justify-between bg-white px-8">
      {children}
    </header>
  );
}
