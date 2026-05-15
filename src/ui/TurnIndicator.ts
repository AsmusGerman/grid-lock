import { Container, Graphics, Text } from 'pixi.js';
import { THEME } from '../rendering/theme';
import type { PlayerID } from '../nexus/types';

/**
 * Banner at the top of the screen showing whose turn it is.
 * Redraws with the active player's colour on every turn change.
 */
export class TurnIndicator {
  readonly container: Container;
  private readonly bar: Graphics;
  private readonly label: Text;
  private readonly turnCountLabel: Text;
  private readonly width: number;

  constructor(private readonly maxTurns: number, width = 300) {
    this.container = new Container();
    this.width = width;

    this.bar = new Graphics();
    this.container.addChild(this.bar);

    this.label = new Text({
      text: '',
      style: {
        fontSize: 13,
        fill: '#FFFFFF',
        fontWeight: 'bold',
        letterSpacing: 1,
      },
    });
    this.label.anchor.set(0.5, 0.5);
    this.container.addChild(this.label);

    this.turnCountLabel = new Text({
      text: '',
      style: {
        fontSize: 11,
        fill: '#FFFFFF',
      },
    });
    this.turnCountLabel.alpha = 0.75;
    this.turnCountLabel.anchor.set(1, 0.5);
    this.container.addChild(this.turnCountLabel);
  }

  /** Call after every move with the new active player and turn number. */
  update(currentPlayer: PlayerID, turnCount: number): void {
    const w = this.width;
    const h = 42;

    this.bar.clear();
    const color = currentPlayer === 'P1' ? THEME.P1 : THEME.P2;
    this.bar.setFillStyle({ color });
    this.bar.roundRect(0, 0, w, h, 8).fill();

    this.label.text = currentPlayer === 'P1' ? 'Player 1 turn' : 'Player 2 turn';
    this.label.x = w / 2;
    this.label.y = h / 2;

    this.turnCountLabel.text = `Turn ${turnCount} / ${this.maxTurns}`;
    this.turnCountLabel.x = w - 12;
    this.turnCountLabel.y = h / 2;
  }

  showGameOver(winner: PlayerID | 'draw'): void {
    const w = this.width;
    const h = 42;

    this.bar.clear();
    this.bar.setFillStyle({ color: 0x444440 });
    this.bar.roundRect(0, 0, w, h, 8).fill();

    if (winner === 'draw') {
      this.label.text = 'Game Over - Draw';
    } else {
      const name = winner === 'P1' ? 'Player 1' : 'Player 2';
      this.label.text = `Game Over - ${name} wins`;
    }
    this.label.x = w / 2;
    this.label.y = h / 2;
    this.turnCountLabel.text = '';
  }
}
