import { Show, createEffect, createSignal, onCleanup } from 'solid-js';
import { uiText } from '../content/uiText';

interface HintPanelProps {
  isOpen: boolean;
  onClose: () => void;
  triggerEl?: HTMLButtonElement;
}

export function HintPanel(props: HintPanelProps) {
  let modalRef!: HTMLElement;
  const [step, setStep] = createSignal(0);

  createEffect(() => {
    if (!props.isOpen) return;
    setStep(0);

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
          <div class="tutorial-progress" aria-label={`Tutorial step ${step() + 1} of ${uiText.hint.items.length}`}>
            {uiText.hint.items.map((_, index) => <span class={index <= step() ? 'complete' : ''} />)}
          </div>
          <div class="tutorial-step" aria-live="polite">
            <strong>{uiText.hint.items[step()]}</strong>
            <div class="tutorial-demo" aria-hidden="true">
              <span class="demo-core">CORE</span><span class="demo-arrow">→</span><span class="demo-node">{step() === 2 ? '×' : step() === 4 ? '⚡' : '●'}</span>
            </div>
          </div>
          <div class="tutorial-actions">
            <button type="button" class="btn btn-outline" disabled={step() === 0} onClick={() => setStep(value => value - 1)}>Back</button>
            <button type="button" class="btn btn-primary" onClick={() => step() === uiText.hint.items.length - 1 ? props.onClose() : setStep(value => value + 1)}>{step() === uiText.hint.items.length - 1 ? 'Play' : 'Next'}</button>
          </div>
        </section>
      </div>
    </Show>
  );
}
