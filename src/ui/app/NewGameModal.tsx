import { Show } from 'solid-js';
interface Props { isOpen: boolean; onClose: () => void; onConfirm: () => void }
export function NewGameModal(props: Props) {
  return <Show when={props.isOpen}><div class="modal-backdrop" role="presentation"><div class="modal-card box drawer" role="dialog" aria-modal="true" aria-label="Start new game"><h3>START NEW SIEGE</h3><p>Reset to the competitive 5 × 5 board? P1 acts first.</p><div class="modal-actions"><button class="btn btn-outline" onClick={props.onClose}>Cancel</button><button class="btn btn-primary" onClick={props.onConfirm}>Start</button></div></div></div></Show>;
}
