import type { PlayerID } from '../../nexus/types';
import { uiText } from '../../content/uiText';

interface BottomBarProps {
  currentPlayer: PlayerID;
  canSurrender: boolean;
  canUndo: boolean;
  canReady: boolean;
  onSurrender: () => void;
  onUndo: () => void;
  onConfirm: () => void;
}

export function BottomBar(props: BottomBarProps) {
  return (
    <div class="bottom-bar">
      <button
        type="button"
        class="btn btn-surrender icon-btn bottom-btn"
        aria-label={uiText.app.aria.surrender}
        disabled={!props.canSurrender}
        onClick={props.onSurrender}
      >
        <span class="icon" aria-hidden="true">×</span>
        <span class="label">{uiText.actions.surrender}</span>
      </button>
      <button
        type="button"
        class="btn btn-outline icon-btn bottom-btn"
        aria-label={uiText.app.aria.undo}
        disabled={!props.canUndo}
        onClick={props.onUndo}
      >
        <span class="icon" aria-hidden="true">↶</span>
        <span class="label">{uiText.actions.undoMobile}</span>
      </button>
      <button
        type="button"
        class={`btn icon-btn bottom-btn ${props.currentPlayer === 'P2' ? 'btn-danger' : 'btn-primary'}`}
        aria-label={uiText.app.aria.confirm}
        disabled={!props.canReady}
        onClick={props.onConfirm}
      >
        <span class="icon" aria-hidden="true">✓</span>
        <span class="label">{uiText.actions.confirmMobile}</span>
      </button>
    </div>
  );
}
