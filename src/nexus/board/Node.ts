import { NodeType } from '../types';
import type { GridCoord, IConnection, INode, PlayerID } from '../types';

export class Node implements INode {
  readonly coord: GridCoord;
  type: NodeType;
  ownedBy: PlayerID | null;
  isOpeningSource: boolean;
  isOutBlocked: boolean;
  isBalanced: boolean;
  isTrapped: boolean;
  isPassthrough: boolean;
  diagonalBonus: number;
  inConnections: IConnection[];
  outConnections: IConnection[];

  constructor(coord: GridCoord) {
    this.coord = coord;
    this.type = NodeType.Empty;
    this.ownedBy = null;
    this.isOpeningSource = false;
    this.isOutBlocked = false;
    this.isBalanced = false;
    this.isTrapped = false;
    this.isPassthrough = false;
    this.diagonalBonus = 0;
    this.inConnections = [];
    this.outConnections = [];
  }

  get inDegree(): number {
    return this.inConnections.length;
  }

  get outDegree(): number {
    return this.outConnections.length;
  }

  isStructural(): boolean {
    return this.type !== NodeType.Empty;
  }
}
