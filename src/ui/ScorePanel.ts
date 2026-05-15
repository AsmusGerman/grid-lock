import { Container, Graphics, Text } from 'pixi.js';
import { THEME } from '../rendering/theme';
import type { PlayerID } from '../nexus/types';

/**
 * Displays real-time scores for both players.
 * Redraws whenever scores are updated.
 */
export class ScorePanel {
  readonly container: Container;
  private readonly p1ScoreText: Text;
  private readonly p2ScoreText: Text;

  constructor(width = 300) {
    this.container = new Container();

    const panelW = width;
    const panelH = 74;

    const bg = new Graphics();
    bg.setFillStyle({ color: 0xF5F3EE, alpha: 0.92 });
    bg.setStrokeStyle({ width: 1, color: 0xD8D5CC });
    bg.roundRect(0, 0, panelW, panelH, 10).fill().stroke();
    this.container.addChild(bg);

    const title = new Text({
      text: 'SCORE',
      style: { fontSize: 12, fill: '#6A665F', fontWeight: 'bold', letterSpacing: 1 },
    });
    title.x = 14;
    title.y = 8;
    this.container.addChild(title);

    // Player 1
    const p1Dot = new Graphics();
    p1Dot.setFillStyle({ color: THEME.P1 });
    p1Dot.circle(18, 44, 6).fill();
    this.container.addChild(p1Dot);

    this.p1ScoreText = new Text({
      text: 'P1: 0',
      style: { fontSize: 14, fill: '#2D6A9F', fontWeight: 'bold' },
    });
    this.p1ScoreText.x = 30;
    this.p1ScoreText.y = 34;
    this.container.addChild(this.p1ScoreText);

    // Player 2
    const p2Dot = new Graphics();
    p2Dot.setFillStyle({ color: THEME.P2 });
    p2Dot.circle(panelW / 2 + 16, 44, 6).fill();
    this.container.addChild(p2Dot);

    this.p2ScoreText = new Text({
      text: 'P2: 0',
      style: { fontSize: 14, fill: '#C0392B', fontWeight: 'bold' },
    });
    this.p2ScoreText.x = panelW / 2 + 28;
    this.p2ScoreText.y = 34;
    this.container.addChild(this.p2ScoreText);
  }

  /** Call this reactively after every move. */
  update(scores: Record<PlayerID, number>): void {
    this.p1ScoreText.text = `P1: ${scores.P1}`;
    this.p2ScoreText.text = `P2: ${scores.P2}`;
  }
}
