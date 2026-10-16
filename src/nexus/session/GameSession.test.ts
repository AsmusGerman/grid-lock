import { describe, expect, it } from 'vitest';
import { Connection } from '../board/Connection';
import { ConnectionType, NodeState } from '../types';
import { GameSession } from './GameSession';
import { evaluateTurnLimit } from '../rules/VictoryEvaluator';
const c = (col: number, row: number) => ({ col, row });

describe('Siege Network actions', () => {
  it('starts with fixed Cores and expands with automatic turn advance', () => {
    const game = new GameSession(); expect(game.board.getNode(c(0, 2)).isCore).toBe(true); expect(game.currentPlayer).toBe('P1');
    const result = game.applyMove({ from: c(0, 2), to: c(1, 2), player: 'P1' });
    expect(result.action).toBe('Expand'); expect(game.board.getNode(c(1, 2)).state).toBe(NodeState.Active); expect(game.currentPlayer).toBe('P2');
  });
  it('rejects invalid actions without mutation', () => {
    const game = new GameSession(); const before = game.snapshot();
    expect(game.tryApplyMove({ from: c(0, 2), to: c(2, 2), player: 'P1' }).validation.valid).toBe(false);
    expect(game.snapshot()).toEqual(before); expect(game.board.allConnections()).toHaveLength(0);
  });
  it('reinforces in either direction and enforces outgoing capacity', () => {
    const game = new GameSession(); game.board.claim(c(1, 2), 'P1');
    game.board.addConnection(new Connection(c(0, 2), c(1, 2), ConnectionType.Normal, 'P1'));
    game.board.claim(c(0, 1), 'P1'); game.board.addConnection(new Connection(c(0, 2), c(0, 1), ConnectionType.Normal, 'P1'));
    game.board.claim(c(0, 3), 'P1'); game.board.addConnection(new Connection(c(0, 2), c(0, 3), ConnectionType.Normal, 'P1'));
    expect(game.validateMove({ from: c(0, 2), to: c(1, 2), player: 'P1' }).reason).toContain('capacity');
    expect(game.validateMove({ from: c(1, 2), to: c(0, 2), player: 'P1' }).action).toBe('Reinforce');
  });
  it('attacks without capturing and removes every incident edge', () => {
    const game = new GameSession(); game.board.claim(c(1, 2), 'P1'); game.board.claim(c(2, 2), 'P2');
    game.board.addConnection(new Connection(c(2, 2), c(2, 1), ConnectionType.Normal, 'P2')); game.board.claim(c(2, 1), 'P2');
    const result = game.applyMove({ from: c(1, 2), to: c(2, 2), player: 'P1' });
    expect(result.action).toBe('Attack'); expect(game.board.getNode(c(2, 2)).state).toBe(NodeState.Locked); expect(game.board.getNode(c(2, 2)).ownedBy).toBeNull(); expect(game.board.allConnections()).toHaveLength(0);
  });
  it('uses a Bridge charge only on success and locks an intermediate enemy', () => {
    const game = new GameSession(); game.board.claim(c(1, 2), 'P2');
    const invalid = game.tryApplyMove({ from: c(0, 2), to: c(2, 1), player: 'P1', action: 'Bridge' }); expect(invalid.validation.valid).toBe(false); expect(game.getBridgeCharges().P1).toBe(2);
    const result = game.applyMove({ from: c(0, 2), to: c(2, 2), player: 'P1', action: 'Bridge' });
    expect(result.action).toBe('Bridge'); expect(game.getBridgeCharges().P1).toBe(1); expect(game.board.getNode(c(1, 2)).state).toBe(NodeState.Locked);
  });
  it('requires two Breaches from unique origins and then freezes the game', () => {
    const game = new GameSession();
    for (const point of [c(1, 2), c(2, 2), c(3, 2), c(2, 1), c(3, 1), c(4, 1)]) game.board.claim(point, 'P1');
    for (const [from, to] of [[c(0, 2), c(1, 2)], [c(1, 2), c(2, 2)], [c(2, 2), c(3, 2)], [c(2, 2), c(2, 1)], [c(2, 1), c(3, 1)], [c(3, 1), c(4, 1)]] as const) {
      game.board.addConnection(new Connection(from, to, ConnectionType.Normal, 'P1'));
    }
    game.applyMove({ from: c(3, 2), to: c(4, 2), player: 'P1' });
    game.applyMove({ from: c(4, 2), to: c(4, 3), player: 'P2' });
    expect(game.validateMove({ from: c(3, 2), to: c(4, 2), player: 'P1' }).valid).toBe(false);
    game.applyMove({ from: c(4, 1), to: c(4, 2), player: 'P1' }); expect(game.getWinner()).toBe('P1'); expect(game.endReason).toBe('core-breach');
    expect(game.validateMove({ from: c(0, 2), to: c(0, 1), player: 'P2' }).valid).toBe(false);
  });
  it('undo restores graph resources and turn state', () => {
    const game = new GameSession(); game.applyMove({ from: c(0, 2), to: c(2, 2), player: 'P1', action: 'Bridge' });
    expect(game.undoLastMove()).toBe(true); expect(game.currentPlayer).toBe('P1'); expect(game.actionCount).toBe(0); expect(game.getBridgeCharges().P1).toBe(2); expect(game.board.getNode(c(2, 2)).state).toBe(NodeState.Empty);
  });
  it('awards victory when the next player begins with no legal action', () => {
    const game = new GameSession();
    const core = game.board.getNode(c(4, 2));
    core.outConnections.push(
      new Connection(c(4, 2), c(3, 2), ConnectionType.Normal, 'P2'),
      new Connection(c(4, 2), c(4, 1), ConnectionType.Normal, 'P2'),
      new Connection(c(4, 2), c(4, 3), ConnectionType.Normal, 'P2'),
    );
    game.applyMove({ from: c(0, 2), to: c(0, 1), player: 'P1' });
    expect(game.getWinner()).toBe('P1'); expect(game.endReason).toBe('no-legal-action');
  });
});

describe('turn-limit tiebreaks', () => {
  it('uses breaches, enemy territory, active nodes, then draw', () => {
    const game = new GameSession(); expect(evaluateTurnLimit(game.board, { P1: 0, P2: 1 })).toBe('P1');
    game.board.claim(c(3, 0), 'P1'); expect(evaluateTurnLimit(game.board, { P1: 0, P2: 0 })).toBe('P1');
    const tied = new GameSession(); tied.board.claim(c(2, 0), 'P1'); tied.board.claim(c(2, 4), 'P2'); expect(evaluateTurnLimit(tied.board, { P1: 0, P2: 0 })).toBe('draw');
  });
});
