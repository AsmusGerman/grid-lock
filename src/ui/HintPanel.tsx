import { Show, createEffect, onCleanup } from 'solid-js';
import { uiText } from '../content/uiText';

interface HintPanelProps {
  isOpen: boolean;
  onClose: () => void;
  triggerEl?: HTMLButtonElement;
}

export function HintPanel(props: HintPanelProps) {
  let modalRef!: HTMLElement;

  createEffect(() => {
    if (!props.isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') props.onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    queueMicrotask(() => {
      modalRef?.focus();
    });

    onCleanup(() => {
      window.removeEventListener('keydown', onKeyDown);
      props.triggerEl?.focus();
    });
  });

  return (
    <Show when={props.isOpen}>
      <div class="modal-backdrop" role="presentation" onClick={props.onClose}>
        <section
          ref={modalRef}
          class="modal-card box drawer hint-modal-card"
          role="dialog"
          aria-modal="true"
          aria-label={uiText.hint.dialogLabel}
          tabindex={-1}
          onClick={event => event.stopPropagation()}
        >
          <div class="hint-modal-header">
            <h3>{uiText.hint.title}</h3>
            <button
              type="button"
              class="btn btn-icon modal-close-btn"
              aria-label={uiText.hint.close}
              onClick={props.onClose}
            >
              <span aria-hidden="true">X</span>
            </button>
          </div>
          <div class="guide-scroll">
            <ul>
              {uiText.hint.items.map(item => <li>{item}</li>)}
            </ul>
          </div>
        </section>
      </div>
    </Show>
  );
}
