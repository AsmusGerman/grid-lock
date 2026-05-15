import { Container, Graphics, Text } from 'pixi.js';

/**
 * Side legend describing hub types, connection semantics and key move rules.
 */
export class HintPanel {
  readonly container: Container;

  constructor() {
    this.container = new Container();
    this.build();
  }

  private build(): void {
    const panelW = 300;
    const panelH = 470;

    const bg = new Graphics();
    bg.setFillStyle({ color: 0xFBF9F4, alpha: 0.98 });
    bg.setStrokeStyle({ width: 1, color: 0xD8D5CC });
    bg.roundRect(0, 0, panelW, panelH, 10).fill().stroke();
    this.container.addChild(bg);

    const title = new Text({
      text: 'NEXUS GUIDE',
      style: {
        fontSize: 16,
        fill: '#333330',
        fontWeight: 'bold',
        letterSpacing: 1,
      },
    });
    title.x = 18;
    title.y = 16;
    this.container.addChild(title);

    const legendText = [
      'Connections',
      '- Adjacent orthogonal: Normal',
      '- Adjacent diagonal: Diagonal (hub ↔ hub only)',
      '- Bridge: distance 2 orthogonal only',
      '- Bridge traps 1 opponent hub in the middle',
      '- Opening move is free for each player',
      '- After opening, moves must touch the circuit',
      '',
      'Hub Types',
      '- Source: 0 in / >=1 out',
      '- Dead-end: >=1 in / 0 out',
      '- Relay: 1 in / 1 out',
      '- Fork: 1 in / >=2 out',
      '- Join: >=2 in / 1 out',
      '- Reactor: >=2 in / >=2 out',
      '',
      'Rule Hints',
      '- Nodes shown as circles with point numbers',
      '- Balanced hubs cannot output until a new input arrives',
      '- Trapped hubs are marked with X and are unplayable',
      '- If the next player has no legal move, game ends',
      '- Trapped hubs are nulled for points (score 0)',
      '- END node can only go out to adjacent nodes',
      '- Reverse direction on same pair is forbidden',
      '- Hub ownership is permanent once acquired',
      '- Score uses hub imbalance: |in - out|',
    ].join('\n');

    const body = new Text({
      text: legendText,
      style: {
        fontSize: 12,
        fill: '#4B4944',
        lineHeight: 18,
        wordWrap: true,
        wordWrapWidth: panelW - 36,
      },
    });
    body.x = 18;
    body.y = 48;
    this.container.addChild(body);
  }
}
