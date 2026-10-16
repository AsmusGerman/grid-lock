import { NodeState } from '../types';
import type { Board } from '../board/Board';
import type { GridCoord, PlayerID } from '../types';
export interface ConnectivityChange { reactivated: GridCoord[]; disconnected: GridCoord[] }
export class ConnectivityEngine {
  recompute(board: Board, player: PlayerID): ConnectivityChange {
    const before = new Map(board.allNodes().map(node => [`${node.coord.col},${node.coord.row}`, node.state]));
    const core = board.allNodes().find(node => node.isCore && node.ownedBy === player);
    if (!core) throw new Error(`Missing ${player} Core.`);
    const reached = new Set<string>();
    const queue = [core];
    while (queue.length) {
      const node = queue.shift()!;
      const key = `${node.coord.col},${node.coord.row}`;
      if (reached.has(key)) continue;
      reached.add(key);
      for (const edge of node.outConnections) {
        if (edge.player !== player) continue;
        const target = board.getNode(edge.to);
        if (target.ownedBy === player && target.state !== NodeState.Locked) queue.push(target);
      }
    }
    const reactivated: GridCoord[] = []; const disconnected: GridCoord[] = [];
    for (const node of board.allNodes()) {
      if (node.ownedBy !== player || node.isCore) continue;
      const key = `${node.coord.col},${node.coord.row}`;
      node.state = reached.has(key) ? NodeState.Active : NodeState.Dormant;
      if (before.get(key) === NodeState.Dormant && node.state === NodeState.Active) reactivated.push(node.coord);
      if (before.get(key) === NodeState.Active && node.state === NodeState.Dormant) disconnected.push(node.coord);
    }
    core.state = NodeState.Core;
    return { reactivated, disconnected };
  }
  recomputeAll(board: Board): ConnectivityChange {
    const a = this.recompute(board, 'P1'); const b = this.recompute(board, 'P2');
    return { reactivated: [...a.reactivated, ...b.reactivated], disconnected: [...a.disconnected, ...b.disconnected] };
  }
}
