import type { GamePhase, PlayerID } from '../nexus/types';

interface ScorePanelProps {
  scores: Record<PlayerID, number>;
  phases: Record<PlayerID, GamePhase>;
  currentPlayer: PlayerID;
}

function phaseTitle(phase: GamePhase): string {
  if (phase === 'Placement') return 'Placement Phase';
  if (phase === 'Foundation') return 'Foundation Phase';
  return 'Expansion Phase';
}

export function ScorePanel(props: ScorePanelProps) {
  return (
    <section class="score-panel card">
      <h3>SCORE</h3>
      <p class="phase-title">{`Current phase: ${phaseTitle(props.phases[props.currentPlayer])}`}</p>
      <div class="score-grid">
        <div class="score-row p1">
          <span class="dot" />
          <span>{`P1: ${props.scores.P1}`}</span>
          <span class="phase-badge">{phaseTitle(props.phases.P1)}</span>
        </div>
        <div class="score-row p2">
          <span class="dot" />
          <span>{`P2: ${props.scores.P2}`}</span>
          <span class="phase-badge">{phaseTitle(props.phases.P2)}</span>
        </div>
      </div>
    </section>
  );
}