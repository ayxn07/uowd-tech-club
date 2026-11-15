const clamp = (value: number, max: number) => Math.min(max, Math.max(0, value));

export function getScrollbarMetrics(
  viewportHeight: number,
  documentHeight: number,
  scrollY: number,
  trackHeight: number,
) {
  const maxScroll = Math.max(0, documentHeight - viewportHeight);
  // Compact version of the reference handle; never stretch into a native pill.
  // Leave the square endpoint markers visible even at the start/end.
  const inset = Math.min(8, Math.max(0, (trackHeight - 80) / 2));
  const height = Math.min(trackHeight - inset * 2, 80);
  const travel = Math.max(0, trackHeight - inset * 2 - height);
  const progress = maxScroll ? clamp(scrollY, maxScroll) / maxScroll : 0;
  return { height, travel, top: inset + progress * travel, maxScroll, progress, inset };
}
