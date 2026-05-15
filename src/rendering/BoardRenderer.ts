import { Container, Graphics, Text } from 'pixi.js';
import { THEME, CELL_SIZE, GRID_PADDING } from './theme';

/**
 * Draws the static grid: horizontal and vertical lines between all node positions.
 * The result is a single Graphics object — add it once to a container.
 */
export class BoardRenderer {
  private readonly container: Container;
  private readonly gfx: Graphics;
  private readonly labels: Text[] = [];

  constructor(cols: number, rows: number) {
    this.container = new Container();
    this.gfx = new Graphics();
    this.container.addChild(this.gfx);
    this.draw(cols, rows);
  }

  private draw(cols: number, rows: number): void {
    const g = this.gfx;
    g.clear();
    for (const label of this.labels) {
      this.container.removeChild(label);
      label.destroy();
    }
    this.labels.length = 0;

    g.setStrokeStyle({ width: 1, color: THEME.gridLine, alpha: THEME.gridLineAlpha });

    // Horizontal lines
    for (let row = 0; row < rows; row++) {
      const y = GRID_PADDING + row * CELL_SIZE;
      const xStart = GRID_PADDING;
      const xEnd = GRID_PADDING + (cols - 1) * CELL_SIZE;
      g.moveTo(xStart, y).lineTo(xEnd, y).stroke();
    }

    // Vertical lines
    for (let col = 0; col < cols; col++) {
      const x = GRID_PADDING + col * CELL_SIZE;
      const yStart = GRID_PADDING;
      const yEnd = GRID_PADDING + (rows - 1) * CELL_SIZE;
      g.moveTo(x, yStart).lineTo(x, yEnd).stroke();
    }

    const textStyle = {
      fontSize: 14,
      fill: '#6A665F',
      fontWeight: '700' as const,
      fontFamily: 'Segoe UI, system-ui, sans-serif',
    };

    for (let col = 0; col < cols; col++) {
      const label = String.fromCharCode(65 + col);
      const text = new Text(label, textStyle);
      text.anchor.set(0.5);
      text.x = GRID_PADDING + col * CELL_SIZE;
      text.y = GRID_PADDING - CELL_SIZE * 0.45;
      this.labels.push(text);
      this.container.addChild(text);
    }

    for (let row = 0; row < rows; row++) {
      const label = String(row + 1);
      const text = new Text(label, textStyle);
      text.anchor.set(0.5);
      text.x = GRID_PADDING - CELL_SIZE * 0.45;
      text.y = GRID_PADDING + row * CELL_SIZE;
      this.labels.push(text);
      this.container.addChild(text);
    }
  }

  get displayObject(): Container {
    return this.container;
  }

  /** Returns the total canvas dimensions needed for this grid. */
  static canvasSize(cols: number, rows: number): { width: number; height: number } {
    return {
      width: GRID_PADDING * 2 + (cols - 1) * CELL_SIZE,
      height: GRID_PADDING * 2 + (rows - 1) * CELL_SIZE,
    };
  }
}
