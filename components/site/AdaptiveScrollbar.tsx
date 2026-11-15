"use client";

import { useEffect, useRef } from "react";
import { getScrollbarMetrics } from "./scrollbarGeometry";
import "./AdaptiveScrollbar.css";

export function AdaptiveScrollbar() {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!track || !thumb) return;

    const root = document.documentElement;
    let frame = 0;
    let drag: { pointerId: number; offset: number } | undefined;

    function metrics() {
      return getScrollbarMetrics(root.clientHeight, root.scrollHeight, window.scrollY, track!.clientHeight);
    }

    function lightSurface(x: number, y: number) {
      // The hit area sits above the page. Look through it, not beside it: the
      // dissolve grid can have different colours just a few pixels apart.
      const target = document.elementsFromPoint(x, y).find((element) => !track!.contains(element));
      const colour = [0, 0, 0];
      let opacity = 0;

      function paint(element: Element) {
        const values = getComputedStyle(element).backgroundColor.match(/[\d.]+/g)?.map(Number);
        if (!values || values.length < 3) return;
        const alpha = (values[3] ?? 1) * (1 - opacity);
        for (let channel = 0; channel < 3; channel++) colour[channel] += values[channel] * alpha;
        opacity += alpha;
      }

      for (let element = target; element && opacity < 0.99; element = element.parentElement ?? undefined) {
        // Pointer-transparent grid cells still paint over the section surface.
        const grid = element.querySelector(":scope > .interactive-grid");
        if (grid) {
          for (const cell of grid.querySelectorAll(".block.fill")) {
            const bounds = cell.getBoundingClientRect();
            if (x >= bounds.left && x < bounds.right && y >= bounds.top && y < bounds.bottom) {
              paint(cell);
              break;
            }
          }
        }
        paint(element);
      }

      return opacity > 0.99 && colour.every((channel) => channel > 200);
    }

    function update() {
      frame = 0;
      root.setAttribute("data-adaptive-scrollbar", "");
      // Reveal before measuring: hidden elements have a zero clientHeight.
      track!.hidden = false;

      const geometry = metrics();
      track!.hidden = geometry.maxScroll <= 1;
      thumb!.style.height = `${geometry.height}px`;
      thumb!.style.transform = `translateY(${geometry.top}px)`;
      track!.setAttribute("aria-valuenow", String(Math.round(geometry.progress * 100)));
      if (track!.hidden) return;

      const bounds = track!.getBoundingClientRect();
      const x = bounds.left + track!.clientWidth / 2;
      track!.toggleAttribute("data-light-surface", lightSurface(x, bounds.top + geometry.top + geometry.height / 2));
      track!.style.setProperty("--scrollbar-top-ink", lightSurface(x, bounds.top + 2) ? "var(--utc-cobalt)" : "#ffffff");
      track!.style.setProperty("--scrollbar-bottom-ink", lightSurface(x, bounds.bottom - 2) ? "var(--utc-cobalt)" : "#ffffff");

      // A single hairline, with exact colour changes at section/grid edges.
      // No double-coloured shadow or glow: this is the rail in the reference.
      const edges = new Set([0, track!.clientHeight]);
      function addEdges(element: Element) {
        const rect = element.getBoundingClientRect();
        if (x < rect.left || x >= rect.right || rect.bottom <= bounds.top || rect.top >= bounds.bottom) return;
        for (const y of [rect.top, rect.bottom]) {
          edges.add(Math.max(0, Math.min(track!.clientHeight, y - bounds.top)));
        }
        if (element.classList.contains("interactive-grid")) {
          for (const cell of element.querySelectorAll(".block.fill")) addEdges(cell);
        }
      }
      for (const surface of document.querySelectorAll("#site-content header, #site-content main, #site-content section, #site-content footer, #site-content .interactive-grid")) {
        addEdges(surface);
      }
      const points = [...edges].sort((a, b) => a - b);
      const stops = points.slice(1).map((end, index) => {
        const start = points[index];
        const light = lightSurface(x, bounds.top + (start + end) / 2);
        const ink = light
          ? "color-mix(in srgb, var(--utc-cobalt) 60%, transparent)"
          : "rgb(255 255 255 / 0.6)";
        return `${ink} ${start}px ${end}px`;
      });
      track!.style.setProperty("--scrollbar-rail", `linear-gradient(to bottom, ${stops.join(", ")})`);
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    function scrollToPointer(clientY: number) {
      if (!drag) return;
      const geometry = metrics();
      const position = clientY - track!.getBoundingClientRect().top - drag.offset - geometry.inset;
      const progress = geometry.travel ? Math.min(1, Math.max(0, position / geometry.travel)) : 0;
      window.scrollTo({ top: progress * geometry.maxScroll, behavior: "instant" });
      schedule();
    }

    function pointerDown(event: PointerEvent) {
      if (event.button !== 0 || drag) return;
      event.preventDefault();
      const geometry = metrics();
      const thumbTop = track!.getBoundingClientRect().top + geometry.top;
      const onThumb = event.clientY >= thumbTop && event.clientY <= thumbTop + geometry.height;
      drag = { pointerId: event.pointerId, offset: onThumb ? event.clientY - thumbTop : geometry.height / 2 };
      track!.setPointerCapture(event.pointerId);
      track!.focus({ preventScroll: true });
      track!.dataset.dragging = "";
      scrollToPointer(event.clientY);
    }

    function pointerMove(event: PointerEvent) {
      if (event.pointerId === drag?.pointerId) scrollToPointer(event.clientY);
    }

    function stopDrag() {
      if (drag && track!.hasPointerCapture(drag.pointerId)) track!.releasePointerCapture(drag.pointerId);
      drag = undefined;
      delete track!.dataset.dragging;
    }

    function keyboard(event: KeyboardEvent) {
      const geometry = metrics();
      const page = root.clientHeight * 0.9;
      const positions: Record<string, number> = {
        ArrowDown: window.scrollY + 40,
        ArrowUp: window.scrollY - 40,
        PageDown: window.scrollY + page,
        PageUp: window.scrollY - page,
        Home: 0,
        End: geometry.maxScroll,
        " ": window.scrollY + (event.shiftKey ? -page : page),
      };
      if (!(event.key in positions)) return;
      event.preventDefault();
      window.scrollTo({ top: Math.min(geometry.maxScroll, Math.max(0, positions[event.key])), behavior: "instant" });
      schedule();
    }

    const resize = new ResizeObserver(schedule);
    resize.observe(root);
    resize.observe(document.body);
    // Layouts persist across navigation; refresh for the new route's content.
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });
    document.addEventListener("transitionend", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("blur", stopDrag);
    track.addEventListener("pointerdown", pointerDown);
    track.addEventListener("pointermove", pointerMove);
    track.addEventListener("pointerup", stopDrag);
    track.addEventListener("pointercancel", stopDrag);
    track.addEventListener("lostpointercapture", stopDrag);
    track.addEventListener("keydown", keyboard);
    schedule();

    return () => {
      cancelAnimationFrame(frame);
      stopDrag();
      root.removeAttribute("data-adaptive-scrollbar");
      resize.disconnect();
      mutations.disconnect();
      document.removeEventListener("transitionend", schedule);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("blur", stopDrag);
      track.removeEventListener("pointerdown", pointerDown);
      track.removeEventListener("pointermove", pointerMove);
      track.removeEventListener("pointerup", stopDrag);
      track.removeEventListener("pointercancel", stopDrag);
      track.removeEventListener("lostpointercapture", stopDrag);
      track.removeEventListener("keydown", keyboard);
    };
  }, []);

  return (
    <div
      ref={trackRef}
      className="adaptive-scrollbar"
      role="scrollbar"
      aria-label="Page scroll"
      aria-controls="site-content"
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
      tabIndex={0}
      hidden
    >
      <span className="adaptive-scrollbar-rail" aria-hidden="true" />
      <span className="adaptive-scrollbar-cap adaptive-scrollbar-cap-top" aria-hidden="true" />
      <span className="adaptive-scrollbar-cap adaptive-scrollbar-cap-bottom" aria-hidden="true" />
      <div ref={thumbRef} className="adaptive-scrollbar-thumb" aria-hidden="true">
        <span className="adaptive-scrollbar-thumb-fill" />
      </div>
    </div>
  );
}
