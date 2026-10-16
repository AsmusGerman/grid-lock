import { Container, Graphics, Text } from 'pixi.js';
import { NodeState } from '../nexus/types';
import { THEME, gridToPixel } from './theme';
import type { ActionType, INode } from '../nexus/types';

const ACTION_LABEL: Record<ActionType, string> = { Expand: '+', Reinforce: '↻', Attack: '!', Bridge: 'B', Breach: '⚡' };

export class NodeRenderer {
  readonly container = new Container();
  private readonly gfx = new Graphics();
  private readonly label = new Text({ text: '', style: { fontSize: 10, fill: '#FFFFFF', fontWeight: 'bold', align: 'center' } });
  private selected = false;
  private hovered = false;
  private destination: ActionType | null = null;
  private breaches = 0;

  constructor(private readonly node: INode) {
    this.label.anchor.set(0.5);
    this.container.addChild(this.gfx, this.label);
    const { x, y } = gridToPixel(node.coord.col, node.coord.row);
    this.container.position.set(x, y);
    this.container.eventMode = 'none';
    this.redraw();
  }
  setSelected(value: boolean): void { this.selected = value; this.redraw(); }
  setHovered(value: boolean): void { this.hovered = value; this.redraw(); }
  setDestination(action: ActionType | null): void { this.destination = action; this.redraw(); }
  setBreaches(value: number): void { this.breaches = value; this.redraw(); }
  pulse(): void {
    if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const started = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - started) / 220, 1);
      this.container.scale.set(1 + Math.sin(progress * Math.PI) * 0.18);
      if (progress < 1) requestAnimationFrame(animate);
      else this.container.scale.set(1);
    };
    requestAnimationFrame(animate);
  }
  redraw(): void {
    const g = this.gfx; g.clear();
    const empty = this.node.state === NodeState.Empty;
    const locked = this.node.state === NodeState.Locked;
    const dormant = this.node.state === NodeState.Dormant;
    const core = this.node.isCore;
    const radius = core ? 19 : empty ? THEME.nodeEmptyRadius : 13;
    const playerColor = this.node.ownedBy ? THEME[this.node.ownedBy] : THEME.nodeEmpty;
    const fill = locked ? 0x5F6470 : playerColor;
    if (this.hovered || this.destination) {
      g.setFillStyle({ color: this.destination ? 0xF2CC8F : fill, alpha: this.destination ? 0.42 : 0.2 });
      g.circle(0, 0, radius + 9).fill();
    }
    if (this.destination) {
      g.setStrokeStyle({ width: 3, color: 0xF0A500, alpha: 0.95 }); g.circle(0, 0, radius + 7).stroke();
    }
    if (this.selected) {
      g.setStrokeStyle({ width: 4, color: THEME.nodeSelectedRing }); g.circle(0, 0, radius + 8).stroke();
    }
    if (dormant) {
      g.setStrokeStyle({ width: 2, color: playerColor, alpha: 0.85 }); g.circle(0, 0, radius).stroke();
      g.setFillStyle({ color: fill, alpha: 0.2 }); g.circle(0, 0, radius - 2).fill();
    } else {
      g.setFillStyle({ color: fill, alpha: empty ? 0.8 : 1 }); g.circle(0, 0, radius).fill();
      if (!empty) { g.setStrokeStyle({ width: core ? 4 : 2, color: 0x303247 }); g.circle(0, 0, radius).stroke(); }
    }
    if (locked) {
      g.setStrokeStyle({ width: 3, color: 0xFFFFFF });
      g.moveTo(-8, -8).lineTo(8, 8).stroke(); g.moveTo(-8, 8).lineTo(8, -8).stroke();
    }
    if (core) {
      for (let i = 0; i < 2; i++) {
        g.setFillStyle({ color: i < this.breaches ? 0xF2CC8F : 0xFFFFFF, alpha: i < this.breaches ? 1 : 0.45 });
        g.circle(-5 + i * 10, 25, 3).fill();
      }
    }
    this.label.text = this.destination ? ACTION_LABEL[this.destination] : core ? 'CORE' : dormant ? '○' : '';
    this.label.style.fontSize = core ? 7 : 10;
    this.label.style.fill = locked ? '#FFFFFF' : dormant ? '#303247' : '#FFFFFF';
  }
}
