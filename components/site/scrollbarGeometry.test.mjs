import assert from "node:assert/strict";
import test from "node:test";
import { getScrollbarMetrics } from "./scrollbarGeometry.ts";

test("the compact handle keeps its 80px silhouette and leaves space for endpoint markers", () => {
  assert.deepEqual(getScrollbarMetrics(800, 3200, 0, 784), {
    height: 80, travel: 688, top: 8, maxScroll: 2400, progress: 0, inset: 8,
  });
  assert.equal(getScrollbarMetrics(800, 3200, 1200, 784).top, 352);
  assert.equal(getScrollbarMetrics(800, 3200, 2400, 784).top, 696);
});

test("short documents, very long pages and overscroll stay bounded", () => {
  assert.equal(getScrollbarMetrics(800, 200, 0, 784).maxScroll, 0);
  assert.equal(getScrollbarMetrics(800, 200, 0, 784).height, 80);
  assert.equal(getScrollbarMetrics(800, 100000, 0, 784).height, 80);
  assert.equal(getScrollbarMetrics(800, 3200, -50, 784).top, 8);
  assert.equal(getScrollbarMetrics(800, 3200, 3000, 784).top, 696);
  assert.equal(getScrollbarMetrics(20, 1000, 0, 4).height, 4);
});
