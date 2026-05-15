import { Node } from './Node';
import { Connection } from './Connection';
import type { GridCoord, IConnection } from '../types';
import { ConnectionType, NodeType } from '../types';

export class Board {
  readonly cols: number;
  readonly rows: number;

  private readonly nodes: Node[][];
  private readonly connections: Map<string, Connection> = new Map();

  constructor(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
    this.nodes = Array.from({ length: rows }, (_, row) =>
      Array.from({ length: cols }, (_, col) => new Node({ col, row })),
    );
  }

  // ─── Node access ────────────────────────────────────────────────────────────

  getNode(coord: GridCoord): Node {
    if (!this.inBounds(coord)) {
      throw new RangeError(`Coord (${coord.col},${coord.row}) out of bounds`);
    }
    return this.nodes[coord.row][coord.col];
  }

  allNodes(): Node[] {
    return this.nodes.flat();
  }

  inBounds(coord: GridCoord): boolean {
    return (
      coord.col >= 0 &&
      coord.col < this.cols &&
      coord.row >= 0 &&
      coord.row < this.rows
    );
  }

  // ─── Connection access ───────────────────────────────────────────────────────

  getConnections(): IterableIterator<Connection> {
    return this.connections.values();
  }

  hasConnection(from: GridCoord, to: GridCoord): boolean {
    return this.connections.has(Connection.makeId(from, to));
  }

  hasReverseConnection(from: GridCoord, to: GridCoord): boolean {
    return this.connections.has(Connection.makeId(to, from));
  }

  // ─── Mutation ────────────────────────────────────────────────────────────────

  /**
   * Adds a connection and wires up both endpoint nodes.
   * For Bridge connections the crossing point does NOT get a node entry —
   * only the two declared endpoints are registered.
   */
  addConnection(connection: Connection): void {
    const id = connection.id;
    if (this.connections.has(id)) {
      throw new Error(`Connection ${id} already exists`);
    }
    this.connections.set(id, connection);

    const fromNode = this.getNode(connection.from);
    const toNode = this.getNode(connection.to);

    fromNode.outConnections.push(connection);
    toNode.inConnections.push(connection);
  }

  /** Removes a connection and unwires both endpoint nodes. */
  removeConnection(from: GridCoord, to: GridCoord): Connection | null {
    const id = Connection.makeId(from, to);
    const existing = this.connections.get(id);
    if (!existing) return null;

    this.connections.delete(id);

    const fromNode = this.getNode(from);
    const toNode = this.getNode(to);

    fromNode.outConnections = fromNode.outConnections.filter(c => c.id !== id);
    toNode.inConnections = toNode.inConnections.filter(c => c.id !== id);

    return existing;
  }

  /** Clears all topology and restores every node to an empty state. */
  reset(): void {
    this.connections.clear();
    for (const node of this.allNodes()) {
      node.type = NodeType.Empty;
      node.ownedBy = null;
      node.isOpeningSource = false;
      node.isOutBlocked = false;
      node.isBalanced = false;
      node.isTrapped = false;
      node.isPassthrough = false;
      node.diagonalBonus = 0;
      node.inConnections = [];
      node.outConnections = [];
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /** Returns all connections originating from a node. */
  outConnectionsOf(coord: GridCoord): IConnection[] {
    return this.getNode(coord).outConnections;
  }

  /** Returns all connections arriving at a node. */
  inConnectionsOf(coord: GridCoord): IConnection[] {
    return this.getNode(coord).inConnections;
  }

  /** Returns true if coord is adjacent (including diagonals) to another coord. */
  static isAdjacent(a: GridCoord, b: GridCoord): boolean {
    return Math.abs(a.col - b.col) <= 1 && Math.abs(a.row - b.row) <= 1 && !(a.col === b.col && a.row === b.row);
  }

  /** Returns true if the two coords are strictly diagonal (|dc|==1 && |dr|==1). */
  static isDiagonal(a: GridCoord, b: GridCoord): boolean {
    return Math.abs(a.col - b.col) === 1 && Math.abs(a.row - b.row) === 1;
  }

  /** Returns true if two coords are orthogonally adjacent. */
  static isOrthogonal(a: GridCoord, b: GridCoord): boolean {
    const dc = Math.abs(a.col - b.col);
    const dr = Math.abs(a.row - b.row);
    return (dc === 1 && dr === 0) || (dc === 0 && dr === 1);
  }

  /** Returns true if the connection skips at least one node (bridge range). */
  static isBridgeRange(a: GridCoord, b: GridCoord): boolean {
    const dc = Math.abs(a.col - b.col);
    const dr = Math.abs(a.row - b.row);
    return (dc === 2 && dr === 0) || (dc === 0 && dr === 2);
  }

  /** Derives the 8-way direction from `a` to `b`. Returns null if same node. */
  static directionBetween(a: GridCoord, b: GridCoord): import('../types').Direction | null {
    const dc = Math.sign(b.col - a.col);
    const dr = Math.sign(b.row - a.row);
    const map: Record<string, import('../types').Direction> = {
      '0,-1': 'N', '1,-1': 'NE', '1,0': 'E', '1,1': 'SE',
      '0,1': 'S', '-1,1': 'SW', '-1,0': 'W', '-1,-1': 'NW',
    };
    return map[`${dc},${dr}`] ?? null;
  }

  /** Returns true if the two coords are diagonally 2 apart (diagonal bridge range). */
  static isDiagonalBridge(a: GridCoord, b: GridCoord): boolean {
    return Math.abs(a.col - b.col) === 2 && Math.abs(a.row - b.row) === 2;
  }

  /** Returns the connection type that should be used between two coords. */
  static inferConnectionType(a: GridCoord, b: GridCoord): ConnectionType {
    if (Board.isDiagonal(a, b)) return ConnectionType.Diagonal;
    if (Board.isDiagonalBridge(a, b)) return ConnectionType.DiagonalBridge;
    if (Board.isBridgeRange(a, b)) return ConnectionType.Bridge;
    return ConnectionType.Normal;
  }
}
