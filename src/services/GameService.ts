import { Application, Container, Graphics } from 'pixi.js';
import { Board } from '../nexus/board/Board';
import { NodeState } from '../nexus/types';
import { BoardRenderer } from '../rendering/BoardRenderer';
import { ConnectionRenderer } from '../rendering/ConnectionRenderer';
import { HoverRenderer } from '../rendering/HoverRenderer';
import { NodeRenderer } from '../rendering/NodeRenderer';
import { CELL_SIZE, THEME, gridToPixel } from '../rendering/theme';
import { GAME_ERROR_EVENT, GAME_STATE_EVENT, type GameStateDetail } from '../nexus/events';
import type { ActionType, GridCoord, INode, MoveDescriptor } from '../nexus/types';
import type { GameSession } from '../nexus/session/GameSession';

const HIT_ALPHA = 0.001;
export class GameService {
  private readonly boardLayer = new Container();
  private readonly connectionLayer = new Container();
  private readonly nodeLayer = new Container();
  private readonly previewLayer = new Container();
  private readonly interactionLayer = new Container();
  private readonly hoverRenderer = new HoverRenderer();
  private readonly nodeRenderers = new Map<string, NodeRenderer>();
  private app: Application | null = null;
  private containerEl: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private selectedCoord: GridCoord | null = null;
  private bridgeMode = false;
  private baseCanvasWidth = 0;
  private baseCanvasHeight = 0;

  constructor(private readonly session: GameSession) {
    const board = new BoardRenderer(session.board.cols, session.board.rows);
    this.boardLayer.addChild(board.displayObject);
    this.previewLayer.addChild(this.hoverRenderer.container);
    this.rebuildNodes();
  }
  async mount(container: HTMLElement): Promise<void> {
    const size = BoardRenderer.canvasSize(this.session.board.cols, this.session.board.rows);
    this.baseCanvasWidth = size.width; this.baseCanvasHeight = size.height; this.containerEl = container;
    this.app = new Application();
    await this.app.init({ ...size, background: THEME.background, antialias: true, resolution: window.devicePixelRatio || 1, autoDensity: true });
    container.replaceChildren(this.app.canvas);
    this.app.stage.addChild(this.boardLayer, this.connectionLayer, this.previewLayer, this.nodeLayer, this.interactionLayer);
    this.resizeObserver = new ResizeObserver(this.updateCanvasScale); this.resizeObserver.observe(container);
    window.addEventListener('resize', this.updateCanvasScale); this.updateCanvasScale(); this.redrawAll(); this.dispatchState();
  }
  destroy(): void {
    this.resizeObserver?.disconnect(); window.removeEventListener('resize', this.updateCanvasScale);
    this.app?.destroy(true); this.app = null; this.containerEl = null;
  }
  setBridgeMode(enabled: boolean): void {
    if (this.session.isGameOver) return;
    if (enabled && this.session.getBridgeCharges()[this.session.currentPlayer] <= 0) { this.dispatchError('No Bridge charges remain.'); return; }
    this.bridgeMode = enabled; this.clearSelection(); this.dispatchState();
  }
  toggleBridgeMode(): void { this.setBridgeMode(!this.bridgeMode); }
  undoLastMove(): void {
    if (!this.session.undoLastMove()) { this.dispatchError('No action available to undo.'); return; }
    this.bridgeMode = false; this.clearSelection(); this.rebuildNodes(); this.redrawAll(); this.dispatchState();
  }
  surrenderCurrentPlayer(): void { if (this.session.surrenderCurrentPlayer()) this.dispatchState(); }

  private onNodeClick(node: INode): void {
    if (this.session.isGameOver) return;
    if (!this.selectedCoord) {
      const active = node.ownedBy === this.session.currentPlayer && (node.state === NodeState.Active || node.state === NodeState.Core);
      if (!active) { this.dispatchError('Select one of your powered nodes.'); return; }
      const options = this.session.getLegalDestinations(node.coord, this.bridgeMode);
      if (!options.length) { this.dispatchError(this.bridgeMode ? 'This node has no valid Bridge destination.' : 'This node has no legal action.'); return; }
      this.selectedCoord = node.coord; this.updateHighlights(); this.dispatchState(); return;
    }
    if (Board.sameCoord(this.selectedCoord, node.coord)) { this.clearSelection(); this.dispatchState(); return; }
    const move: MoveDescriptor = { from: this.selectedCoord, to: node.coord, player: this.session.currentPlayer, action: this.bridgeMode ? 'Bridge' : undefined };
    const attempt = this.session.tryApplyMove(move);
    if (!attempt.validation.valid) { this.dispatchError(attempt.validation.reason ?? 'Invalid action.'); return; }
    this.bridgeMode = false; this.clearSelection(); this.redrawAll();
    if (attempt.result) {
      this.rendererFor(attempt.result.move.to)?.pulse();
      if (attempt.result.locked) this.rendererFor(attempt.result.locked)?.pulse();
      for (const coord of [...attempt.result.disconnected, ...attempt.result.reactivated]) this.rendererFor(coord)?.pulse();
    }
    this.dispatchState();
  }
  private onHover(node: INode, hovered: boolean): void {
    this.rendererFor(node.coord)?.setHovered(hovered);
    if (!hovered) { this.hoverRenderer.clear(); return; }
    if (this.selectedCoord && this.isHighlighted(node.coord)) this.hoverRenderer.showPreview(this.selectedCoord, node.coord, this.session.currentPlayer, this.bridgeMode);
  }
  private updateHighlights(): void {
    for (const renderer of this.nodeRenderers.values()) renderer.setDestination(null);
    if (!this.selectedCoord) return;
    this.rendererFor(this.selectedCoord)?.setSelected(true);
    for (const option of this.session.getLegalDestinations(this.selectedCoord, this.bridgeMode)) this.rendererFor(option.coord)?.setDestination(option.action as ActionType);
  }
  private isHighlighted(coord: GridCoord): boolean {
    return !!this.selectedCoord && this.session.getLegalDestinations(this.selectedCoord, this.bridgeMode).some(option => Board.sameCoord(option.coord, coord));
  }
  private clearSelection(): void {
    if (this.selectedCoord) this.rendererFor(this.selectedCoord)?.setSelected(false);
    this.selectedCoord = null; this.hoverRenderer.clear();
    for (const renderer of this.nodeRenderers.values()) renderer.setDestination(null);
  }
  private rebuildNodes(): void {
    this.nodeLayer.removeChildren().forEach(child => child.destroy()); this.interactionLayer.removeChildren().forEach(child => child.destroy()); this.nodeRenderers.clear();
    for (const node of this.session.board.allNodes()) {
      const renderer = new NodeRenderer(node); this.nodeRenderers.set(this.key(node.coord), renderer); this.nodeLayer.addChild(renderer.container);
      const target = new Graphics(); const p = gridToPixel(node.coord.col, node.coord.row);
      target.setFillStyle({ color: 0, alpha: HIT_ALPHA }).rect(p.x - CELL_SIZE / 2, p.y - CELL_SIZE / 2, CELL_SIZE, CELL_SIZE).fill();
      target.eventMode = 'static'; target.cursor = 'pointer';
      target.on('pointerover', () => this.onHover(node, true)); target.on('pointerout', () => this.onHover(node, false)); target.on('pointertap', () => this.onNodeClick(node));
      this.interactionLayer.addChild(target);
    }
  }
  private redrawAll(): void {
    this.connectionLayer.removeChildren().forEach(child => child.destroy());
    for (const edge of this.session.board.getConnections()) {
      const source = this.session.board.getNode(edge.from); const target = this.session.board.getNode(edge.to);
      const alpha = source.state === NodeState.Dormant || target.state === NodeState.Dormant ? 0.25 : 1;
      this.connectionLayer.addChild(new ConnectionRenderer(edge, alpha).gfx);
    }
    const breaches = this.session.getBreachOrigins();
    for (const node of this.session.board.allNodes()) { const renderer = this.rendererFor(node.coord); renderer?.setBreaches(node.ownedBy ? breaches[node.ownedBy].length : 0); renderer?.redraw(); }
  }
  private buildState(): GameStateDetail {
    const breachOrigins = this.session.getBreachOrigins();
    return { currentPlayer: this.session.currentPlayer, actionCount: this.session.actionCount, maxActions: this.session.config.maxActions,
      remainingActions: this.session.getRemainingActions(), bridgeCharges: this.session.getBridgeCharges(),
      breaches: { P1: breachOrigins.P1.length, P2: breachOrigins.P2.length }, selectedSource: this.selectedCoord ? { ...this.selectedCoord } : null,
      bridgeMode: this.bridgeMode, moveLog: this.session.getActionHistory(), canUndo: this.session.canUndo(), canSurrender: this.session.canSurrender(),
      winner: this.session.getWinner(), endReason: this.session.endReason, isGameOver: this.session.isGameOver };
  }
  private dispatchState(): void { window.dispatchEvent(new CustomEvent(GAME_STATE_EVENT, { detail: this.buildState() })); }
  private dispatchError(message: string): void { window.dispatchEvent(new CustomEvent(GAME_ERROR_EVENT, { detail: message })); }
  private rendererFor(coord: GridCoord): NodeRenderer | undefined { return this.nodeRenderers.get(this.key(coord)); }
  private key(coord: GridCoord): string { return `${coord.col},${coord.row}`; }
  private updateCanvasScale = (): void => {
    if (!this.app || !this.containerEl) return;
    const scale = Math.min(this.containerEl.clientWidth / this.baseCanvasWidth, this.containerEl.clientHeight / this.baseCanvasHeight);
    this.app.canvas.style.width = `${Math.floor(this.baseCanvasWidth * scale)}px`; this.app.canvas.style.height = `${Math.floor(this.baseCanvasHeight * scale)}px`;
  };
}
