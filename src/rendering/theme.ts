/**
 * Visual design tokens — single source of truth for all colours and sizes.
 */
export const THEME = {
  // Canvas
  background: 0xF5F3EE,

  // Grid
  gridLine: 0xD8D5CC,
  gridLineAlpha: 1,

  // Nodes
  nodeEmpty: 0xB0ADA5,
  nodeEmptyRadius: 5,
  nodeHubRadius: 12,
  nodeHubBorder: 0x222220,
  nodeHubBorderWidth: 2,
  nodeSelectedRing: 0xF0A500,
  nodeSelectedRingWidth: 3,
  nodeHoverRing: 0xB0ADA5,
  nodeHoverRingAlpha: 0.5,

  // Connections
  connectionNormalWidth: 2.5,
  connectionBridgeWidth: 5,
  arrowHeadSize: 10,

  // Players
  P1: 0x2D6A9F,
  P2: 0xC0392B,

  // Preview
  previewAlpha: 0.35,

  // Typography
  labelFontSize: 9,
  labelColor: '#FFFFFF',
  labelBoldColor: '#FFFFFF',
} as const;

/** How many pixels between adjacent grid nodes. */
export const CELL_SIZE = 72;

/** Outer padding around the grid. */
export const GRID_PADDING = 48;

/** Convert a grid coord to canvas pixel position. */
export function gridToPixel(col: number, row: number): { x: number; y: number } {
  return {
    x: GRID_PADDING + col * CELL_SIZE,
    y: GRID_PADDING + row * CELL_SIZE,
  };
}
