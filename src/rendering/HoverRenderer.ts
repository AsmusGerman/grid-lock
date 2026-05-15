import { Container } from 'pixi.js';
import { ConnectionRenderer } from './ConnectionRenderer';
import { Connection } from '../nexus/board/Connection';
import { Board } from '../nexus/board/Board';
import { THEME } from './theme';
import type { GridCoord, PlayerID } from '../nexus/types';

/**
 * Renders a translucent preview arrow while the player is choosing
 * the destination node after selecting a source.
 */
export class HoverRenderer {
  readonly container: Container;
  private current: ConnectionRenderer | null = null;

  constructor() {
    this.container = new Container();
  }

  /** Show a ghost arrow from `from` toward `to` for the given player. */
  showPreview(from: GridCoord, to: GridCoord, player: PlayerID): void {
    this.clear();

    const connectionType = Board.inferConnectionType(from, to);
    const conn = new Connection(from, to, connectionType, player);
    this.current = new ConnectionRenderer(conn, THEME.previewAlpha);
    this.container.addChild(this.current.gfx);
  }

  clear(): void {
    if (this.current) {
      this.container.removeChild(this.current.gfx);
      this.current.gfx.destroy();
      this.current = null;
    }
  }
}
