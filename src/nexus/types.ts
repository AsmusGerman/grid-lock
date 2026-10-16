export type PlayerID = 'P1' | 'P2';
export type Winner = PlayerID | 'draw';
export interface GridCoord { col: number; row: number }

export enum NodeState { Empty = 'Empty', Active = 'Active', Dormant = 'Dormant', Locked = 'Locked', Core = 'Core' }
export enum ConnectionType { Normal = 'Normal', Bridge = 'Bridge' }
export type ActionType = 'Expand' | 'Reinforce' | 'Attack' | 'Bridge' | 'Breach';
export type EndReason = 'core-breach' | 'no-legal-action' | 'turn-limit' | 'surrender';

export interface IPlayer { id: PlayerID; name: string; color: number }
export interface IConnection { id: string; from: GridCoord; to: GridCoord; type: ConnectionType; player: PlayerID }
export interface INode {
  coord: GridCoord;
  state: NodeState;
  ownedBy: PlayerID | null;
  isCore: boolean;
  inConnections: IConnection[];
  outConnections: IConnection[];
}
export interface MoveDescriptor { from: GridCoord; to: GridCoord; player: PlayerID; action?: ActionType }
export interface ValidationResult { valid: boolean; reason?: string; action?: ActionType }
export interface ActionResult {
  action: ActionType;
  move: MoveDescriptor;
  connection?: IConnection;
  locked?: GridCoord;
  reactivated: GridCoord[];
  disconnected: GridCoord[];
  winner: Winner | null;
}
export interface MoveLogEntry { player: PlayerID; label: string }
export interface SessionSnapshot {
  currentPlayer: PlayerID;
  actionCount: number;
  actionsByPlayer: Record<PlayerID, number>;
  bridgeCharges: Record<PlayerID, number>;
  breachOrigins: Record<PlayerID, GridCoord[]>;
  winner: Winner | null;
  endReason: EndReason | null;
}
