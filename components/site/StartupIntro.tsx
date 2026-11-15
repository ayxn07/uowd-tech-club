"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { UtcMark } from "@/components/brand/UtcMark";

const HOLD_MS = 1450;
const DOCK_MS = 1100;
const INTRO_PLAYED_KEY = "utc-startup-intro-played";
let introPlayed = false;

const subscribe = () => () => {};

function hasIntroPlayed() {
  try {
    return introPlayed || window.sessionStorage.getItem(INTRO_PLAYED_KEY) === "true";
  } catch {
    return introPlayed;
  }
}

export function StartupIntro() {
  // Check tab storage only after hydration, without rendering a flash of the
  // overlay or hiding the navbar logo during subsequent document loads.
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  return hydrated ? <StartupAnimation /> : null;
}

// Reuse the same vector mark as the header, so the last animation frame and
// the real navbar logo have exactly the same shape, size, and position.
function StartupAnimation() {
  const [complete, setComplete] = useState(hasIntroPlayed);
  const rootRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const finish = useCallback(() => setComplete(true), []);

  useEffect(() => {
    if (complete) return;

    const root = rootRef.current;
    const mark = markRef.current;
    const target = document.querySelector<SVGSVGElement>("[data-intro-target] svg");
    const shell = document.querySelector<HTMLElement>(".site-shell");
    if (!root || !mark || !target || !shell) return;

    // Persist across remounts and full document navigation in the same tab.
    introPlayed = true;
    try {
      window.sessionStorage.setItem(INTRO_PLAYED_KEY, "true");
    } catch {
      // The in-memory guard still works when browser storage is unavailable.
    }

    root.dataset.playing = "";
    const wasInert = shell.inert;
    shell.inert = true;
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations: Animation[] = [];

    const dismiss = finish;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    const onMotionChange = () => {
      if (motionPreference.matches) dismiss();
    };

    // Also release the page if an animation fails or the tab is backgrounded.
    const timeout = window.setTimeout(dismiss, 6000);
    const frame = requestAnimationFrame(() => {
      if (motionPreference.matches) {
        dismiss();
        return;
      }

      try {
        const from = mark.getBoundingClientRect();
        const to = target.getBoundingClientRect();
        if (!from.width || !to.width) {
          dismiss();
          return;
        }

        const x = to.left + to.width / 2 - (from.left + from.width / 2);
        const y = to.top + to.height / 2 - (from.top + from.height / 2);
        const scale = to.width / from.width;
        const destination = `translate(${x}px, ${y}px) scale(${scale})`;
        const docking = mark.animate(
          [
            { transform: "translate(0, 0) scale(1)", color: "#ffffff" },
            { transform: destination, color: getComputedStyle(target).color },
          ],
          {
            delay: HOLD_MS,
            duration: DOCK_MS,
            easing: "cubic-bezier(0.76, 0, 0.24, 1)",
            fill: "forwards",
          },
        );
        animations.push(docking);

        const backdrop = root.querySelector<HTMLElement>(".startup-backdrop");
        if (backdrop) {
          animations.push(backdrop.animate(
            [{ opacity: 1 }, { opacity: 0 }],
            { delay: HOLD_MS, duration: DOCK_MS * 0.8, fill: "forwards" },
          ));
        }
        for (const detail of root.querySelectorAll<HTMLElement>("[data-intro-detail]")) {
          animations.push(detail.animate(
            [{ opacity: 1 }, { opacity: 0 }],
            { delay: HOLD_MS - 200, duration: 200, fill: "forwards" },
          ));
        }

        docking.finished.then(dismiss).catch(() => {
          // Cancellation is expected when skipping or unmounting.
        });
      } catch {
        dismiss();
      }
    });

    window.addEventListener("keydown", onKeyDown);
    // A resized viewport changes the docking coordinates; reveal the real logo.
    window.addEventListener("resize", dismiss);
    motionPreference.addEventListener("change", onMotionChange);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      animations.forEach((animation) => animation.cancel());
      delete root.dataset.playing;
      shell.inert = wasInert;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", dismiss);
      motionPreference.removeEventListener("change", onMotionChange);
    };
  }, [complete, finish]);

  if (complete) return null;

  return (
    <div ref={rootRef} className="startup-intro">
      <div className="startup-backdrop" aria-hidden />
      <div className="startup-frame" data-intro-detail aria-hidden />

      <div className="startup-center">
        <div ref={markRef} className="startup-mark" aria-hidden>
          <UtcMark className="startup-mark-svg" />
        </div>
        <p className="startup-wordmark" data-intro-detail>UOWD TECH CLUB</p>
      </div>

      <div className="startup-status" data-intro-detail aria-hidden>
        <span>&gt;_ READY TO BUILD</span>
        <div className="startup-progress" />
      </div>
    </div>
  );
}
