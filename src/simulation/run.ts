import { GameSession } from '../nexus/session/GameSession';
import type { MoveDescriptor, PlayerID } from '../nexus/types';

declare const process: { argv: string[]; env: Record<string, string | undefined> };

interface Metrics {
  games: number; p1Wins: number; p2Wins: number; draws: number; totalActions: number;
  coreVictories: number; turnLimits: number; noActionEndings: number; bridgeUses: number;
  expansions: number; attacks: number; disconnectedNodes: number; earlyVictories: number;
}

function rng(seed: number): () => number {
  let state = seed >>> 0;
  return () => { state += 0x6D2B79F5; let value = state; value = Math.imul(value ^ value >>> 15, value | 1); value ^= value + Math.imul(value ^ value >>> 7, value | 61); return ((value ^ value >>> 14) >>> 0) / 4294967296; };
}

function choose(moves: MoveDescriptor[], random: () => number, player: PlayerID, heuristic: boolean): MoveDescriptor {
  if (!heuristic) return moves[Math.floor(random() * moves.length)];
  const score = (move: MoveDescriptor) => {
    const distance = player === 'P1' ? move.to.col : 4 - move.to.col;
    return (move.action === 'Bridge' ? 5 : 0) + distance * 2 + random();
  };
  return [...moves].sort((a, b) => score(b) - score(a))[0];
}

export function simulate(games = 1000, seed = 20261016): Metrics {
  const random = rng(seed);
  const metrics: Metrics = { games, p1Wins: 0, p2Wins: 0, draws: 0, totalActions: 0, coreVictories: 0, turnLimits: 0, noActionEndings: 0, bridgeUses: 0, expansions: 0, attacks: 0, disconnectedNodes: 0, earlyVictories: 0 };
  for (let game = 0; game < games; game++) {
    const session = new GameSession();
    while (!session.isGameOver) {
      const moves = session.getLegalMoves();
      if (!moves.length) break;
      const move = choose(moves, random, session.currentPlayer, game % 2 === 1);
      const targetBefore = session.board.getNode(move.to);
      const result = session.applyMove(move);
      if (result.action === 'Bridge') metrics.bridgeUses++;
      if (result.action === 'Expand' || result.action === 'Bridge') metrics.expansions++;
      if (result.action === 'Attack' || (result.action === 'Bridge' && result.locked)) metrics.attacks++;
      metrics.disconnectedNodes += result.disconnected.length;
      void targetBefore;
    }
    const snapshot = session.snapshot(); metrics.totalActions += snapshot.actionCount;
    if (snapshot.winner === 'P1') metrics.p1Wins++; else if (snapshot.winner === 'P2') metrics.p2Wins++; else metrics.draws++;
    if (snapshot.endReason === 'core-breach') metrics.coreVictories++;
    if (snapshot.endReason === 'turn-limit') metrics.turnLimits++;
    if (snapshot.endReason === 'no-legal-action') metrics.noActionEndings++;
    if (snapshot.actionCount <= 10 && snapshot.winner !== 'draw') metrics.earlyVictories++;
  }
  return metrics;
}

const args = typeof process !== 'undefined' ? process.argv.slice(2) : [];
if (args.length || (typeof process !== 'undefined' && process.env.npm_lifecycle_event === 'simulate')) {
  const games = Number(args.find(arg => arg.startsWith('--games='))?.split('=')[1] ?? 1000);
  const seed = Number(args.find(arg => arg.startsWith('--seed='))?.split('=')[1] ?? 20261016);
  const result = simulate(games, seed);
  console.log(JSON.stringify({ seed, ...result, averageActions: result.totalActions / result.games, p1WinRate: result.p1Wins / result.games }, null, 2));
}
