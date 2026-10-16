import { NodeState } from '../types';
import type { Board } from '../board/Board';
import type { PlayerID, Winner } from '../types';

export function evaluateTurnLimit(board: Board, breaches: Record<PlayerID, number>): Winner {
  const compare = (p1: number, p2: number): Winner | null => p1 === p2 ? null : p1 > p2 ? 'P1' : 'P2';
  const breachWinner = compare(breaches.P2, breaches.P1);
  if (breachWinner) return breachWinner;
  const enemyHalf = (player: PlayerID) => board.allNodes().filter(node =>
    node.state === NodeState.Active && !node.isCore && node.ownedBy === player &&
    (player === 'P1' ? node.coord.col >= 3 : node.coord.col <= 1),
  ).length;
  const territoryWinner = compare(enemyHalf('P1'), enemyHalf('P2'));
  if (territoryWinner) return territoryWinner;
  const active = (player: PlayerID) => board.allNodes().filter(node => node.state === NodeState.Active && !node.isCore && node.ownedBy === player).length;
  return compare(active('P1'), active('P2')) ?? 'draw';
}
