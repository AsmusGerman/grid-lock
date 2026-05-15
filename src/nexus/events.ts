import type { GamePhase, MoveLogEntry, PlayerID } from './types';

export const GAME_STATE_EVENT = 'game:state';
export const GAME_ERROR_EVENT = 'game:error';

export interface GameStateDetail {
	currentPlayer: PlayerID;
	turnCount: number;
	maxTurns: number;
	actionableNodes: number;
	scores: Record<PlayerID, number>;
	phases: Record<PlayerID, GamePhase>;
	moveLog: MoveLogEntry[];
	canUndo: boolean;
	canReady: boolean;
	canSurrender: boolean;
	winner: PlayerID | 'draw' | null;
	isGameOver: boolean;
}

declare global {
	interface WindowEventMap {
		[GAME_STATE_EVENT]: CustomEvent<GameStateDetail>;
		[GAME_ERROR_EVENT]: CustomEvent<string>;
	}
}
