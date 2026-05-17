import type { GameStateDetail } from '../../nexus/events';
import { uiText } from '../../content/uiText';
import { ScorePanel } from '../ScorePanel';
import { TurnIndicator } from '../TurnIndicator';

interface InfoColumnProps {
  state: GameStateDetail;
  onSurrender: () => void;
  onUndo: () => void;
  onConfirm: () => void;
}

export function InfoColumn(props: InfoColumnProps) {
  const confirmClass = () =>
    props.state.currentPlayer === 'P2' ? 'btn btn-danger icon-btn' : 'btn btn-primary icon-btn';

  return (
    <div id="info-col">
      <TurnIndicator state={props.state} />
      <ScorePanel
        scores={props.state.scores}
        phases={props.state.phases}
        currentPlayer={props.state.currentPlayer}
      />
      <div class="primary-actions">
        <button
          type="button"
          class="btn btn-outline icon-btn"
          aria-label={uiText.app.aria.undo}
          disabled={!props.state.canUndo}
          onClick={props.onUndo}
        >
          <span class="icon" aria-hidden="true">↶</span>
          <span class="label">{uiText.actions.undo}</span>
        </button>
        <button
          type="button"
          class="btn btn-surrender icon-btn"
          aria-label={uiText.app.aria.surrender}
          disabled={!props.state.canSurrender}
          onClick={props.onSurrender}
        >
          <span class="icon" aria-hidden="true">×</span>
          <span class="label">{uiText.actions.surrender}</span>
        </button>
        <button
          type="button"
          class={confirmClass()}
          aria-label={uiText.app.aria.confirm}
          disabled={!props.state.canReady}
          onClick={props.onConfirm}
        >
          <span class="icon" aria-hidden="true">✓</span>
          <span class="label">{uiText.actions.confirm}</span>
        </button>
      </div>
    </div>
  );
}
