// ─── Player IDs ───────────────────────────────────────────────────────────────

export type PlayerID = 'P1' | 'P2';

// ─── Game phases ─────────────────────────────────────────────────────────────

/** Placement: source not yet placed. Foundation: < 4 owned nodes. Expansion: ≥ 4 owned nodes. Per-player. */
export type GamePhase = 'Placement' | 'Foundation' | 'Expansion';

// ─── Connection types ─────────────────────────────────────────────────────────

export enum ConnectionType {
  Normal = 'Normal',
  Diagonal = 'Diagonal',
  Bridge = 'Bridge',
  DiagonalBridge = 'DiagonalBridge',
}

// ─── Node classification ──────────────────────────────────────────────────────

export enum NodeType {
  Empty = 'Empty',       // 0 in / 0 out
  Source = 'Source',     // 0 in / ≥1 out
  DeadEnd = 'DeadEnd',   // ≥1 in / 0 out
  Relay = 'Relay',       // 1 in / 1 out
  Fork = 'Fork',         // 1 in / ≥2 out
  Join = 'Join',         // ≥2 in / 1 out
  Reactor = 'Reactor',   // ≥2 in / ≥2 out
}

// ─── Cardinal direction ───────────────────────────────────────────────────────

/** 8-directional compass used for consecutive-move tracking. */
export type Direction =
  | 'N' | 'NE' | 'E' | 'SE'
  | 'S' | 'SW' | 'W' | 'NW';

// ─── Grid coordinate ──────────────────────────────────────────────────────────

export interface GridCoord {
  col: number; // 0-based column index
  row: number; // 0-based row index
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IPlayer {
  id: PlayerID;
  name: string;
  color: number; // hex colour for PixiJS
}

export interface IConnection {
  id: string;
  from: GridCoord;
  to: GridCoord;
  type: ConnectionType;
  player: PlayerID;
}

export interface INode {
  coord: GridCoord;
  type: NodeType;
  ownedBy: PlayerID | null;
  isOpeningSource: boolean;
  isOutBlocked: boolean;
  isBalanced: boolean;
  isTrapped: boolean;
  /** Node lies under a length-2 vector and cannot be used as source or destination. */
  isPassthrough: boolean;
  /** Cumulative +1 bonus per Diagonal connection placed from this node. */
  diagonalBonus: number;
  inConnections: IConnection[];
  outConnections: IConnection[];
}

// ─── Move descriptor ──────────────────────────────────────────────────────────

export interface MoveDescriptor {
  from: GridCoord;
  to: GridCoord;
  connectionType: ConnectionType;
  player: PlayerID;
}

// ─── Validation result ────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export interface MoveAppliedEvent {
  move: MoveDescriptor;
  connection: IConnection;
  affectedNodes: INode[];
  scores: Record<PlayerID, number>;
  currentPlayer: PlayerID;
}

export interface GameOverEvent {
  scores: Record<PlayerID, number>;
  winner: PlayerID | 'draw';
}

// ─── Move log entry ───────────────────────────────────────────────────────────

export interface MoveLogEntry {
  player: PlayerID;
  label: string;
}
