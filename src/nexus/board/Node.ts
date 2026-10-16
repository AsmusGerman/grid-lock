import { NodeState } from '../types';
import type { GridCoord, IConnection, INode, PlayerID } from '../types';

export class Node implements INode {
  readonly coord: GridCoord;
  state = NodeState.Empty;
  ownedBy: PlayerID | null = null;
  isCore = false;
  inConnections: IConnection[] = [];
  outConnections: IConnection[] = [];
  constructor(coord: GridCoord) { this.coord = coord; }
  get inDegree(): number { return this.inConnections.length; }
  get outDegree(): number { return this.outConnections.length; }
  isStructural(): boolean { return this.state !== NodeState.Empty && this.state !== NodeState.Locked; }
}
