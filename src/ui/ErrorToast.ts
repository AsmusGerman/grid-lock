import { Container, Graphics, Text } from 'pixi.js';

/**
 * Non-blocking toast shown when an invalid move is attempted.
 * Fades out after a short delay.
 */
export class ErrorToast {
  readonly container: Container;
  private readonly bg: Graphics;
  private readonly label: Text;
  private fadeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.container = new Container();
    this.container.alpha = 0;

    this.bg = new Graphics();
    this.bg.setFillStyle({ color: 0x222220, alpha: 0.85 });
    this.bg.roundRect(0, 0, 280, 36, 8).fill();
    this.container.addChild(this.bg);

    this.label = new Text({
      text: '',
      style: {
        fontSize: 12,
        fill: '#F5F3EE',
        wordWrap: true,
        wordWrapWidth: 260,
      },
    });
    this.label.x = 14;
    this.label.y = 10;
    this.container.addChild(this.label);
  }

  show(message: string): void {
    this.label.text = message;
    this.container.alpha = 1;

    if (this.fadeTimer) clearTimeout(this.fadeTimer);
    this.fadeTimer = setTimeout(() => {
      this.container.alpha = 0;
      this.fadeTimer = null;
    }, 2000);
  }
}
