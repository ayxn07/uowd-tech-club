"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { NAVIGATION_REPLAY_EVENT, STARTUP_INTRO_FINISHED_EVENT } from "../site/motionEvents";
import "./RevealOnScroll.css";

// Marks its children as revealed once their top passes the middle of the
// viewport, which is when the grid dissolve above them has finished. Content
// is only hidden after hydration, so it stays visible without JS.
export function RevealOnScroll({
  className,
  children,
  replayOnNavigation,
}: {
  className?: string;
  children: ReactNode;
  replayOnNavigation?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    let frame = 0;
    let inView = false;

    function ready() {
      return inView && element!.dataset.reveal === "pending"
        && !document.querySelector<HTMLElement>(".site-shell")?.inert
        && !document.querySelector(".startup-intro[data-playing]");
    }

    function reveal() {
      if (frame || !ready()) return;
      // Paint the reset state first. Otherwise cached pages can jump straight
      // back to their finished highlight instead of replaying the sweep.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          frame = 0;
          if (!ready()) return;
          delete element!.dataset.revealReset;
          element!.dataset.reveal = "shown";
        });
      });
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        reveal();
      },
      { rootMargin: "0px 0px -50% 0px" },
    );

    function reset() {
      cancelAnimationFrame(frame);
      frame = 0;
      inView = false;
      element!.dataset.revealReset = "";
      element!.dataset.reveal = "pending";
      observer.unobserve(element!);
      observer.observe(element!);
    }

    function navigation(event: Event) {
      if (replayOnNavigation && (event as CustomEvent<{ href: string }>).detail?.href === replayOnNavigation) reset();
    }

    reset();
    window.addEventListener(NAVIGATION_REPLAY_EVENT, navigation);
    window.addEventListener(STARTUP_INTRO_FINISHED_EVENT, reveal);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener(NAVIGATION_REPLAY_EVENT, navigation);
      window.removeEventListener(STARTUP_INTRO_FINISHED_EVENT, reveal);
      delete element.dataset.revealReset;
      delete element.dataset.reveal;
    };
  }, [replayOnNavigation]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
