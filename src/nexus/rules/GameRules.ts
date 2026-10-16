import type { GridCoord, PlayerID } from '../types';
export const GAME_RULES = {
  cols: 5, rows: 5, maxActionsPerPlayer: 10, maxActions: 20, bridgeCharges: 2,
  normalOutgoingCapacity: 2, coreOutgoingCapacity: 3,
  cores: { P1: { col: 0, row: 2 }, P2: { col: 4, row: 2 } } satisfies Record<PlayerID, GridCoord>,
} as const;
export function opponent(player: PlayerID): PlayerID { return player === 'P1' ? 'P2' : 'P1'; }
