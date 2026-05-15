import type { GameStateDetail } from '../nexus/events';

interface TurnIndicatorProps {
  state: GameStateDetail;
}

function turnTitle(state: GameStateDetail): string {
  if (state.winner === 'draw') return 'Game Over - Draw';
  if (state.winner === 'P1') return 'Game Over - Player 1 wins';
  if (state.winner === 'P2') return 'Game Over - Player 2 wins';
  if (state.phases[state.currentPlayer] === 'Placement') {
    return state.currentPlayer === 'P1' ? 'Player 1 - Place your Source' : 'Player 2 - Place your Source';
  }
  return state.currentPlayer === 'P1' ? 'Player 1 turn' : 'Player 2 turn';
}

function turnClass(state: GameStateDetail): string {
  if (state.winner) return 'turn-banner over';
  return state.currentPlayer === 'P1' ? 'turn-banner p1' : 'turn-banner p2';
}

export function TurnIndicator(props: TurnIndicatorProps) {
  return (
    <section class={turnClass(props.state)}>
      <strong>{turnTitle(props.state)}</strong>
      <div class="turn-banner-meta">
        <span>{`Current: ${props.state.currentPlayer}`}</span>
        <span>{`Turns: ${props.state.turnCount} / ${props.state.maxTurns}`}</span>
        <span>{`Playable nodes: ${props.state.actionableNodes}`}</span>
      </div>
    </section>
  );
}