import { Board } from '../board/Board';
import { Connection } from '../board/Connection';
import { classifyNode } from '../rules/HubClassifier';
import { ConnectionValidator } from '../rules/ConnectionValidator';
import { ScoringEngine } from '../rules/ScoringEngine';
import { Player } from './Player';
import type {
  GamePhase,
  GridCoord,
  INode,
  MoveDescriptor,
  MoveAppliedEvent,
  PlayerID,
  ValidationResult,
} from '../types';
import { ConnectionType, NodeType } from '../types';

export type GameSessionListener = (event: MoveAppliedEvent) => void;

export interface GameConfig {
  cols: number;
  rows: number;
  maxTurns: number;
}

interface TurnState {
  player: PlayerID;
  moves: MoveDescriptor[];
}

/**
 * Central game session: owns the board, enforces rules, advances turns,
 * and notifies listeners after each successful move.
 */
export class GameSession {
  readonly board: Board;
  readonly players: Record<PlayerID, Player>;
  readonly config: GameConfig;

  private readonly validator = new ConnectionValidator();
  readonly scoring = new ScoringEngine();

  private _currentPlayer: PlayerID = 'P1';
  private _turnCount = 0;
  private _endedByNoMoves = false;
  private _forcedWinner: PlayerID | 'draw' | null = null;

  /** Tracks whether each player has placed their source node during the Placement phase. */
  private _sourcePlaced: Record<PlayerID, boolean> = { P1: false, P2: false };

  /** Stores placement coords so they can be replayed during undo/rebuild. */
  private _placementLog: { player: PlayerID; coord: GridCoord }[] = [];

  /** High-water mark: once a phase is reached it cannot regress. */
  private _peakPhase: Record<PlayerID, GamePhase> = { P1: 'Placement', P2: 'Placement' };

  /** Turn-based move container used for ready/undo flow. */
  private readonly turns: TurnState[] = [{ player: 'P1', moves: [] }];
  private readonly movesByPlayer: Record<PlayerID, number> = { P1: 0, P2: 0 };

  private lastScores: Record<PlayerID, number> = { P1: 0, P2: 0 };

  private readonly listeners: GameSessionListener[] = [];

  constructor(config: GameConfig) {
    this.config = config;
    this.board = new Board(config.cols, config.rows);
    this.players = {
      P1: new Player('P1', 'Player 1', 0x2D6A9F),
      P2: new Player('P2', 'Player 2', 0xC0392B),
    };
  }

  // ─── State accessors ─────────────────────────────────────────────────────────

  get currentPlayer(): PlayerID {
    return this._currentPlayer;
  }

  get turnCount(): number {
    return this._turnCount;
  }

  get isGameOver(): boolean {
    return this._turnCount >= this.config.maxTurns || this._endedByNoMoves;
  }

  /** True while either player still needs to place their source node. */
  get isPlacementPhase(): boolean {
    return !this._sourcePlaced.P1 || !this._sourcePlaced.P2;
  }

  // ─── Placement phase ────────────────────────────────────────────────────────

  /**
   * Place the source node during Phase 0 (Placement).
   * Single-click on an empty cell to claim it as your source.
   * Auto-advances to the next player (or starts the game if both placed).
   */
  placeSource(coord: GridCoord, player: PlayerID): ValidationResult {
    if (!this.isPlacementPhase) {
      return { valid: false, reason: 'Placement phase is over.' };
    }
    if (player !== this._currentPlayer) {
      return { valid: false, reason: 'It is not this player\u0027s turn.' };
    }
    if (this._sourcePlaced[player]) {
      return { valid: false, reason: 'You have already placed your source.' };
    }
    if (!this.board.inBounds(coord)) {
      return { valid: false, reason: 'Node is out of bounds.' };
    }
    const node = this.board.getNode(coord);
    if (node.type !== NodeType.Empty || node.ownedBy !== null) {
      return { valid: false, reason: 'You must place your source on an empty node.' };
    }

    // Claim the node
    node.ownedBy = player;
    node.type = NodeType.Source;
    node.isOpeningSource = true;
    this._sourcePlaced[player] = true;
    this._placementLog.push({ player, coord });

    // Advance to next player or start the game
    if (this.isPlacementPhase) {
      // Other player still needs to place
      this._currentPlayer = this._currentPlayer === 'P1' ? 'P2' : 'P1';
    }
    // If both placed, _currentPlayer is back to P1 and game begins

    return { valid: true };
  }

  getWinner(): PlayerID | 'draw' | null {
    if (!this.isGameOver) return null;

    // Always use score comparison first, regardless of how the game ended.
    const scores = this.getScores();
    if (scores.P1 > scores.P2) return 'P1';
    if (scores.P2 > scores.P1) return 'P2';

    // Tiebreak: more owned nodes.
    const owned = this.scoring.ownedNodeCount(this.board);
    if (owned.P1 > owned.P2) return 'P1';
    if (owned.P2 > owned.P1) return 'P2';

    // Still tied but ended by no-moves: the player who ran out loses.
    if (this._forcedWinner) return this._forcedWinner;

    return 'draw';
  }

  surrenderCurrentPlayer(): boolean {
    if (this.isGameOver) return false;
    this.endBySurrender(this._currentPlayer);
    this.lastScores = this.scoring.compute(this.board);
    return true;
  }

  getLegalMoveCount(player: PlayerID): number {
    const phase = this.getPhase(player);
    const requiresCircuitConnection = this.movesByPlayer[player] > 0;
    const requireSourceOwnership = true;

    let legalCount = 0;

    for (let fromRow = 0; fromRow < this.board.rows; fromRow++) {
      for (let fromCol = 0; fromCol < this.board.cols; fromCol++) {
        const from = { col: fromCol, row: fromRow };

        for (let toRow = 0; toRow < this.board.rows; toRow++) {
          for (let toCol = 0; toCol < this.board.cols; toCol++) {
            if (fromCol === toCol && fromRow === toRow) continue;

            const to = { col: toCol, row: toRow };
            const move: MoveDescriptor = {
              from,
              to,
              connectionType: Board.inferConnectionType(from, to),
              player,
            };

            if (requiresCircuitConnection && !this.isConnectedToCircuit(move)) {
              continue;
            }

            const validation = this.validator.validate(
              this.board,
              move,
              phase,
              requireSourceOwnership,
            );
            if (validation.valid) {
              legalCount++;
            }
          }
        }
      }
    }

    return legalCount;
  }

  /** Count how many distinct source nodes the player can act from. */
  getActionableNodeCount(player: PlayerID): number {
    const phase = this.getPhase(player);
    const requiresCircuitConnection = this.movesByPlayer[player] > 0;
    const requireSourceOwnership = true;

    let count = 0;

    for (let fromRow = 0; fromRow < this.board.rows; fromRow++) {
      for (let fromCol = 0; fromCol < this.board.cols; fromCol++) {
        const from = { col: fromCol, row: fromRow };
        let hasMove = false;

        for (let toRow = 0; toRow < this.board.rows && !hasMove; toRow++) {
          for (let toCol = 0; toCol < this.board.cols && !hasMove; toCol++) {
            if (fromCol === toCol && fromRow === toRow) continue;

            const to = { col: toCol, row: toRow };
            const move: MoveDescriptor = {
              from,
              to,
              connectionType: Board.inferConnectionType(from, to),
              player,
            };

            if (requiresCircuitConnection && !this.isConnectedToCircuit(move)) {
              continue;
            }

            const validation = this.validator.validate(
              this.board,
              move,
              phase,
              requireSourceOwnership,
            );
            if (validation.valid) {
              hasMove = true;
            }
          }
        }

        if (hasMove) count++;
      }
    }

    return count;
  }

  /**
   * Returns the current game phase for a player.
   * Placement: source not yet placed.
   * Foundation: < 4 owned nodes.  Expansion: ≥ 4 owned nodes.
   * Once a phase is reached it never regresses.
   */
  getPhase(player: PlayerID): GamePhase {
    if (!this._sourcePlaced[player]) return 'Placement';
    const ownedCount = this.board.allNodes().filter(
      n => n.ownedBy === player && !n.isTrapped,
    ).length;
    const computed = ownedCount >= 4 ? 'Expansion' : 'Foundation';

    // Advance high-water mark if computed phase is higher
    const rank: Record<GamePhase, number> = { Placement: 0, Foundation: 1, Expansion: 2 };
    if (rank[computed] > rank[this._peakPhase[player]]) {
      this._peakPhase[player] = computed;
    }
    return this._peakPhase[player];
  }

  /** Returns the current phase for both players. */
  getPhases(): Record<PlayerID, GamePhase> {
    return { P1: this.getPhase('P1'), P2: this.getPhase('P2') };
  }

  canPlayMove(): boolean {
    if (this.isGameOver) return false;
    if (this.isPlacementPhase) return false;
    return this.activeTurn().moves.length === 0;
  }

  canFinishTurn(): boolean {
    if (this.isGameOver) return false;
    return this.activeTurn().moves.length === 1;
  }

  canUndo(): boolean {
    if (this.isGameOver) return false;
    return this.activeTurn().moves.length > 0;
  }

  // ─── Move entry point ────────────────────────────────────────────────────────

  validateMove(move: MoveDescriptor): ValidationResult {
    if (this.isGameOver) {
      return { valid: false, reason: 'The game is over.' };
    }
    if (move.player !== this._currentPlayer) {
      return { valid: false, reason: 'It is not this player\'s turn.' };
    }
    if (!this.canPlayMove()) {
      return { valid: false, reason: 'Only one move per turn is allowed. Press Ready or Undo.' };
    }

    const requireSourceOwnership = true;
    const coreValidation = this.validator.validate(
      this.board,
      move,
      this.getPhase(move.player),
      requireSourceOwnership,
    );
    if (!coreValidation.valid) {
      return coreValidation;
    }

    const requiresCircuitConnection = this.movesByPlayer[move.player] > 0;
    if (requiresCircuitConnection && !this.isConnectedToCircuit(move)) {
      return {
        valid: false,
        reason: 'After your opening move, every new vector must connect to your existing circuit.',
      };
    }

    return { valid: true };
  }

  applyMove(move: MoveDescriptor): MoveAppliedEvent {
    const validation = this.validateMove(move);
    if (!validation.valid) {
      throw new Error(`Invalid move: ${validation.reason}`);
    }

    const { connection, affectedNodes } = this.applyConnectionToBoard(move);

    this.turns[this.turns.length - 1].moves.push(move);
    this.movesByPlayer[move.player]++;

    // Recompute dynamic node states after each move:
    // 1) trapped outbound blocks
    // 2) balanced hubs
    this.recomputeOutboundBlocks();

    // After ownership may have shifted (conquest), check if the opponent
    // still has a legal move. If not, end the game immediately so the
    // current player doesn't need to press Ready.
    const opponent: PlayerID = move.player === 'P1' ? 'P2' : 'P1';
    if (!this.hasAnyLegalMove(opponent)) {
      this.endByNoMoves();
    }

    this.lastScores = this.scoring.compute(this.board);
    const event: MoveAppliedEvent = {
      move,
      connection,
      affectedNodes,
      scores: this.lastScores,
      currentPlayer: this._currentPlayer,
    };

    for (const listener of this.listeners) {
      listener(event);
    }

    return event;
  }

  finishTurn(): { scores: Record<PlayerID, number>; currentPlayer: PlayerID } | null {
    if (!this.canFinishTurn()) {
      return null;
    }

    this._turnCount++;

    if (!this.isGameOver) {
      this._currentPlayer = this._currentPlayer === 'P1' ? 'P2' : 'P1';
      this.turns.push({ player: this._currentPlayer, moves: [] });

      // If the incoming player has no legal move, the match ends immediately.
      if (!this.hasAnyLegalMove(this._currentPlayer)) {
        this.endByNoMoves();
      }
    }

    this.lastScores = this.scoring.compute(this.board);
    return { scores: this.lastScores, currentPlayer: this._currentPlayer };
  }

  undoLastMove(): boolean {
    const turn = this.activeTurn();
    if (!turn || turn.moves.length === 0) {
      return false;
    }

    turn.moves.pop();
    this.rebuildFromTurns();
    return true;
  }

  getScores(): Record<PlayerID, number> {
    return this.lastScores;
  }

  /** Flattened chronological move history used by the UI move log. */
  getMoveHistory(): MoveDescriptor[] {
    return this.turns.flatMap(turn => turn.moves);
  }

  // ─── Event subscription ──────────────────────────────────────────────────────

  onMoveApplied(listener: GameSessionListener): void {
    this.listeners.push(listener);
  }

  offMoveApplied(listener: GameSessionListener): void {
    const idx = this.listeners.indexOf(listener);
    if (idx !== -1) this.listeners.splice(idx, 1);
  }

  private recomputeOutboundBlocks(): void {
    for (const node of this.board.allNodes()) {
      node.isOutBlocked = node.isTrapped;
      node.isBalanced = false;
    }

    // Balanced nodes cannot create outbound vectors, but may still receive input.
    for (const node of this.board.allNodes()) {
      if (node.isTrapped) continue;
      if (node.type === NodeType.Empty) continue;
      node.isBalanced = node.inDegree > 0 && node.inDegree === node.outDegree;
    }
  }

  /**
   * Updates node ownership based on vector counts.
   * Player with more vectors (in + out) owns the node.
   * If equal, node is neutral (ownedBy = null).
   */
  private updateNodeOwnershipByVectors(node: INode): void {
    const p1Vectors = (
      node.inConnections.filter(c => c.player === 'P1').length +
      node.outConnections.filter(c => c.player === 'P1').length
    );
    const p2Vectors = (
      node.inConnections.filter(c => c.player === 'P2').length +
      node.outConnections.filter(c => c.player === 'P2').length
    );

    // Only apply contest logic when both players have vectors here.
    // If only one player has vectors, they simply own the node.
    const isContested = p1Vectors > 0 && p2Vectors > 0;

    if (!isContested) {
      node.ownedBy = p1Vectors > 0 ? 'P1' : p2Vectors > 0 ? 'P2' : null;
      return;
    }

    // Contested: majority owns it; equal vectors = neutral.
    if (p1Vectors > p2Vectors) {
      node.ownedBy = 'P1';
    } else if (p2Vectors > p1Vectors) {
      node.ownedBy = 'P2';
    } else {
      node.ownedBy = null;
    }
  }

  private applyConnectionToBoard(move: MoveDescriptor): { connection: Connection; affectedNodes: INode[] } {
    const connection = new Connection(move.from, move.to, move.connectionType, move.player);
    this.board.addConnection(connection);

    const affectedNodes: INode[] = [
      this.board.getNode(move.from),
      this.board.getNode(move.to),
    ];

    if (move.connectionType === ConnectionType.Bridge || move.connectionType === ConnectionType.DiagonalBridge) {
      const middleCoord = ConnectionValidator.bridgeMiddle(move.from, move.to);
      if (middleCoord) {
        const middleNode = this.board.getNode(middleCoord);
        const fromNode = this.board.getNode(move.from);

        // Source-hub bridge: middle becomes passthrough (blocked but not trapped).
        // Non-Source bridge: middle is trapped (opponent node captured).
        if (fromNode.type === NodeType.Source || fromNode.isOpeningSource) {
          middleNode.isPassthrough = true;
          middleNode.isOutBlocked = true;
          affectedNodes.push(middleNode);
        } else {
          middleNode.isTrapped = true;
          middleNode.isOutBlocked = true;
          affectedNodes.push(middleNode);
        }
      }
    }

    // Ownership first (vector majority), then classify.
    // classifyNode filters by owner, so ownership must be resolved before type.
    for (const node of affectedNodes) {
      this.updateNodeOwnershipByVectors(node);
    }

    for (const node of affectedNodes) {
      node.type = classifyNode(node);
    }

    // Diagonal bonus: +1 to the origin node (regardless of hub type).
    if (move.connectionType === ConnectionType.Diagonal) {
      this.board.getNode(move.from).diagonalBonus++;
    }

    return { connection, affectedNodes };
  }

  private rebuildFromTurns(): void {
    this.board.reset();
    this.movesByPlayer.P1 = 0;
    this.movesByPlayer.P2 = 0;
    this._endedByNoMoves = false;
    this._forcedWinner = null;
    this._sourcePlaced = { P1: false, P2: false };
    this._peakPhase = { P1: 'Placement', P2: 'Placement' };

    // Replay source placements
    for (const placement of this._placementLog) {
      const node = this.board.getNode(placement.coord);
      node.ownedBy = placement.player;
      node.type = NodeType.Source;
      node.isOpeningSource = true;
      this._sourcePlaced[placement.player] = true;
    }

    for (const turn of this.turns) {
      for (const move of turn.moves) {
        this.applyConnectionToBoard(move);
        this.movesByPlayer[move.player]++;
      }
    }

    this.recomputeOutboundBlocks();
    this.lastScores = this.scoring.compute(this.board);

    // Re-derive peak phases from replayed board state
    this.getPhase('P1');
    this.getPhase('P2');

    const activeTurn = this.turns[this.turns.length - 1];
    this._currentPlayer = activeTurn.player;
  }

  private activeTurn(): TurnState {
    return this.turns[this.turns.length - 1];
  }

  private isConnectedToCircuit(move: MoveDescriptor): boolean {
    const fromNode = this.board.getNode(move.from);
    const toNode = this.board.getNode(move.to);
    // Must touch the player’s own circuit (not just any non-empty node).
    return fromNode.ownedBy === move.player || toNode.ownedBy === move.player;
  }

  private hasAnyLegalMove(player: PlayerID): boolean {
    return this.getLegalMoveCount(player) > 0;
  }

  /** End the game because a player has no legal moves. Winner decided by score. */
  endByNoMoves(): void {
    this._endedByNoMoves = true;
  }

  /** End the game because a player explicitly surrendered. Opponent wins. */
  private endBySurrender(loser: PlayerID): void {
    this._endedByNoMoves = true;
    this._forcedWinner = loser === 'P1' ? 'P2' : 'P1';
  }
}
