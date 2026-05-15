import { Application, Container } from 'pixi.js';
import { GameSession } from '../nexus/session/GameSession';
import { Board } from '../nexus/board/Board';
import { BoardRenderer } from '../rendering/BoardRenderer';
import { NodeRenderer } from '../rendering/NodeRenderer';
import { ConnectionRenderer } from '../rendering/ConnectionRenderer';
import { HoverRenderer } from '../rendering/HoverRenderer';
import { THEME } from '../rendering/theme';
import type { GridCoord, INode, MoveDescriptor, MoveLogEntry } from '../nexus/types';
import { ConnectionType } from '../nexus/types';
import { GAME_ERROR_EVENT, GAME_STATE_EVENT, type GameStateDetail } from '../nexus/events';

/**
 * Orchestrates the full game loop:
 * validate → apply → reclassify → re-render → score → advance turn.
 */
export class GameService {
  private readonly boardLayer: Container;
  private readonly connectionLayer: Container;
  private readonly nodeLayer: Container;
  private readonly previewLayer: Container;

  private readonly session: GameSession;
  private readonly nodeRenderers: Map<string, NodeRenderer> = new Map();
  private readonly hoverRenderer: HoverRenderer;
  private app: Application | null = null;

  private selectedCoord: GridCoord | null = null;

  constructor(session: GameSession) {
    this.session = session;
    this.boardLayer = new Container();
    this.connectionLayer = new Container();
    this.nodeLayer = new Container();
    this.previewLayer = new Container();

    this.hoverRenderer = new HoverRenderer();
    this.previewLayer.addChild(this.hoverRenderer.container);

    this.buildBoard();
  }

  // ─── Initialisation ──────────────────────────────────────────────────────────

  private buildBoard(): void {
    const { cols, rows } = this.session.board;

    // Static grid background
    const boardRenderer = new BoardRenderer(cols, rows);
    this.boardLayer.addChild(boardRenderer.displayObject);

    // Node renderers
    for (const node of this.session.board.allNodes()) {
      const nr = new NodeRenderer(node);
      this.nodeRenderers.set(this.coordKey(node.coord), nr);
      this.nodeLayer.addChild(nr.container);

      nr.container.on('pointerover', () => this.onNodeHover(node));
      nr.container.on('pointerout', () => this.onNodeHoverOut(node));
      nr.container.on('pointertap', () => this.onNodeClick(node));
    }
  }

  // ─── Callbacks ───────────────────────────────────────────────────────────────
  // ─── Lifecycle ────────────────────────────────────────────────────────────────

  async mount(container: HTMLElement): Promise<void> {
    const { cols, rows } = this.session.board;
    const { width, height } = BoardRenderer.canvasSize(cols, rows);

    this.app = new Application();
    await this.app.init({
      width,
      height,
      background: THEME.background,
      antialias: true,
      resolution: window.devicePixelRatio ?? 1,
      autoDensity: true,
    });

    container.appendChild(this.app.canvas);

    this.app.stage.addChild(this.boardLayer);
    this.app.stage.addChild(this.connectionLayer);
    this.app.stage.addChild(this.previewLayer);
    this.app.stage.addChild(this.nodeLayer);

    this.dispatchState();
  }

  destroy(): void {
    this.app?.destroy(true);
    this.app = null;
  }

  // ─── Public actions ───────────────────────────────────────────────────────────

  finishTurn(): void {
    const result = this.session.finishTurn();
    if (!result) {
      this.dispatchError('You must make exactly one move, then press Ready.');
      this.dispatchState();
      return;
    }
    this.hoverRenderer.clear();
    if (this.selectedCoord) {
      this.rendererFor(this.selectedCoord)?.setSelected(false);
      this.selectedCoord = null;
    }
    this.dispatchState();
  }

  undoLastMove(): void {
    const undone = this.session.undoLastMove();
    if (!undone) {
      this.dispatchError('No move available to undo.');
      this.dispatchState();
      return;
    }

    this.hoverRenderer.clear();
    if (this.selectedCoord) {
      this.rendererFor(this.selectedCoord)?.setSelected(false);
      this.selectedCoord = null;
    }

    this.redrawConnectionsFromBoard();
    for (const currentNode of this.session.board.allNodes()) {
      this.rendererFor(currentNode.coord)?.redraw();
    }

    this.dispatchState();
  }

  surrenderCurrentPlayer(): void {
    const surrendered = this.session.surrenderCurrentPlayer();
    if (!surrendered) {
      this.dispatchError('Cannot surrender after the game is over.');
      this.dispatchState();
      return;
    }

    this.hoverRenderer.clear();
    if (this.selectedCoord) {
      this.rendererFor(this.selectedCoord)?.setSelected(false);
      this.selectedCoord = null;
    }

    this.dispatchState();
  }

  // ─── Interaction handlers ────────────────────────────────────────────────────

  private onNodeHover(node: INode): void {
    const nr = this.rendererFor(node.coord);
    if (!nr) return;
    nr.setHovered(true);

    if (this.selectedCoord) {
      this.hoverRenderer.showPreview(
        this.selectedCoord,
        node.coord,
        this.session.currentPlayer,
      );
    }
  }

  private onNodeHoverOut(node: INode): void {
    const nr = this.rendererFor(node.coord);
    if (!nr) return;
    nr.setHovered(false);
    this.hoverRenderer.clear();
  }

  private onNodeClick(node: INode): void {
    if (this.session.isGameOver) return;

    // ─── Placement phase: single-click to place source ───
    if (this.session.isPlacementPhase) {
      const result = this.session.placeSource(node.coord, this.session.currentPlayer);
      if (!result.valid) {
        this.dispatchError(result.reason ?? 'Invalid placement.');
        return;
      }
      this.rendererFor(node.coord)?.redraw();
      this.dispatchState();
      return;
    }

    // ─── Normal phases: two-click source → destination flow ───
    if (!this.session.canPlayMove() && !this.selectedCoord) {
      this.dispatchError('Move already played. Press Ready or Undo.');
      return;
    }

    if (!this.selectedCoord) {
      // First click: select source
      this.selectedCoord = node.coord;
      this.rendererFor(node.coord)?.setSelected(true);
    } else {
      // Second click: attempt move
      const from = this.selectedCoord;
      const to = node.coord;

      // Deselect source
      this.rendererFor(from)?.setSelected(false);
      this.selectedCoord = null;
      this.hoverRenderer.clear();

      // If clicking same node again — deselect
      if (from.col === to.col && from.row === to.row) return;

      const connectionType = Board.inferConnectionType(from, to);

      const move: MoveDescriptor = {
        from,
        to,
        connectionType,
        player: this.session.currentPlayer,
      };

      const validation = this.session.validateMove(move);
      if (!validation.valid) {
        this.dispatchError(validation.reason ?? 'Invalid move.');
        return;
      }

      const event = this.session.applyMove(move);

      // Add connection graphic
      const connRenderer = new ConnectionRenderer(event.connection);
      this.connectionLayer.addChild(connRenderer.gfx);

      // Redraw all nodes: topology + outbound blocking may have changed globally.
      for (const currentNode of this.session.board.allNodes()) {
        this.rendererFor(currentNode.coord)?.redraw();
      }

      // Notify UI
      this.dispatchState();
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private dispatchState(): void {
    // Proactive auto-end: if the current player has no legal moves and the
    // game hasn't been flagged as over yet, end it now. This catches edge
    // cases not covered by the post-move / post-finishTurn checks (e.g.
    // after undo or at mount time).
    if (
      !this.session.isGameOver &&
      this.session.canPlayMove() &&
      this.session.getLegalMoveCount(this.session.currentPlayer) === 0
    ) {
      this.session.endByNoMoves();
    }

    window.dispatchEvent(
      new CustomEvent(GAME_STATE_EVENT, { detail: this.buildStateDetail() }),
    );
  }

  private dispatchError(message: string): void {
    window.dispatchEvent(new CustomEvent(GAME_ERROR_EVENT, { detail: message }));
  }

  private buildStateDetail(): GameStateDetail {
    const scores = this.session.getScores();
    const isPlacement = this.session.isPlacementPhase;
    return {
      currentPlayer: this.session.currentPlayer,
      turnCount: this.session.turnCount,
      maxTurns: this.session.config.maxTurns,
      actionableNodes: isPlacement ? 0 : this.session.getActionableNodeCount(this.session.currentPlayer),
      scores,
      phases: this.session.getPhases(),
      moveLog: this.formatMoveLog(),
      canUndo: !isPlacement && this.session.canUndo(),
      canReady: !isPlacement && this.session.canFinishTurn(),
      canSurrender:
        !isPlacement &&
        !this.session.isGameOver &&
        this.session.getPhase(this.session.currentPlayer) === 'Expansion',
      winner: this.session.getWinner(),
      isGameOver: this.session.isGameOver,
    };
  }

  private formatMoveLog(): MoveLogEntry[] {
    return this.session.getMoveHistory().map((move, index) => ({
      player: move.player,
      label: `#${index + 1} ${move.player} ${this.coordLabel(move.from)} → ${this.coordLabel(move.to)} (${this.connLabel(move.connectionType)})`,
    }));
  }

  private coordLabel(coord: GridCoord): string {
    return `${String.fromCharCode(65 + coord.col)}${coord.row + 1}`;
  }

  private connLabel(type: string): string {
    if (type === ConnectionType.Diagonal) return 'D';
    if (type === ConnectionType.Bridge) return 'B';
    if (type === ConnectionType.DiagonalBridge) return 'DB';
    return 'N';
  }

  private rendererFor(coord: GridCoord): NodeRenderer | undefined {
    return this.nodeRenderers.get(this.coordKey(coord));
  }

  private coordKey(coord: GridCoord): string {
    return `${coord.col},${coord.row}`;
  }

  private redrawConnectionsFromBoard(): void {
    for (const child of [...this.connectionLayer.children]) {
      this.connectionLayer.removeChild(child);
      child.destroy();
    }

    for (const connection of this.session.board.getConnections()) {
      const connRenderer = new ConnectionRenderer(connection);
      this.connectionLayer.addChild(connRenderer.gfx);
    }
  }

}
