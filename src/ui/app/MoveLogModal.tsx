import { Show } from 'solid-js';
import type { MoveLogEntry } from '../../nexus/types';
import { uiText } from '../../content/uiText';

interface MoveLogModalProps {
  isOpen: boolean;
  moveLog: MoveLogEntry[];
  onClose: () => void;
}

export function MoveLogModal(props: MoveLogModalProps) {
  return (
    <Show when={props.isOpen}>
      <div class="modal-backdrop" role="presentation" onClick={props.onClose}>
        <section
          class="modal-card box drawer history-modal-card"
          role="dialog"
          aria-modal="true"
          aria-label={uiText.moveLog.dialogLabel}
          onClick={(event) => event.stopPropagation()}
        >
          <div class="history-modal-header">
            <h3>{uiText.moveLog.title}</h3>
            <button
              type="button"
              class="btn btn-icon modal-close-btn"
              aria-label={uiText.moveLog.close}
              onClick={props.onClose}
            >
              <span aria-hidden="true">X</span>
            </button>
          </div>
          <ul class="log-list history-list">
            {[...props.moveLog].reverse().map((entry) => (
              <li class={`log-entry ${entry.player.toLowerCase()}`}>
                <span class="log-dot" />
                <span class="log-text">{entry.label}</span>
              </li>
            ))}
            {props.moveLog.length === 0 && <li class="history-empty">{uiText.moveLog.empty}</li>}
          </ul>
        </section>
      </div>
    </Show>
  );
}
