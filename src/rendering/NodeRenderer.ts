import { Container, Graphics, Text } from 'pixi.js';
import { NodeType } from '../nexus/types';
import { nodeTypeScore } from '../nexus/rules/HubClassifier';
import { THEME, gridToPixel } from './theme';
import type { INode } from '../nexus/types';

/**
 * Renders a single node.  Each node gets its own Container so it can be
 * efficiently redrawn in-place when topology changes.
 */
export class NodeRenderer {
  readonly container: Container;
  private readonly circleGfx: Graphics;
  private readonly pointsLabel: Text;
  private isSelected = false;
  private isHovered = false;

  constructor(private readonly node: INode) {
    this.container = new Container();
    this.circleGfx = new Graphics();
    this.pointsLabel = new Text({
      text: '',
      style: {
        fontSize: THEME.labelFontSize,
        fill: THEME.labelColor,
        fontWeight: 'bold',
        align: 'center',
      },
    });
    this.pointsLabel.anchor.set(0.5);

    this.container.addChild(this.circleGfx);
    this.container.addChild(this.pointsLabel);

    const { x, y } = gridToPixel(node.coord.col, node.coord.row);
    this.container.x = x;
    this.container.y = y;

    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';

    this.redraw();
  }

  setSelected(selected: boolean): void {
    this.isSelected = selected;
    this.redraw();
  }

  setHovered(hovered: boolean): void {
    this.isHovered = hovered;
    this.redraw();
  }

  /** Called after topology changes to reflect new NodeType and ownership. */
  redraw(): void {
    const g = this.circleGfx;
    g.clear();

    const isEmpty = this.node.type === NodeType.Empty;
    const radius = isEmpty ? THEME.nodeEmptyRadius : THEME.nodeHubRadius;
    const fillColor = this.node.ownedBy
      ? (THEME as unknown as Record<string, number>)[this.node.ownedBy]
      : THEME.nodeEmpty;

    // Hover ring
    if (this.isHovered) {
      g.setFillStyle({ color: fillColor, alpha: 0.25 });
      g.circle(0, 0, radius + 8).fill();
    }

    // Selection ring
    if (this.isSelected) {
      g.setStrokeStyle({ width: THEME.nodeSelectedRingWidth, color: THEME.nodeSelectedRing });
      g.circle(0, 0, radius + 6).stroke();
    }

    // Hub border ring
    if (!isEmpty) {
      g.setStrokeStyle({ width: THEME.nodeHubBorderWidth, color: THEME.nodeHubBorder });
      g.circle(0, 0, radius).stroke();
    }

    // Opening-source marker ring to show each player's starting node.
    if (this.node.isOpeningSource) {
      g.setStrokeStyle({ width: 2, color: 0xF4E7A1 });
      g.circle(0, 0, radius + 10).stroke();
    }

    // Node fill
    g.setFillStyle({ color: fillColor });
    g.circle(0, 0, radius).fill();

    // Blocking marker: outbound moves from this hub are forbidden.
    if (this.node.isOutBlocked || this.node.isTrapped || this.node.isPassthrough) {
      const r = radius + 4;
      g.setStrokeStyle({ width: 2, color: 0xF2F2EE });
      g.moveTo(-r, -r).lineTo(r, r).stroke();
      g.moveTo(-r, r).lineTo(r, -r).stroke();
    }

    this.pointsLabel.text = this.nodePointsText(isEmpty);
    this.pointsLabel.style.fontSize = THEME.labelFontSize;
  }

  private nodePointsText(isEmpty: boolean): string {
    if (isEmpty) return '';
    if (this.node.isTrapped) return 'X';
    if (this.node.isBalanced || this.node.type === NodeType.Relay) return '0';
    const base = nodeTypeScore(this.node.type);
    const total = base + this.node.diagonalBonus;
    return total > 0 ? String(total) : '0';
  }
}
