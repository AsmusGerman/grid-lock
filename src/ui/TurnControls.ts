import { Container, Graphics, Text } from 'pixi.js';

interface ControlButton {
  container: Container;
  gfx: Graphics;
  label: Text;
}

export class TurnControls {
  readonly container: Container;
  private readonly undo: ControlButton;
  private readonly ready: ControlButton;

  constructor(onUndo: () => void, onReady: () => void, width = 300) {
    this.container = new Container();

    this.undo = this.createButton('Undo Last', 0xE8E5DE, '#333330', width / 2 - 6, 0);
    this.undo.container.on('pointertap', onUndo);

    this.ready = this.createButton('Ready', 0x2D6A9F, '#FFFFFF', width / 2 - 6, width / 2 + 6);
    this.ready.container.on('pointertap', onReady);

    this.container.addChild(this.undo.container);
    this.container.addChild(this.ready.container);

    this.setState(false, false);
  }

  setState(canUndo: boolean, canReady: boolean): void {
    this.applyEnabled(this.undo, canUndo, 0xE8E5DE, '#333330');
    this.applyEnabled(this.ready, canReady, 0x2D6A9F, '#FFFFFF');
  }

  private createButton(
    text: string,
    fill: number,
    color: string,
    width: number,
    x: number,
  ): ControlButton {
    const h = 38;

    const container = new Container();
    container.x = x;
    container.eventMode = 'static';
    container.cursor = 'pointer';

    const gfx = new Graphics();
    gfx.setFillStyle({ color: fill });
    gfx.setStrokeStyle({ width: 1, color: 0xC8C5BC });
    gfx.roundRect(0, 0, width, h, 8).fill().stroke();

    const label = new Text({
      text,
      style: {
        fontSize: 12,
        fill: color,
        fontWeight: 'bold',
      },
    });
    label.anchor.set(0.5);
    label.x = width / 2;
    label.y = h / 2;

    container.addChild(gfx);
    container.addChild(label);

    return { container, gfx, label };
  }

  private applyEnabled(
    button: ControlButton,
    enabled: boolean,
    fill: number,
    color: string,
  ): void {
    button.container.eventMode = enabled ? 'static' : 'none';
    button.container.cursor = enabled ? 'pointer' : 'default';
    button.container.alpha = enabled ? 1 : 0.45;

    button.gfx.clear();
    button.gfx.setFillStyle({ color: enabled ? fill : 0xD8D5CC });
    button.gfx.setStrokeStyle({ width: 1, color: 0xC8C5BC });
    const width = button.label.x * 2;
    const height = button.label.y * 2;
    button.gfx.roundRect(0, 0, width, height, 8).fill().stroke();

    button.label.style.fill = enabled ? color : '#7F7A70';
  }
}
