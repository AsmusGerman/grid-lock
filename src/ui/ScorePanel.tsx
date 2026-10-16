import type { GameStateDetail } from '../nexus/events';
interface Props { state: GameStateDetail }
export function ScorePanel(props: Props) {
  const marks = (count: number) => `${count >= 1 ? '●' : '○'} ${count >= 2 ? '●' : '○'}`;
  return (
    <section class="score-panel card" aria-label="Player resources">
      <div class="players-row">
        <div class="player-row p1">
          <span class="player-tag">P1</span>
          <span class="resource-value" title="Actions remaining">{props.state.remainingActions.P1}A</span>
          <span class="resource-value" title="Bridge charges">{props.state.bridgeCharges.P1}B</span>
          <span class="breach-marks" title="Damage to P1 Core">{marks(props.state.breaches.P1)}</span>
        </div>
        <div class="player-row p2">
          <span class="player-tag">P2</span>
          <span class="resource-value" title="Actions remaining">{props.state.remainingActions.P2}A</span>
          <span class="resource-value" title="Bridge charges">{props.state.bridgeCharges.P2}B</span>
          <span class="breach-marks" title="Damage to P2 Core">{marks(props.state.breaches.P2)}</span>
        </div>
      </div>
      <div class="hud-legend"><span>A actions</span><span>B bridges</span><span>● core breaches</span></div>
    </section>
  );
}
