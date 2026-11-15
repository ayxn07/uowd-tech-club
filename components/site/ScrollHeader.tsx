"use client";

import { useEffect, useRef, type ReactNode } from "react";
import "./HeaderOutline.css";

export function ScrollHeader({ children }: { children: ReactNode }) {
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    function scrollY() {
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      return Math.max(0, Math.min(window.scrollY, max));
    }

    let previousY = scrollY();
    let travel = 0;
    let frame = 0;

    function reveal() {
      header!.removeAttribute("data-scroll-hidden");
      previousY = scrollY();
      travel = 0;
    }

    function update() {
      frame = 0;
      const y = scrollY();
      const delta = y - previousY;
      previousY = y;

      // Keep the header visible near the top and while using its links by keyboard.
      if (y <= header!.offsetHeight || header!.contains(document.activeElement)) {
        reveal();
        return;
      }
      if (!delta) return;

      // Accumulate small movements, resetting on a direction change to avoid jitter.
      travel = delta > 0 ? Math.max(0, travel) + delta : Math.min(0, travel) + delta;
      if (travel >= 12 || travel <= -8) {
        header!.toggleAttribute("data-scroll-hidden", travel > 0);
      }
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    header.addEventListener("focusin", reveal);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
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
