export const GRID_BLOCK_SIZE = 60;

// Every page section shares one document-space lattice.
export function getGridGeometry(width: number, pageTop: number) {
  const columnCount = Math.ceil(width / GRID_BLOCK_SIZE);
  return {
    columnCount,
    offsetX: (width - columnCount * GRID_BLOCK_SIZE) / 2,
    offsetY: -(((pageTop % GRID_BLOCK_SIZE) + GRID_BLOCK_SIZE) % GRID_BLOCK_SIZE),
  };
}
