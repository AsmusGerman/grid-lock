import type { IPlayer, PlayerID } from '../types';

export class Player implements IPlayer {
  readonly id: PlayerID;
  readonly name: string;
  readonly color: number;

  constructor(id: PlayerID, name: string, color: number) {
    this.id = id;
    this.name = name;
    this.color = color;
  }
}
