import type { GameStateDetail } from '../nexus/events';
interface Props { state: GameStateDetail }
export function TurnIndicator(props: Props) {
  const title = () => props.state.winner === 'draw' ? 'Draw' : props.state.winner ? `${props.state.winner} wins` : `${props.state.currentPlayer} to act`;
  const subtitle = () => props.state.isGameOver ? (props.state.endReason ?? 'Game over').replace(/-/g, ' ') : props.state.bridgeMode ? 'Bridge mode — choose a powered source' : props.state.selectedSource ? 'Choose a highlighted destination' : 'Choose a powered source';
  return (
    <section class={`turn-banner ${props.state.isGameOver ? 'over' : props.state.currentPlayer.toLowerCase()}`} aria-live="polite">
      <strong>{title()}</strong>
      <span>{subtitle()}</span>
      <span>{props.state.actionCount} / {props.state.maxActions} actions</span>
    </section>
  );
}
