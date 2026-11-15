"use client";

import { useEffect, useRef } from "react";

const TEXT_TARGET =
  'textarea, input:not([type]), input[type="text"], input[type="email"], input[type="search"], input[type="tel"], input[type="url"], input[type="number"], input[type="password"], [contenteditable]:not([contenteditable="false"]), [role="textbox"]';

// Adapted from elevanta-ai's DirectionalCursor: same arrow, pivot and rotation.
export function DirectionalCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const shapeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const shape = shapeRef.current;
    if (!cursor || !shape) return;

    const pointer = window.matchMedia("(any-hover: hover) and (any-pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lastDirectionPoint: { x: number; y: number } | null = null;
    let currentAngle = 0;
    let targetAngle = 0;
    let lastFrameTime = 0;
    let rotationFrame = 0;
    let position: { x: number; y: number } | null = null;

    function stopRotation() {
      cancelAnimationFrame(rotationFrame);
      rotationFrame = 0;
      lastFrameTime = 0;
    }

    function hide() {
      stopRotation();
      cursor!.removeAttribute("data-visible");
      document.documentElement.removeAttribute("data-directional-cursor");
      lastDirectionPoint = null;
      position = null;
    }

    function updateTarget(target: EventTarget | null) {
      const visible = !(target instanceof Element && target.closest(TEXT_TARGET));
      cursor!.toggleAttribute("data-visible", visible);
      document.documentElement.toggleAttribute("data-directional-cursor", visible);
    }

    function animateRotation(time: number) {
      const elapsed = lastFrameTime ? Math.min(time - lastFrameTime, 50) : 16;
      lastFrameTime = time;
      currentAngle += (targetAngle - currentAngle) * (1 - Math.exp(-elapsed / 55));

      if (Math.abs(targetAngle - currentAngle) < 0.1) {
        currentAngle = targetAngle;
        rotationFrame = 0;
        lastFrameTime = 0;
      } else {
        rotationFrame = requestAnimationFrame(animateRotation);
      }
      shape!.style.transform = `rotate(${currentAngle}deg)`;
    }

    function move(event: PointerEvent) {
      if (!pointer.matches || (event.pointerType !== "mouse" && event.pointerType !== "pen")) {
        hide();
        return;
      }

      const { clientX: x, clientY: y } = event;
      position = { x, y };
      cursor!.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      updateTarget(event.target);

      if (lastDirectionPoint) {
        const dx = x - lastDirectionPoint.x;
        const dy = y - lastDirectionPoint.y;
        if (Math.hypot(dx, dy) >= 2) {
          const direction = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
          const shortestTurn = (((direction - currentAngle) % 360 + 540) % 360) - 180;
          targetAngle = currentAngle + shortestTurn;
          lastDirectionPoint = { x, y };
          if (reducedMotion.matches) {
            stopRotation();
            currentAngle = targetAngle;
            shape!.style.transform = `rotate(${currentAngle}deg)`;
          } else if (!rotationFrame) {
            rotationFrame = requestAnimationFrame(animateRotation);
          }
        }
      } else {
        lastDirectionPoint = { x, y };
      }
    }

    function refreshTarget() {
      if (position) updateTarget(document.elementFromPoint(position.x, position.y));
    }

    function leave(event: PointerEvent) {
      if (!event.relatedTarget) hide();
    }

    function keyboard(event: KeyboardEvent) {
      if (event.key === "Tab") hide();
    }

    pointer.addEventListener("change", hide);
    reducedMotion.addEventListener("change", hide);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", refreshTarget, { passive: true });
    window.addEventListener("pointerout", leave);
    window.addEventListener("pointercancel", hide);
    window.addEventListener("blur", hide);
    window.addEventListener("resize", refreshTarget);
    document.addEventListener("scroll", refreshTarget, { passive: true, capture: true });
    document.addEventListener("keydown", keyboard);

    return () => {
      hide();
      pointer.removeEventListener("change", hide);
      reducedMotion.removeEventListener("change", hide);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", refreshTarget);
      window.removeEventListener("pointerout", leave);
      window.removeEventListener("pointercancel", hide);
      window.removeEventListener("blur", hide);
      window.removeEventListener("resize", refreshTarget);
      document.removeEventListener("scroll", refreshTarget, true);
      document.removeEventListener("keydown", keyboard);
    };
  }, []);

  return (
    <div className="directional-cursor" ref={cursorRef} aria-hidden="true">
      <span className="directional-cursor__shape" ref={shapeRef} />
    </div>
  );
}
