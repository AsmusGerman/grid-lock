import { Show } from 'solid-js';

interface HintToastProps {
  message: string | null;
}

export function HintToast(props: HintToastProps) {
  return (
    <Show when={props.message}>
      <div class="hint-toast" role="status" aria-live="polite">
        {props.message}
      </div>
    </Show>
  );
}
