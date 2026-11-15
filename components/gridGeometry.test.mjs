import assert from "node:assert/strict";
import test from "node:test";
import { getGridGeometry, GRID_BLOCK_SIZE } from "./gridGeometry.ts";

test("intro and page columns stay on the same lattice across viewport widths", () => {
  for (const width of [320, 375, 768, 1200, 1264, 1365, 1896, 1920]) {
    const intro = getGridGeometry(width, 0);
    const hero = getGridGeometry(width, 60);
    assert.equal(intro.offsetX, hero.offsetX);
    assert.equal(intro.columnCount, hero.columnCount);
    assert.ok(intro.offsetX <= 0);
    assert.ok(intro.offsetX + intro.columnCount * GRID_BLOCK_SIZE >= width);
  }
});

test("intro and page rows align in viewport space at fractional section offsets", () => {
  const phase = (value) => ((value % GRID_BLOCK_SIZE) + GRID_BLOCK_SIZE) % GRID_BLOCK_SIZE;
  for (const scrollY of [0, 17, 60, 143.5]) {
    // A fixed intro sits at scrollY in document space; sections have their
    // own document offsets. Their rendered grid lines must still coincide.
    const intro = getGridGeometry(1264, scrollY);
    for (const pageTop of [0, 60, 80, 80.5, 991.25, 1600]) {
      const page = getGridGeometry(1264, pageTop);
      assert.equal(
        phase(intro.offsetY),
        phase(pageTop - scrollY + page.offsetY),
      );
    }
  }
});
