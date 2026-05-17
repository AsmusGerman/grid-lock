import type { GameStateDetail } from '../nexus/events';
import { uiText } from '../content/uiText';

interface TurnIndicatorProps {
  state: GameStateDetail;
}

function turnClass(state: GameStateDetail): string {
  if (state.winner) return 'turn-banner over';
  return state.currentPlayer === 'P1' ? 'turn-banner p1' : 'turn-banner p2';
}

function activeTag(state: GameStateDetail): string {
  if (state.winner === 'P1') return 'P1';
  if (state.winner === 'P2') return 'P2';
  if (state.winner === 'draw') return 'DRAW';
  return state.currentPlayer;
}

export function TurnIndicator(props: TurnIndicatorProps) {
  return (
    <section class={turnClass(props.state)}>
      <div class="turn-banner-meta">
        <span>{`${uiText.turnIndicator.meta.current}: ${activeTag(props.state)}`}</span>
        <span>{`${uiText.turnIndicator.meta.turns}: ${props.state.turnCount} / ${props.state.maxTurns}`}</span>
        <span>{`${uiText.turnIndicator.meta.playableNodes}: ${props.state.actionableNodes}`}</span>
      </div>
    </section>
  );
}