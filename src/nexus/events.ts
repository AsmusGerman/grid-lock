import type { EndReason, GridCoord, MoveLogEntry, PlayerID, Winner } from './types';
export const GAME_STATE_EVENT = 'game:state';
export const GAME_ERROR_EVENT = 'game:error';
export interface GameStateDetail {
  currentPlayer: PlayerID;
  actionCount: number;
  maxActions: number;
  remainingActions: Record<PlayerID, number>;
  bridgeCharges: Record<PlayerID, number>;
  breaches: Record<PlayerID, number>;
  selectedSource: GridCoord | null;
  bridgeMode: boolean;
  moveLog: MoveLogEntry[];
  canUndo: boolean;
  canSurrender: boolean;
  winner: Winner | null;
  endReason: EndReason | null;
  isGameOver: boolean;
}
declare global {
  interface WindowEventMap {
    [GAME_STATE_EVENT]: CustomEvent<GameStateDetail>;
    [GAME_ERROR_EVENT]: CustomEvent<string>;
  }
}
