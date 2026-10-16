import { Container } from 'pixi.js';
import { Connection } from '../nexus/board/Connection';
import { ConnectionType } from '../nexus/types';
import { ConnectionRenderer } from './ConnectionRenderer';
import { THEME } from './theme';
import type { GridCoord, PlayerID } from '../nexus/types';
export class HoverRenderer {
  readonly container = new Container();
  private current: ConnectionRenderer | null = null;
  showPreview(from: GridCoord, to: GridCoord, player: PlayerID, bridge: boolean): void {
    this.clear();
    this.current = new ConnectionRenderer(new Connection(from, to, bridge ? ConnectionType.Bridge : ConnectionType.Normal, player), THEME.previewAlpha);
    this.container.addChild(this.current.gfx);
  }
  clear(): void {
    if (!this.current) return;
    this.container.removeChild(this.current.gfx); this.current.gfx.destroy(); this.current = null;
  }
}
