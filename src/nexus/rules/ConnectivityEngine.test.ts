import { describe, expect, it } from 'vitest';
import { Board } from '../board/Board';
import { Connection } from '../board/Connection';
import { ConnectionType, NodeState } from '../types';
import { ConnectivityEngine } from './ConnectivityEngine';

const coord = (col: number, row: number) => ({ col, row });
function board(): Board { const value = new Board(5, 5); value.claim(coord(0, 2), 'P1', true); value.claim(coord(4, 2), 'P2', true); return value; }
function connect(value: Board, from: ReturnType<typeof coord>, to: ReturnType<typeof coord>, player: 'P1' | 'P2' = 'P1') {
  if (value.getNode(to).state === NodeState.Empty) value.claim(to, player);
  value.addConnection(new Connection(from, to, ConnectionType.Normal, player));
}

describe('directed connectivity', () => {
  it('propagates through branches and terminates cycles', () => {
    const value = board(); connect(value, coord(0, 2), coord(1, 2)); connect(value, coord(1, 2), coord(2, 2)); connect(value, coord(1, 2), coord(1, 1)); connect(value, coord(2, 2), coord(1, 2));
    new ConnectivityEngine().recompute(value, 'P1');
    expect(value.getNode(coord(2, 2)).state).toBe(NodeState.Active); expect(value.getNode(coord(1, 1)).state).toBe(NodeState.Active);
  });
  it('disconnects downstream nodes when a critical node is locked', () => {
    const value = board(); connect(value, coord(0, 2), coord(1, 2)); connect(value, coord(1, 2), coord(2, 2)); connect(value, coord(2, 2), coord(3, 2));
    value.lock(coord(1, 2)); new ConnectivityEngine().recompute(value, 'P1');
    expect(value.getNode(coord(2, 2)).state).toBe(NodeState.Dormant); expect(value.getNode(coord(3, 2)).state).toBe(NodeState.Dormant); expect(value.allConnections()).toHaveLength(1);
  });
  it('preserves and restores power through an alternative directed path', () => {
    const value = board(); connect(value, coord(0, 2), coord(1, 2)); connect(value, coord(1, 2), coord(2, 2)); connect(value, coord(0, 2), coord(0, 1)); connect(value, coord(0, 1), coord(1, 1)); connect(value, coord(1, 1), coord(2, 1)); connect(value, coord(2, 1), coord(2, 2));
    value.lock(coord(1, 2)); new ConnectivityEngine().recompute(value, 'P1'); expect(value.getNode(coord(2, 2)).state).toBe(NodeState.Active);
    value.removeConnection(coord(2, 1), coord(2, 2)); new ConnectivityEngine().recompute(value, 'P1'); expect(value.getNode(coord(2, 2)).state).toBe(NodeState.Dormant);
    connect(value, coord(2, 1), coord(2, 2)); new ConnectivityEngine().recompute(value, 'P1'); expect(value.getNode(coord(2, 2)).state).toBe(NodeState.Active);
  });
});
