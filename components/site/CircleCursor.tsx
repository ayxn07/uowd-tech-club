"use client";

import { useEffect, useRef } from "react";

// Adapted from the supplied Framer Circle Cursor, without a Framer runtime.
// The original ring is 32px; this version uses 44px (see globals.css).
const INTERACTIVE = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [role="button"], [role="link"], [contenteditable="true"]';

export function CircleCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;
    let x = 0;
    let y = 0;

    function updateColour(target: Element | null) {
      const colour = [0, 0, 0];
      let opacity = 0;

      function paint(background: string) {
        const values = background.match(/[\d.]+/g)?.map(Number);
        if (!values || values.length < 3) return;
        const alpha = (values[3] ?? 1) * (1 - opacity);
        for (let channel = 0; channel < 3; channel++) colour[channel] += values[channel] * alpha;
        opacity += alpha;
      }

      for (let element = target; element && opacity < 0.99; element = element.parentElement) {
        const style = getComputedStyle(element);
        // Photos use a white cursor, not the colour of the surface behind them.
        if (element.tagName === "IMG" || style.backgroundImage.includes("url(")) {
          cursor!.removeAttribute("data-light-surface");
          return;
        }

        // Grid fills are visual backgrounds but ignore pointer events. Include
        // the cell underneath so the footer's blue arc keeps a white cursor.
        const grid = element.querySelector(":scope > .interactive-grid");
        if (grid) {
          for (const cell of grid.querySelectorAll(".block.fill")) {
            const bounds = cell.getBoundingClientRect();
            if (x >= bounds.left && x < bounds.right && y >= bounds.top && y < bounds.bottom) {
              paint(getComputedStyle(cell).backgroundColor);
              break;
            }
          }
        }
        paint(style.backgroundColor);
      }

      cursor!.toggleAttribute("data-light-surface", opacity > 0.99 && colour.every((channel) => channel > 200));
    }

    function refresh() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const target = document.elementFromPoint(x, y);
        updateColour(target);
        updateHover(target);
        cursor!.style.setProperty("--cursor-x", `${x}px`);
        cursor!.style.setProperty("--cursor-y", `${y}px`);
        cursor!.dataset.visible = "";
        document.documentElement.setAttribute("data-circle-cursor", "");
      });
    }

    function surfaceChanged() {
      if (cursor!.hasAttribute("data-visible")) refresh();
    }

    function hide() {
      cancelAnimationFrame(frame);
      frame = 0;
      delete cursor!.dataset.visible;
      delete cursor!.dataset.pressed;
      delete cursor!.dataset.hovered;
      cursor!.removeAttribute("data-light-surface");
      document.documentElement.removeAttribute("data-circle-cursor");
    }

    function updateHover(target: EventTarget | null) {
      cursor!.toggleAttribute("data-hovered", target instanceof Element && !!target.closest(INTERACTIVE));
    }

    function move(event: PointerEvent) {
      if (!pointer.matches || event.pointerType === "touch") {
        hide();
        return;
      }
      x = event.clientX;
      y = event.clientY;
      updateHover(event.target);
      refresh();
    }

    function press(event: PointerEvent) {
      if (event.pointerType === "touch") {
        hide();
        return;
      }
      if (pointer.matches && cursor!.hasAttribute("data-visible")) cursor!.dataset.pressed = "";
    }

    function release() {
      delete cursor!.dataset.pressed;
    }

    function hover(event: PointerEvent) {
      updateHover(event.target);
      surfaceChanged();
    }

    function keyboard(event: KeyboardEvent) {
      if (event.key === "Tab") hide();
    }

    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", hover, { passive: true });
    document.addEventListener("pointerdown", press, { passive: true });
    document.addEventListener("pointerleave", hide);
    document.addEventListener("pointercancel", hide);
    document.addEventListener("keydown", keyboard);
    document.addEventListener("scroll", surfaceChanged, { passive: true, capture: true });
    window.addEventListener("resize", surfaceChanged);
    window.addEventListener("pointerup", release);
    window.addEventListener("blur", hide);
    pointer.addEventListener("change", hide);

    return () => {
      hide();
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", hover);
      document.removeEventListener("pointerdown", press);
      document.removeEventListener("pointerleave", hide);
      document.removeEventListener("pointercancel", hide);
      document.removeEventListener("keydown", keyboard);
      document.removeEventListener("scroll", surfaceChanged, true);
      window.removeEventListener("resize", surfaceChanged);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("blur", hide);
      pointer.removeEventListener("change", hide);
    };
  }, []);

  return (
    <div ref={cursorRef} className="circle-cursor" aria-hidden="true">
      <span className="circle-cursor-dot" />
      <span className="circle-cursor-ring" />
    </div>
  );
}
