"use client";

import { useEffect, useRef } from "react";
import { getGridGeometry, GRID_BLOCK_SIZE as BLOCK_SIZE } from "./gridGeometry";

const HIGHLIGHT_DURATION = 300;

type Block = {
  element: HTMLDivElement;
  highlightEndTime: number;
};

type FillCell = {
  element: HTMLDivElement;
  threshold: number;
  filled: boolean;
};

// How far down the section the arc reaches at its centre; also its radius.
const ARC_DEPTH = 0.8;

// Cut-off score for the dissolve band: 0.55 leaves the top row nearly full,
// the second row across about the middle half, and a few ragged centre cells
// in the third.
const DISSOLVE_KEEP = 0.55;

// Stable 0..1 noise per cell, so the dissolve pattern is the same every time.
function cellNoise(row: number, column: number) {
  const s = Math.sin(row * 127.1 + column * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// Fills its positioned parent. Every instance snaps to one 60px lattice
// anchored to the page (columns centred on the page width, rows counted from
// the top of the document), so grid lines run straight across section edges.
//
// `dissolveRows`: as the section scrolls up, the previous section's colour
// creeps down into its top rows block by block, top row first, and stays as a
// stepped downward chevron with ragged pixels.
//
// `arc`: cells inside a semicircle hanging from the top centre (radius
// ARC_DEPTH of the height) fill with the dissolve colour as the section
// scrolls into view, from the top centre outwards.
//
// Both reverse when scrolling back up.
export function InteractiveGrid({
  dissolveRows = 0,
  arc = false,
}: {
  dissolveRows?: number;
  arc?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let blocks: Block[] = [];
    let columnCount = 0;
    let rowCount = 0;
    let offsetX = 0;
    let offsetY = 0;
    const activeBlocks = new Set<Block>();
    let fillCells: FillCell[] = [];
    let expiryFrame = 0;
    let resizeFrame = 0;
    let scrollFrame = 0;
    let previousLayout: { width: number; height: number; pageTop: number } | undefined;

    function build() {
      const width = container!.clientWidth;
      const height = container!.clientHeight;
      const pageTop = container!.getBoundingClientRect().top + window.scrollY;

      // Scroll-lock/overlay changes can notify the body observer without
      // changing this grid. Keep the existing cells (and highlights) in place.
      if (
        previousLayout?.width === width &&
        previousLayout.height === height &&
        previousLayout.pageTop === pageTop
      ) return;
      previousLayout = { width, height, pageTop };

      container!.replaceChildren();
      blocks = [];
      activeBlocks.clear();

      const geometry = getGridGeometry(width, pageTop);
      columnCount = geometry.columnCount;
      offsetX = geometry.offsetX;
      offsetY = geometry.offsetY;
      rowCount = Math.ceil((height - offsetY) / BLOCK_SIZE);

      const fragment = document.createDocumentFragment();

      // Row-major, so a block's index is row * columns + column.
      for (let row = 0; row < rowCount; row++) {
        for (let column = 0; column < columnCount; column++) {
          const element = document.createElement("div");
          element.className = "block";
          element.style.width = `${BLOCK_SIZE}px`;
          element.style.height = `${BLOCK_SIZE}px`;
          element.style.left = `${column * BLOCK_SIZE + offsetX}px`;
          element.style.top = `${row * BLOCK_SIZE + offsetY}px`;
          fragment.appendChild(element);
          blocks.push({ element, highlightEndTime: 0 });
        }
      }

      container!.appendChild(fragment);

      fillCells = [];

      // A section's top rarely sits on a lattice line, so row 0 is usually a
      // part-row whose cells straddle the edge, with the rest of each cell in
      // the section above. That row takes the previous section's colour for
      // good, so every cell reads as one colour and the patterns below start
      // on a full grid line.
      const partial = (dissolveRows || arc) && offsetY < -0.5 ? 1 : 0;
      for (let column = 0; column < columnCount * partial; column++) {
        blocks[column].element.classList.add("fill");
      }

      const bandRows = Math.min(dissolveRows, rowCount - partial);
      const centre = (columnCount - 1) / 2;

      for (let band = 0; band < bandRows; band++) {
        const row = band + partial;
        const depth = (bandRows - band) / bandRows;
        for (let column = 0; column < columnCount; column++) {
          const spread = centre ? Math.abs(column - centre) / centre : 0;
          // Keyed on the band row, not the section row, so every section
          // boundary gets the same chevron whether or not it has a part-row.
          const noise = cellNoise(band, column);
          // Higher rows and centre columns score higher; only cells above
          // DISSOLVE_KEEP are part of the final chevron.
          const score = 0.15 + depth * 0.55 - spread * 0.25 + noise * 0.2;
          if (score <= DISSOLVE_KEEP) continue;

          // The top row starts filling once the edge is about 50px into the
          // viewport, so the straight edge is only briefly on screen.
          fillCells.push({
            element: blocks[row * columnCount + column].element,
            threshold: 0.08 + (1 - depth) * 0.6 + noise * 0.1,
            filled: false,
          });
        }
      }

      if (arc) {
        // A true semicircle, so its sides drop steeply from the top edge and
        // the top-left and top-right corners stay the section's own colour.
        const radiusY = height * ARC_DEPTH;
        const radiusX = Math.min(radiusY, width / 2);

        const rowCentre = (row: number) =>
          Math.max(0, row * BLOCK_SIZE + offsetY + BLOCK_SIZE / 2);
        const reachAt = (y: number) =>
          radiusX * Math.sqrt(Math.max(0, 1 - (y / radiusY) ** 2));
        const columnX = (column: number) =>
          column * BLOCK_SIZE + offsetX + BLOCK_SIZE / 2 - width / 2;
        const cellsWithin = (reach: number) => {
          let count = 0;
          for (let column = 0; column < columnCount; column++) {
            if (Math.abs(columnX(column)) <= reach) count++;
          }
          return count;
        };

        // If the top row is exactly as wide as the one below, the edge would
        // run two cells straight down at the top corners; one more cell on
        // each side of the top row makes it step out instead.
        const topReach = reachAt(rowCentre(partial));
        const widenTop =
          cellsWithin(topReach) === cellsWithin(reachAt(rowCentre(partial + 1)));

        for (let row = partial; row < rowCount; row++) {
          const y = rowCentre(row);
          if (y >= radiusY) break;
          const reach =
            row === partial && widenTop ? topReach + BLOCK_SIZE : reachAt(y);
          for (let column = 0; column < columnCount; column++) {
            const x = columnX(column);
            if (Math.abs(x) > reach) continue;
            const distance = Math.hypot(x / radiusX, y / radiusY);

            fillCells.push({
              element: blocks[row * columnCount + column].element,
              threshold: 0.1 + distance * 0.65 + cellNoise(row, column) * 0.15,
              filled: false,
            });
          }
        }
      }

      updateFills();
    }

    // 0 while the section's top is at the bottom of the viewport. Dissolve: 1
    // once it has risen 65% of the way up, so the chevron is complete when the
    // section's content reveals at the middle of the viewport. Arc: 1 once the
    // whole section is on screen.
    function updateFills() {
      scrollFrame = 0;
      if (!fillCells.length) return;

      const top = container!.getBoundingClientRect().top;
      const viewport = window.innerHeight;
      const span = arc ? container!.clientHeight : viewport * 0.65;
      const progress = Math.min(1, Math.max(0, (viewport - top) / span));

      for (const cell of fillCells) {
        const filled = progress >= cell.threshold;
        if (filled !== cell.filled) {
          cell.filled = filled;
          cell.element.classList.toggle("fill", filled);
        }
      }
    }

    function handleScroll() {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(updateFills);
    }

    function clampIndex(value: number, count: number) {
      return Math.min(count - 1, Math.max(0, value));
    }

    function expireHighlights() {
      expiryFrame = 0;
      const now = Date.now();

      for (const block of activeBlocks) {
        if (now > block.highlightEndTime) {
          block.element.classList.remove("highlight");
          block.highlightEndTime = 0;
          activeBlocks.delete(block);
        }
      }

      if (activeBlocks.size) {
        expiryFrame = requestAnimationFrame(expireHighlights);
      }
    }

    function highlight(block: Block, endTime: number) {
      block.element.classList.add("highlight");
      block.highlightEndTime = endTime;
      activeBlocks.add(block);

      if (!expiryFrame) {
        expiryFrame = requestAnimationFrame(expireHighlights);
      }
    }

    // Lights the cell under the pointer plus one random neighbour from the
    // surrounding 3x3 ring. `ceil - 1` puts a point on a cell edge in the
    // earlier cell.
    function handleMouseMove(event: MouseEvent) {
      if (!columnCount || !rowCount) return;

      const rect = container!.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

      const column = clampIndex(
        Math.ceil((x - offsetX) / BLOCK_SIZE) - 1,
        columnCount,
      );
      const row = clampIndex(
        Math.ceil((y - offsetY) / BLOCK_SIZE) - 1,
        rowCount,
      );

      const endTime = Date.now() + HIGHLIGHT_DURATION;
      highlight(blocks[row * columnCount + column], endTime);

      const neighbours: Block[] = [];

      for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
        const neighbourRow = row + rowOffset;
        if (neighbourRow < 0 || neighbourRow >= rowCount) continue;

        for (let columnOffset = -1; columnOffset <= 1; columnOffset++) {
          const neighbourColumn = column + columnOffset;
          if (neighbourColumn < 0 || neighbourColumn >= columnCount) continue;
          if (rowOffset === 0 && columnOffset === 0) continue;

          neighbours.push(blocks[neighbourRow * columnCount + neighbourColumn]);
        }
      }

      if (neighbours.length === 0) return;

      highlight(
        neighbours[Math.floor(Math.random() * neighbours.length)],
        endTime,
      );
    }

    function handleResize() {
      if (resizeFrame) return;
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        build();
      });
    }

    build();

    // The section's size or its position on the page can change without a
    // window resize, e.g. when fonts load above it.
    const observer = new ResizeObserver(handleResize);
    observer.observe(container);
    observer.observe(document.body);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    if (dissolveRows || arc) {
      window.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(expiryFrame);
      cancelAnimationFrame(resizeFrame);
      cancelAnimationFrame(scrollFrame);
      container.replaceChildren();
    };
  }, [dissolveRows, arc]);

  return <div ref={containerRef} className="interactive-grid" aria-hidden />;
}
