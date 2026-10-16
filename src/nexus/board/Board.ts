import { Connection } from './Connection';
import { Node } from './Node';
import { NodeState } from '../types';
import type { GridCoord, PlayerID } from '../types';

export class Board {
  readonly cols: number;
  readonly rows: number;
  private readonly nodes: Node[][];
  private readonly connections = new Map<string, Connection>();
  constructor(cols = 5, rows = 5) {
    this.cols = cols;
    this.rows = rows;
    this.nodes = Array.from({ length: rows }, (_, row) => Array.from({ length: cols }, (_, col) => new Node({ col, row })));
  }
  getNode(coord: GridCoord): Node {
    if (!this.inBounds(coord)) throw new RangeError(`Coord (${coord.col},${coord.row}) out of bounds`);
    return this.nodes[coord.row][coord.col];
  }
  allNodes(): Node[] { return this.nodes.flat(); }
  inBounds(coord: GridCoord): boolean { return coord.col >= 0 && coord.col < this.cols && coord.row >= 0 && coord.row < this.rows; }
  getConnections(): IterableIterator<Connection> { return this.connections.values(); }
  allConnections(): Connection[] { return [...this.connections.values()]; }
  hasConnection(from: GridCoord, to: GridCoord): boolean { return this.connections.has(Connection.makeId(from, to)); }
  addConnection(connection: Connection): void {
    if (this.connections.has(connection.id)) throw new Error(`Connection ${connection.id} already exists`);
    this.connections.set(connection.id, connection);
    this.getNode(connection.from).outConnections.push(connection);
    this.getNode(connection.to).inConnections.push(connection);
  }
  removeConnection(from: GridCoord, to: GridCoord): Connection | null {
    const id = Connection.makeId(from, to);
    const connection = this.connections.get(id);
    if (!connection) return null;
    this.connections.delete(id);
    this.getNode(from).outConnections = this.getNode(from).outConnections.filter(edge => edge.id !== id);
    this.getNode(to).inConnections = this.getNode(to).inConnections.filter(edge => edge.id !== id);
    return connection;
  }
  removeIncidentConnections(coord: GridCoord): void {
    const node = this.getNode(coord);
    for (const edge of [...node.inConnections, ...node.outConnections]) this.removeConnection(edge.from, edge.to);
  }
  claim(coord: GridCoord, player: PlayerID, core = false): Node {
    const node = this.getNode(coord);
    node.ownedBy = player;
    node.isCore = core;
    node.state = core ? NodeState.Core : NodeState.Active;
    return node;
  }
  lock(coord: GridCoord): void {
    const node = this.getNode(coord);
    if (node.isCore) throw new Error('A Core cannot be locked.');
    this.removeIncidentConnections(coord);
    node.ownedBy = null;
    node.state = NodeState.Locked;
  }
  clone(): Board {
    const copy = new Board(this.cols, this.rows);
    for (const node of this.allNodes()) {
      const target = copy.getNode(node.coord);
      target.state = node.state; target.ownedBy = node.ownedBy; target.isCore = node.isCore;
    }
    for (const edge of this.connections.values()) copy.addConnection(new Connection(edge.from, edge.to, edge.type, edge.player));
    return copy;
  }
  static isOrthogonal(a: GridCoord, b: GridCoord): boolean { return Math.abs(a.col - b.col) + Math.abs(a.row - b.row) === 1; }
  static isBridgeRange(a: GridCoord, b: GridCoord): boolean {
    const dc = Math.abs(a.col - b.col); const dr = Math.abs(a.row - b.row);
    return (dc === 2 && dr === 0) || (dc === 0 && dr === 2);
  }
  static middle(a: GridCoord, b: GridCoord): GridCoord { return { col: (a.col + b.col) / 2, row: (a.row + b.row) / 2 }; }
  static sameCoord(a: GridCoord, b: GridCoord): boolean { return a.col === b.col && a.row === b.row; }
}
