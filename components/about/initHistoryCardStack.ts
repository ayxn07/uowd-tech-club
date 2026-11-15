import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { historyCardPose, STACK_SCROLL_PER_CARD } from "./historyStackMotion";

// Retains the supplied stack's pinning, rising cards and outgoing 3D tilt.
// Like the supplied component, only reduced motion opts out of the stack.
export function initHistoryCardStack(deck: HTMLOListElement) {
  gsap.registerPlugin(ScrollTrigger);
  const cards = Array.from(deck.querySelectorAll<HTMLElement>(".utc-history-card"));
  if (!cards.length) return () => {};

  let live = true;
  let refreshFrame = 0;
  const media = gsap.matchMedia();

  function scheduleRefresh() {
    if (!live || refreshFrame) return;
    refreshFrame = requestAnimationFrame(() => {
      refreshFrame = 0;
      if (live) ScrollTrigger.refresh();
    });
  }

  media.add(
    {
      reduce: "(prefers-reduced-motion: reduce)",
      animate: "(prefers-reduced-motion: no-preference)",
    },
    (context) => {
      if (context.conditions?.reduce) return;

      // Keep a shared card size, including copy overflowing its viewport-sized
      // frame. Height and screen size must never disable the scroll stack.
      function measureCards() {
        deck.style.removeProperty("--history-card-height");
        const height = Math.max(...cards.map((card) => Math.max(card.offsetHeight, card.scrollHeight)));
        deck.style.setProperty("--history-card-height", `${height}px`);
      }

      measureCards();
      deck.setAttribute("data-animated", "");
      cards.forEach((card, index) => gsap.set(card, historyCardPose(0, index, cards.length)));

      ScrollTrigger.create({
        trigger: deck,
        start: "top top",
        end: () => `+=${window.innerHeight * cards.length * STACK_SCROLL_PER_CARD}`,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefreshInit: measureCards,
        onUpdate: ({ progress }) => {
          cards.forEach((card, index) => gsap.set(card, historyCardPose(progress, index, cards.length)));
        },
      });
      scheduleRefresh();

      return () => {
        cancelAnimationFrame(refreshFrame);
        refreshFrame = 0;
        deck.removeAttribute("data-animated");
        deck.style.removeProperty("--history-card-height");
      };
    },
    deck,
  );

  // next/font can complete after the first measurement. Don't refresh a route
  // that has already unmounted, including during a Strict Mode remount.
  document.fonts.ready.then(scheduleRefresh);

  return () => {
    live = false;
    cancelAnimationFrame(refreshFrame);
    media.revert();
  };
}
