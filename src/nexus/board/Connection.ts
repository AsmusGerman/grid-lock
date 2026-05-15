import type { GridCoord, IConnection, ConnectionType, PlayerID } from '../types';

export class Connection implements IConnection {
  readonly id: string;
  readonly from: GridCoord;
  readonly to: GridCoord;
  readonly type: ConnectionType;
  readonly player: PlayerID;

  constructor(
    from: GridCoord,
    to: GridCoord,
    type: ConnectionType,
    player: PlayerID,
  ) {
    this.from = from;
    this.to = to;
    this.type = type;
    this.player = player;
    this.id = Connection.makeId(from, to);
  }

  static makeId(from: GridCoord, to: GridCoord): string {
    return `${from.col},${from.row}->${to.col},${to.row}`;
  }
}
