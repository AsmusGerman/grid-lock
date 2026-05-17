import { Show } from 'solid-js';
import { uiText } from '../../content/uiText';
import type { BoardSize } from './types';

interface NewGameModalProps {
  isOpen: boolean;
  boardSize: BoardSize;
  maxTurns: number;
  onClose: () => void;
  onConfirm: () => void;
  onBoardSizeChange: (size: BoardSize) => void;
}

export function NewGameModal(props: NewGameModalProps) {
  return (
    <Show when={props.isOpen}>
      <div class="modal-backdrop" role="presentation">
        <div
          class="modal-card box drawer"
          role="dialog"
          aria-modal="true"
          aria-label={uiText.app.aria.newGameDialog}
        >
          <h3>{uiText.newGameModal.title}</h3>
          <p>{uiText.newGameModal.description}</p>
          <div class="size-picker-row">
            <label for="new-game-size">{uiText.newGameModal.gridLabel}</label>
            <select
              id="new-game-size"
              value={String(props.boardSize)}
              onChange={(e) => props.onBoardSizeChange(Number(e.currentTarget.value) as BoardSize)}
            >
              <option value="5">{uiText.newGameModal.sizes['5']}</option>
              <option value="7">{uiText.newGameModal.sizes['7']}</option>
              <option value="9">{uiText.newGameModal.sizes['9']}</option>
            </select>
            <span>{`${uiText.newGameModal.turnsLabel}: ${props.maxTurns}`}</span>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" onClick={props.onClose}>
              {uiText.newGameModal.cancel}
            </button>
            <button type="button" class="btn btn-primary" onClick={props.onConfirm}>
              {uiText.newGameModal.confirm}
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
