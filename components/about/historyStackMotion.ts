// Motion equations adapted from the supplied why-partner-card-stack ZIP.
export const STACK_SCROLL_PER_CARD = 1;
export const STACK_TRANSITION_END = 0.92;

export function historyCardPose(progress: number, index: number, total: number) {
  const boundedProgress = Math.max(0, Math.min(1, progress));
  const segment = total > 1 ? STACK_TRANSITION_END / (total - 1) : STACK_TRANSITION_END;
  const active = Math.min(Math.floor(boundedProgress / segment), total - 1);
  const segmentProgress = Math.min(1, (boundedProgress - active * segment) / segment);

  if (index < active) return { xPercent: -50, yPercent: -250, rotationX: 35, scale: 1 };
  if (index === active) {
    return {
      xPercent: -50,
      yPercent: index === total - 1 ? -50 : -50 - 150 * segmentProgress,
      rotationX: index === total - 1 ? 0 : 35 * segmentProgress,
      scale: 1,
    };
  }
  const behind = index - active - segmentProgress;
  return { xPercent: -50, yPercent: -50 + behind * 5, rotationX: 0, scale: 1 - behind * 0.075 };
}
