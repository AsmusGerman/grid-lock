import { Graphics } from 'pixi.js';
import { ConnectionType } from '../nexus/types';
import { THEME, gridToPixel } from './theme';
import type { IConnection } from '../nexus/types';

/**
 * Renders a single directed connection as a line + arrowhead.
 * Bridge connections are drawn as a bold solid line.
 * All geometry is drawn in local space on a Graphics object.
 */
export class ConnectionRenderer {
  readonly gfx: Graphics;

  constructor(private readonly connection: IConnection, alpha = 1) {
    this.gfx = new Graphics();
    this.gfx.alpha = alpha;
    this.draw();
  }

  private draw(): void {
    const { from, to, type, player } = this.connection;
    const a = gridToPixel(from.col, from.row);
    const b = gridToPixel(to.col, to.row);
    const color = (THEME as unknown as Record<string, number>)[player];

    const width = (type === ConnectionType.Bridge || type === ConnectionType.DiagonalBridge)
      ? THEME.connectionBridgeWidth
      : (type === ConnectionType.Diagonal ? 2 : THEME.connectionNormalWidth);
    this.drawSolidLine(a, b, color, width);

    this.drawArrowHead(a, b, color);
  }

  private drawSolidLine(
    a: { x: number; y: number },
    b: { x: number; y: number },
    color: number,
    width: number,
  ): void {
    const { x: ax, y: ay } = a;
    const { x: bx, y: by } = b;
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy);

    // Shorten the line so it doesn't overlap the node circles
    const shrink = 8;
    const ratio = (len - shrink) / len;

    this.gfx.setStrokeStyle({ width, color });
    this.gfx
      .moveTo(ax + (dx * (1 - ratio)) / 2, ay + (dy * (1 - ratio)) / 2)
      .lineTo(ax + dx * ratio + (dx * (1 - ratio)) / 2, ay + dy * ratio + (dy * (1 - ratio)) / 2)
      .stroke();
  }

  private drawArrowHead(
    a: { x: number; y: number },
    b: { x: number; y: number },
    color: number,
  ): void {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    const ux = dx / len;
    const uy = dy / len;

    // Arrow tip is slightly before the destination node edge
    const tipOffset = 14;
    const tipX = b.x - ux * tipOffset;
    const tipY = b.y - uy * tipOffset;

    const s = THEME.arrowHeadSize;
    const lx = tipX - ux * s - uy * (s * 0.5);
    const ly = tipY - uy * s + ux * (s * 0.5);
    const rx = tipX - ux * s + uy * (s * 0.5);
    const ry = tipY - uy * s - ux * (s * 0.5);

    this.gfx.setFillStyle({ color });
    this.gfx.moveTo(tipX, tipY).lineTo(lx, ly).lineTo(rx, ry).closePath().fill();
  }
}
