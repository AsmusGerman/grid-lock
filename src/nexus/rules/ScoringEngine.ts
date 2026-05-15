import { NodeType } from '../types';
import type { PlayerID } from '../types';
import type { Board } from '../board/Board';
import { nodeTypeScore } from './HubClassifier';

/**
 * Computes player scores from the current board state.
 *
 * Score per node:
 *   - Trapped / Empty / Balanced / Relay → 0
 *   - Otherwise: nodeTypeScore(type) + diagonalBonus
 *
 * nodeTypeScore: SRC=1, END=1, FRK=3, JON=3, RCT=5
 * diagonalBonus: +1 for each Diagonal connection that originated from this node.
 *
 * Tiebreak (handled by callers): more owned nodes wins; then draw.
 */
export class ScoringEngine {
  compute(board: Board): Record<PlayerID, number> {
    const scores: Record<PlayerID, number> = { P1: 0, P2: 0 };

    for (const node of board.allNodes()) {
      if (node.isTrapped) continue;
      if (node.type === NodeType.Empty || node.ownedBy === null) continue;
      if (node.isBalanced) continue;        // balanced (includes Relay 1:1) → 0 pts
      if (node.type === NodeType.Relay) continue; // transitional state → 0 pts

      scores[node.ownedBy] += nodeTypeScore(node.type) + node.diagonalBonus;
    }

    return scores;
  }

  /** Owned-node count used for tiebreaking. */
  ownedNodeCount(board: Board): Record<PlayerID, number> {
    const counts: Record<PlayerID, number> = { P1: 0, P2: 0 };
    for (const node of board.allNodes()) {
      if (node.ownedBy !== null && !node.isTrapped) {
        counts[node.ownedBy]++;
      }
    }
    return counts;
  }
}

