import { Board } from '../board/Board';
import { Connection } from '../board/Connection';
import { ConnectionType, NodeState } from '../types';
import { ConnectivityEngine } from '../rules/ConnectivityEngine';
import { ConnectionValidator } from '../rules/ConnectionValidator';
import { GAME_RULES, opponent } from '../rules/GameRules';
import { evaluateTurnLimit } from '../rules/VictoryEvaluator';
import type { ActionResult, EndReason, GridCoord, MoveDescriptor, MoveLogEntry, PlayerID, SessionSnapshot, ValidationResult, Winner } from '../types';

interface UndoState {
  board: Board;
  currentPlayer: PlayerID;
  actionCount: number;
  actionsByPlayer: Record<PlayerID, number>;
  bridgeCharges: Record<PlayerID, number>;
  breachOrigins: Record<PlayerID, GridCoord[]>;
  winner: Winner | null;
  endReason: EndReason | null;
  history: MoveLogEntry[];
}

export class GameSession {
  board: Board;
  readonly config = GAME_RULES;
  private readonly validator = new ConnectionValidator();
  private readonly connectivity = new ConnectivityEngine();
  private _currentPlayer: PlayerID = 'P1';
  private _actionCount = 0;
  private _actionsByPlayer: Record<PlayerID, number> = { P1: 0, P2: 0 };
  private _bridgeCharges: Record<PlayerID, number> = { P1: GAME_RULES.bridgeCharges, P2: GAME_RULES.bridgeCharges };
  private _breachOrigins: Record<PlayerID, GridCoord[]> = { P1: [], P2: [] };
  private _winner: Winner | null = null;
  private _endReason: EndReason | null = null;
  private history: MoveLogEntry[] = [];
  private undoState: UndoState | null = null;

  constructor() {
    this.board = new Board(GAME_RULES.cols, GAME_RULES.rows);
    this.board.claim(GAME_RULES.cores.P1, 'P1', true);
    this.board.claim(GAME_RULES.cores.P2, 'P2', true);
  }

  get currentPlayer(): PlayerID { return this._currentPlayer; }
  get actionCount(): number { return this._actionCount; }
  get turnCount(): number { return this._actionCount; }
  get isGameOver(): boolean { return this._winner !== null; }
  get endReason(): EndReason | null { return this._endReason; }
  getWinner(): Winner | null { return this._winner; }
  getActionsByPlayer(): Record<PlayerID, number> { return { ...this._actionsByPlayer }; }
  getRemainingActions(): Record<PlayerID, number> {
    return { P1: GAME_RULES.maxActionsPerPlayer - this._actionsByPlayer.P1, P2: GAME_RULES.maxActionsPerPlayer - this._actionsByPlayer.P2 };
  }
  getBridgeCharges(): Record<PlayerID, number> { return { ...this._bridgeCharges }; }
  getBreachOrigins(): Record<PlayerID, GridCoord[]> { return { P1: [...this._breachOrigins.P1], P2: [...this._breachOrigins.P2] }; }
  getActionHistory(): MoveLogEntry[] { return [...this.history]; }
  canUndo(): boolean { return this.undoState !== null; }
  canSurrender(): boolean { return !this.isGameOver; }

  validateMove(move: MoveDescriptor): ValidationResult {
    if (this.isGameOver) return { valid: false, reason: 'The match is over.' };
    if (move.player !== this._currentPlayer) return { valid: false, reason: `It is ${this._currentPlayer}'s turn.` };
    return this.validator.validate(this.board, move, this.validationContext());
  }

  applyMove(move: MoveDescriptor): ActionResult {
    const validation = this.validateMove(move);
    if (!validation.valid || !validation.action) throw new Error(validation.reason ?? 'Invalid action.');
    this.undoState = this.captureUndo();
    const before = new Map(this.board.allNodes().map(node => [`${node.coord.col},${node.coord.row}`, node.state]));
    const action = validation.action;
    let connection: Connection | undefined;
    let locked: GridCoord | undefined;

    if (action === 'Expand' || action === 'Reinforce') {
      if (action === 'Expand') this.board.claim(move.to, move.player);
      connection = new Connection(move.from, move.to, ConnectionType.Normal, move.player);
      this.board.addConnection(connection);
    } else if (action === 'Attack') {
      this.board.lock(move.to); locked = move.to;
    } else if (action === 'Bridge') {
      this.board.claim(move.to, move.player);
      connection = new Connection(move.from, move.to, ConnectionType.Bridge, move.player);
      this.board.addConnection(connection);
      const middleCoord = Board.middle(move.from, move.to);
      const middle = this.board.getNode(middleCoord);
      if (middle.ownedBy === opponent(move.player) && !middle.isCore) { this.board.lock(middleCoord); locked = middleCoord; }
      this._bridgeCharges[move.player]--;
    } else {
      const coreOwner = opponent(move.player);
      this._breachOrigins[coreOwner].push({ ...move.from });
      if (this._breachOrigins[coreOwner].length === 2) { this._winner = move.player; this._endReason = 'core-breach'; }
    }

    const changes = this.connectivity.recomputeAll(this.board);
    this._actionCount++;
    this._actionsByPlayer[move.player]++;
    this.history.push({ player: move.player, label: this.actionLabel(action, move, locked) });

    if (!this.isGameOver && this._actionCount >= GAME_RULES.maxActions) this.resolveTurnLimit();
    if (!this.isGameOver) {
      this._currentPlayer = opponent(move.player);
      if (this.getLegalMoves(this._currentPlayer).length === 0) {
        this._winner = move.player; this._endReason = 'no-legal-action';
      }
    }

    const changed = this.board.allNodes().filter(node => before.get(`${node.coord.col},${node.coord.row}`) !== node.state);
    const reactivated = changes.reactivated;
    const disconnected = changes.disconnected;
    for (const node of changed) {
      if (node.state === NodeState.Active && !reactivated.some(c => Board.sameCoord(c, node.coord))) reactivated.push(node.coord);
    }
    return { action, move, connection, locked, reactivated, disconnected, winner: this._winner };
  }

  tryApplyMove(move: MoveDescriptor): { validation: ValidationResult; result?: ActionResult } {
    const validation = this.validateMove(move);
    return validation.valid ? { validation, result: this.applyMove(move) } : { validation };
  }

  getLegalMoves(player: PlayerID = this._currentPlayer): MoveDescriptor[] {
    if (this.isGameOver) return [];
    return this.validator.legalMoves(this.board, player, this.validationContext());
  }
  getLegalDestinations(from: GridCoord, bridgeMode = false): Array<{ coord: GridCoord; action: string }> {
    return this.getLegalMoves().filter(move => Board.sameCoord(move.from, from) && (bridgeMode ? move.action === 'Bridge' : move.action !== 'Bridge')).map(move => {
      const result = this.validator.validate(this.board, move, this.validationContext());
      return { coord: move.to, action: result.action ?? '' };
    });
  }
  getAvailableActionSourceCount(player: PlayerID): number {
    return new Set(this.getLegalMoves(player).map(move => `${move.from.col},${move.from.row}`)).size;
  }
  undoLastMove(): boolean {
    if (!this.undoState) return false;
    const state = this.undoState;
    this.board = state.board; this._currentPlayer = state.currentPlayer; this._actionCount = state.actionCount;
    this._actionsByPlayer = state.actionsByPlayer; this._bridgeCharges = state.bridgeCharges;
    this._breachOrigins = state.breachOrigins; this._winner = state.winner; this._endReason = state.endReason;
    this.history = state.history; this.undoState = null;
    return true;
  }
  surrenderCurrentPlayer(): boolean {
    if (this.isGameOver) return false;
    this.undoState = this.captureUndo(); this._winner = opponent(this._currentPlayer); this._endReason = 'surrender';
    this.history.push({ player: this._currentPlayer, label: 'Surrendered' }); return true;
  }
  snapshot(): SessionSnapshot {
    return { currentPlayer: this._currentPlayer, actionCount: this._actionCount, actionsByPlayer: this.getActionsByPlayer(), bridgeCharges: this.getBridgeCharges(), breachOrigins: this.getBreachOrigins(), winner: this._winner, endReason: this._endReason };
  }

  private validationContext() { return { bridgeCharges: this._bridgeCharges, breachOrigins: this._breachOrigins }; }
  private captureUndo(): UndoState {
    return { board: this.board.clone(), currentPlayer: this._currentPlayer, actionCount: this._actionCount,
      actionsByPlayer: { ...this._actionsByPlayer }, bridgeCharges: { ...this._bridgeCharges },
      breachOrigins: this.getBreachOrigins(), winner: this._winner, endReason: this._endReason, history: [...this.history] };
  }
  private resolveTurnLimit(): void {
    this._winner = evaluateTurnLimit(this.board, { P1: this._breachOrigins.P1.length, P2: this._breachOrigins.P2.length });
    this._endReason = 'turn-limit';
  }
  private actionLabel(action: string, move: MoveDescriptor, locked?: GridCoord): string {
    const coord = (value: GridCoord) => `${String.fromCharCode(65 + value.col)}${value.row + 1}`;
    const suffix = locked ? `; locked ${coord(locked)}` : '';
    return `${action} ${coord(move.from)} → ${coord(move.to)}${suffix}`;
  }
}
