import { Graphics } from 'pixi.js';
import { ConnectionType } from '../nexus/types';
import { THEME, gridToPixel } from './theme';
import type { IConnection } from '../nexus/types';

export class ConnectionRenderer {
  readonly gfx = new Graphics();
  constructor(private readonly connection: IConnection, alpha = 1) { this.gfx.alpha = alpha; this.draw(); }
  private draw(): void {
    const a = gridToPixel(this.connection.from.col, this.connection.from.row);
    const b = gridToPixel(this.connection.to.col, this.connection.to.row);
    const color = THEME[this.connection.player];
    const dx = b.x - a.x; const dy = b.y - a.y; const length = Math.hypot(dx, dy);
    const ux = dx / length; const uy = dy / length;
    // Always offset to the arrow's local right. A reverse arrow therefore lands
    // on the opposite side of the same grid segment instead of overlapping it.
    const offset = 3.5;
    const sx = a.x - uy * offset + ux * 15; const sy = a.y + ux * offset + uy * 15;
    const ex = b.x - uy * offset - ux * 17; const ey = b.y + ux * offset - uy * 17;
    if (this.connection.type === ConnectionType.Bridge) {
      const segments = 9;
      for (let i = 0; i < segments; i += 2) {
        const t1 = i / segments; const t2 = Math.min((i + 1) / segments, 1);
        this.gfx.setStrokeStyle({ width: 5, color });
        this.gfx.moveTo(sx + (ex - sx) * t1, sy + (ey - sy) * t1).lineTo(sx + (ex - sx) * t2, sy + (ey - sy) * t2).stroke();
      }
    } else {
      this.gfx.setStrokeStyle({ width: THEME.connectionNormalWidth, color });
      this.gfx.moveTo(sx, sy).lineTo(ex, ey).stroke();
    }
    const size = THEME.arrowHeadSize;
    const lx = ex - ux * size - uy * size * 0.55; const ly = ey - uy * size + ux * size * 0.55;
    const rx = ex - ux * size + uy * size * 0.55; const ry = ey - uy * size - ux * size * 0.55;
    this.gfx.setFillStyle({ color }); this.gfx.moveTo(ex, ey).lineTo(lx, ly).lineTo(rx, ry).closePath().fill();
  }
}
