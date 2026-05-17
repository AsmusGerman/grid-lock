import type { GamePhase, PlayerID } from '../nexus/types';
import { uiText } from '../content/uiText';

interface ScorePanelProps {
  scores: Record<PlayerID, number>;
  phases: Record<PlayerID, GamePhase>;
  currentPlayer: PlayerID;
}

function phaseBadge(phase: GamePhase): string {
  if (phase === 'Placement') return uiText.scorePanel.phases.placement;
  if (phase === 'Foundation') return uiText.scorePanel.phases.foundation;
  return uiText.scorePanel.phases.expansion;
}

export function ScorePanel(props: ScorePanelProps) {
  return (
    <section class="score-panel card">
      <div class="players-row">
        <div class="player-row p1">
          <span class="player-tag">{uiText.scorePanel.players.p1}</span>
          <span class="player-score-inline">{props.scores.P1}</span>
          <span class="phase-badge">{phaseBadge(props.phases.P1)}</span>
        </div>
        <div class="player-row p2">
          <span class="player-tag">{uiText.scorePanel.players.p2}</span>
          <span class="player-score-inline">{props.scores.P2}</span>
          <span class="phase-badge">{phaseBadge(props.phases.P2)}</span>
        </div>
      </div>
    </section>
  );
}
